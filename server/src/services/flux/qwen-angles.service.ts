import { env } from "../../config/env.js";
import { AppError } from "../../utils/errors.js";

class QwenAnglesError extends AppError {
  constructor(message: string) {
    super(502, message);
    this.name = "QwenAnglesError";
  }
}

const MODEL_ID = "fal-ai/qwen-image-edit-2511-multiple-angles";
const SYNC_URL  = `https://fal.run/${MODEL_ID}`;

// ── HTTP helpers ──────────────────────────────────────────────────────────────

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), Math.max(1, timeoutMs));
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

const RETRYABLE    = new Set([429, 503]);
const MAX_RETRIES  = 3;
const BASE_DELAY   = 2_000;

async function fetchWithRetry(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<{ resp: Response; body: string }> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      const delay = BASE_DELAY * Math.pow(2, attempt - 1) + Math.random() * 500;
      console.log(`[QwenAngles] Retry ${attempt}/${MAX_RETRIES} after ${delay | 0}ms…`);
      await sleep(delay);
    }
    try {
      const resp = await fetchWithTimeout(url, init, timeoutMs);
      const body = await resp.text();
      if (!resp.ok && RETRYABLE.has(resp.status) && attempt < MAX_RETRIES) {
        console.warn(`[QwenAngles] ${resp.status} — will retry`);
        lastError = new QwenAnglesError(`fal.ai error (${resp.status}): ${body.slice(0, 400)}`);
        continue;
      }
      return { resp, body };
    } catch (err: any) {
      if (err?.name === "AbortError") throw new QwenAnglesError("fal.ai Qwen request timed out.");
      lastError = err;
      if (attempt < MAX_RETRIES) {
        console.warn(`[QwenAngles] Fetch error: ${String(err?.message || err).slice(0, 200)}`);
        continue;
      }
    }
  }
  throw lastError ?? new QwenAnglesError("fal.ai Qwen request failed after retries.");
}

// ── CDN upload — same pattern as Kontext ────────────────────────────────────

async function resolveImageUrl(imageBase64: string, mimeType: string): Promise<string> {
  const apiKey = env.FAL_API_KEY;

  if (apiKey) {
    try {
      const binary = atob(imageBase64);
      const bytes  = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

      const ext      = mimeType.includes("png") ? "png" : "jpg";
      const formData = new FormData();
      formData.append("file", new Blob([bytes], { type: mimeType }), `qwen-ref.${ext}`);

      const resp = await fetchWithTimeout(
        "https://fal.run/files/upload",
        { method: "POST", headers: { Authorization: `Key ${apiKey}` }, body: formData },
        30_000,
      );

      if (resp.ok) {
        const json = await resp.json() as Record<string, unknown>;
        const url  = (json?.url ?? json?.cdn_url ?? json?.file_url ?? null) as string | null;
        if (url) {
          console.log("[QwenAngles] Image uploaded to CDN:", url.slice(0, 80) + "…");
          return url;
        }
        console.warn("[QwenAngles] CDN upload response missing URL — falling back to data URI.");
      } else {
        const errBody = await resp.text().catch(() => "");
        console.warn(`[QwenAngles] CDN upload failed (${resp.status}) — falling back to data URI. ${errBody.slice(0, 120)}`);
      }
    } catch (err) {
      console.warn("[QwenAngles] CDN upload error — falling back to data URI:", String((err as any)?.message || err).slice(0, 200));
    }
  }

  const safeMime = mimeType || "image/jpeg";
  console.log("[QwenAngles] Using data URI as image_url (mime:", safeMime, ")");
  return `data:${safeMime};base64,${imageBase64}`;
}

// ── Download result image as base64 ──────────────────────────────────────────

async function downloadImageAsBase64(imageUrl: string): Promise<{ mimeType: string; base64: string }> {
  const resp = await fetchWithTimeout(imageUrl, {}, 60_000);
  if (!resp.ok) throw new QwenAnglesError(`Failed to download Qwen image (${resp.status}).`);
  const contentType = resp.headers.get("content-type") || "image/jpeg";
  const mimeType    = contentType.split(";")[0].trim() || "image/jpeg";
  const buf         = await resp.arrayBuffer();
  const bytes       = new Uint8Array(buf);
  const chunkSize   = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return { mimeType, base64: btoa(binary) };
}

// ── Queue polling (fallback when sync returns 202) ────────────────────────────

