import { env } from "../../config/env.js";
import { AppError } from "../../utils/errors.js";

class KontextError extends AppError {
  constructor(message: string) {
    super(502, message);
    this.name = "KontextError";
  }
}

export type FluxTokenUsage = {
  promptTokens: number;
  outputTokens: number;
  totalTokens: number;
};

const MODEL_ID = "fal-ai/flux-pro/kontext/multi";
const SYNC_URL  = `https://fal.run/${MODEL_ID}`;

// ── Aspect ratio for Kontext (named string, not image_size object) ─────────────

const SUPPORTED_RATIOS = new Set([
  "1:1", "3:4", "4:3", "9:16", "16:9", "2:3", "3:2", "4:5", "5:4", "21:9", "9:21",
]);

function toKontextAspectRatio(aspectRatio?: string, width?: number, height?: number): string {
  if (aspectRatio && SUPPORTED_RATIOS.has(aspectRatio)) return aspectRatio;
  if (width && height) {
    const r = width / height;
    if (r > 1.7)  return "16:9";
    if (r > 1.2)  return "4:3";
    if (r < 0.6)  return "9:16";
    if (r < 0.85) return "3:4";
    return "1:1";
  }
  return "3:4"; // portrait default for fashion
}

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

const RETRYABLE = new Set([429, 503]);
const MAX_RETRIES   = 3;
const BASE_DELAY_MS = 2_000;

async function fetchWithRetry(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<{ resp: Response; body: string }> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1) + Math.random() * 500;
      console.log(`[Kontext] Retry ${attempt}/${MAX_RETRIES} after ${delay | 0}ms…`);
      await sleep(delay);
    }
    try {
      const resp = await fetchWithTimeout(url, init, timeoutMs);
      const body = await resp.text();
      if (!resp.ok && RETRYABLE.has(resp.status) && attempt < MAX_RETRIES) {
        console.warn(`[Kontext] ${resp.status} — will retry`);
        lastError = new KontextError(`fal.ai error (${resp.status}): ${body.slice(0, 400)}`);
        continue;
      }
      return { resp, body };
    } catch (err: any) {
      if (err?.name === "AbortError") throw new KontextError("fal.ai Kontext request timed out.");
      lastError = err;
      if (attempt < MAX_RETRIES) {
        console.warn(`[Kontext] Fetch error: ${String(err?.message || err).slice(0, 200)}`);
        continue;
      }
    }
  }
  throw lastError ?? new KontextError("fal.ai Kontext request failed after retries.");
}

// ── Download generated image as base64 ───────────────────────────────────────