async function pollQueueResult(requestId: string, timeoutMs: number): Promise<unknown> {
  const apiKey    = env.FAL_API_KEY!;
  const deadline  = Date.now() + timeoutMs;
  const statusUrl = `https://queue.fal.run/${MODEL_ID}/requests/${requestId}/status`;
  const resultUrl = `https://queue.fal.run/${MODEL_ID}/requests/${requestId}`;

  while (Date.now() < deadline) {
    await sleep(3_000);

    const { resp, body } = await fetchWithRetry(
      statusUrl,
      { headers: { Authorization: `Key ${apiKey}` } },
      15_000,
    );
    if (!resp.ok) throw new QwenAnglesError(`Queue status check failed (${resp.status}): ${body.slice(0, 300)}`);

    const status = JSON.parse(body) as { status: string };
    console.log(`[QwenAngles] Queue: ${status.status}`);

    if (status.status === "COMPLETED") {
      const { resp: rResp, body: rBody } = await fetchWithRetry(
        resultUrl,
        { headers: { Authorization: `Key ${apiKey}` } },
        30_000,
      );
      if (!rResp.ok) throw new QwenAnglesError(`Failed to fetch queue result (${rResp.status}).`);
      return JSON.parse(rBody);
    }

    if (status.status === "FAILED") throw new QwenAnglesError("fal.ai Qwen generation failed.");
  }

  throw new QwenAnglesError("fal.ai Qwen generation timed out.");
}

// ── Main export ───────────────────────────────────────────────────────────────
//
// Angle reference:
//   horizontal_angle: 0=front, 90=right side, 180=back, 270=left side
//   vertical_angle:  -30=low-angle, 0=eye-level, 30=slightly above
//   zoom:             0=wide shot, 5=full body (default), 9=close-up detail

export async function generateAngle(opts: {
  /** base64-encoded primary rendered image (Gemini Flash output) */
  imageBase64:      string;
  mimeType:         string;
  horizontalAngle:  number;
  verticalAngle:    number;
  zoom?:            number;
  additionalPrompt?: string;
  outputFormat?:    "jpeg" | "png";
  seed?:            number;
  timeoutMs?:       number;
}): Promise<{
  mimeType:    string;
  imageBase64: string;
  raw:         unknown;
}> {
  const apiKey = env.FAL_API_KEY;
  if (!apiKey) throw new QwenAnglesError("FAL_API_KEY is not configured on the server.");

  const imageUrl  = await resolveImageUrl(opts.imageBase64, opts.mimeType);
  const timeoutMs = opts.timeoutMs ?? 180_000;

  const payload: Record<string, unknown> = {
    image_urls:           [imageUrl],
    horizontal_angle:     opts.horizontalAngle,
    vertical_angle:       opts.verticalAngle,
    zoom:                 opts.zoom ?? 5,
    lora_scale:           1,
    guidance_scale:       4.5,
    num_inference_steps:  28,
    acceleration:         "regular",
    output_format:        opts.outputFormat ?? "jpeg",
    num_images:           1,
    enable_safety_checker: false,
  };

  if (opts.additionalPrompt?.trim()) payload.additional_prompt = opts.additionalPrompt.trim();
  if (typeof opts.seed === "number")  payload.seed = opts.seed;

  console.log(
    `[QwenAngles] Submitting — h:${opts.horizontalAngle}° v:${opts.verticalAngle}° zoom:${opts.zoom ?? 5}`,
  );

  const { resp, body: rawBody } = await fetchWithRetry(
    SYNC_URL,
    {
      method:  "POST",
      headers: { Authorization: `Key ${apiKey}`, "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    },
    timeoutMs,
  );

  let json: any;

  if (resp.status === 202) {
    let queueResp: any;
    try { queueResp = JSON.parse(rawBody); } catch {
      throw new QwenAnglesError("fal.ai returned non-JSON queue response.");
    }
    const requestId = queueResp?.request_id as string | undefined;
    if (!requestId) throw new QwenAnglesError("fal.ai queue response missing request_id.");
    console.log(`[QwenAngles] Queued — polling request_id=${requestId}…`);
    json = await pollQueueResult(requestId, timeoutMs);
  } else if (!resp.ok) {
    throw new QwenAnglesError(`fal.ai Qwen API error (${resp.status}): ${rawBody.slice(0, 500)}`);
  } else {
    try { json = JSON.parse(rawBody); } catch {
      throw new QwenAnglesError("fal.ai returned non-JSON response.");
    }
  }

  const imgUrl = (json?.images as any[])?.[0]?.url as string | undefined;
  if (!imgUrl) {
    const detail = JSON.stringify(json).slice(0, 300);
    throw new QwenAnglesError(`fal.ai Qwen did not return an image URL. Response: ${detail}`);
  }

  console.log("[QwenAngles] Downloading generated image…");
  const { mimeType, base64 } = await downloadImageAsBase64(imgUrl);
  return { mimeType, imageBase64: base64, raw: json };
}