async function downloadImageAsBase64(imageUrl: string): Promise<{ mimeType: string; base64: string }> {
  const resp = await fetchWithTimeout(imageUrl, {}, 60_000);
  if (!resp.ok) throw new KontextError(`Failed to download Kontext image (${resp.status}).`);
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

// ── Resolve image_url for Kontext ────────────────────────────────────────────
//
// Strategy (priority order):
//  1. Try CDN upload — smaller JSON payload, better for large images.
//  2. Fall back to data URI — fal.ai accepts `data:<mime>;base64,<b64>` in image_url.
//
// NEVER proceed without image_url: Kontext treats it as a required field and
// returns HTTP 422 if it is absent.

async function resolveImageUrl(imageBase64: string, mimeType: string): Promise<string> {
  const apiKey = env.FAL_API_KEY;

  // ── Attempt CDN upload ───────────────────────────────────────────────────
  if (apiKey) {
    try {
      const binary = atob(imageBase64);
      const bytes  = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

      const ext      = mimeType.includes("png") ? "png" : "jpg";
      const formData = new FormData();
      formData.append("file", new Blob([bytes], { type: mimeType }), `kontext-ref.${ext}`);

      const resp = await fetchWithTimeout(
        "https://fal.run/files/upload",
        { method: "POST", headers: { Authorization: `Key ${apiKey}` }, body: formData },
        30_000,
      );

      if (resp.ok) {
        const json = await resp.json() as Record<string, unknown>;
        const url  = (json?.url ?? json?.cdn_url ?? json?.file_url ?? null) as string | null;
        if (url) {
          console.log("[Kontext] Context image uploaded to CDN:", url.slice(0, 80) + "…");
          return url;
        }
        console.warn("[Kontext] Upload response missing URL — falling back to data URI.");
      } else {
        const errBody = await resp.text().catch(() => "");
        console.warn(`[Kontext] CDN upload failed (${resp.status}) — falling back to data URI. ${errBody.slice(0, 120)}`);
      }
    } catch (err) {
      console.warn("[Kontext] CDN upload error — falling back to data URI:", String((err as any)?.message || err).slice(0, 200));
    }
  }

  // ── Fallback: data URI ────────────────────────────────────────────────────
  // fal.ai accepts `data:<mime>;base64,<b64>` in the image_url field.
  const safeMime = mimeType || "image/jpeg";
  console.log("[Kontext] Using data URI as image_url (mime:", safeMime, ")");
  return `data:${safeMime};base64,${imageBase64}`;
}

// ── Queue-based polling (fallback when sync endpoint returns 202) ─────────────

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
    if (!resp.ok) throw new KontextError(`Queue status check failed (${resp.status}): ${body.slice(0, 300)}`);

    const status = JSON.parse(body) as { status: string };
    console.log(`[Kontext] Queue: ${status.status}`);

    if (status.status === "COMPLETED") {
      const { resp: rResp, body: rBody } = await fetchWithRetry(
        resultUrl,
        { headers: { Authorization: `Key ${apiKey}` } },
        30_000,
      );
      if (!rResp.ok) throw new KontextError(`Failed to fetch queue result (${rResp.status}).`);
      return JSON.parse(rBody);
    }

    if (status.status === "FAILED") throw new KontextError("fal.ai Kontext generation failed.");
  }

  throw new KontextError("fal.ai Kontext generation timed out.");
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function generateImage(opts: {
  promptText: string;
  /** base64-encoded reference images; first image is uploaded as the Kontext image_url */
  images?: { mimeType: string; data: string }[];
  aspectRatio?: string;
  width?: number;
  height?: number;
  seed?: number;
  timeoutMs?: number;
}): Promise<{
  mimeType: string;
  imageBase64: string;
  raw: unknown;
  tokens: FluxTokenUsage;
}> {
  const apiKey = env.FAL_API_KEY;
  if (!apiKey) throw new KontextError("FAL_API_KEY is not configured on the server.");

  const aspectRatio = toKontextAspectRatio(opts.aspectRatio, opts.width, opts.height);
  const timeoutMs   = opts.timeoutMs ?? 180_000;

  const payload: Record<string, unknown> = {
    prompt:           opts.promptText,
    aspect_ratio:     aspectRatio,
    num_images:       1,
    output_format:    "jpeg",
    safety_tolerance: "2",
  };

  if (typeof opts.seed === "number") payload.seed = opts.seed;

  // Kontext Multi requires image_urls (array) — upload all provided images.
  // IMAGE 1 = garment, IMAGE 2 = model photo (when provided) — matches prompt indexing.
  if (opts.images && opts.images.length > 0) {
    const imageUrls = await Promise.all(
      opts.images.map((img) => resolveImageUrl(img.data, img.mimeType)),
    );
    payload.image_urls = imageUrls;
  } else {
    throw new KontextError("FLUX Kontext Multi requires a reference image. Please upload a garment photo.");
  }

  console.log("[Kontext] Submitting to", MODEL_ID, "| aspect_ratio:", aspectRatio);

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
      throw new KontextError("fal.ai returned non-JSON queue response.");
    }
    const requestId = queueResp?.request_id as string | undefined;
    if (!requestId) throw new KontextError("fal.ai queue response missing request_id.");
    console.log(`[Kontext] Queued — polling request_id=${requestId}…`);
    json = await pollQueueResult(requestId, timeoutMs);
  } else if (!resp.ok) {
    throw new KontextError(`fal.ai Kontext API error (${resp.status}): ${rawBody.slice(0, 500)}`);
  } else {
    try { json = JSON.parse(rawBody); } catch {
      throw new KontextError("fal.ai returned non-JSON response.");
    }
  }

  const imageUrl = (json?.images as any[])?.[0]?.url as string | undefined;
  if (!imageUrl) {
    const detail = JSON.stringify(json).slice(0, 300);
    throw new KontextError(`fal.ai Kontext did not return an image URL. Response: ${detail}`);
  }

  console.log("[Kontext] Downloading generated image…");
  const { mimeType, base64 } = await downloadImageAsBase64(imageUrl);

  return {
    mimeType,
    imageBase64: base64,
    raw:    json,
    tokens: { promptTokens: 0, outputTokens: 0, totalTokens: 0 },
  };
}
