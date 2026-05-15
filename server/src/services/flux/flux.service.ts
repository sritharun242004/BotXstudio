import { env } from "../../config/env.js";
import { AppError } from "../../utils/errors.js";

class FluxError extends AppError {
  constructor(message: string) {
    super(502, message);
    this.name = "FluxError";
  }
}

export type FluxTokenUsage = {
  promptTokens: number;
  outputTokens: number;
  totalTokens: number;
};

// ── fal.ai FLUX Pro image size mapping ───────────────────────────────────────

type NamedImageSize =
  | "square_hd"
  | "square"
  | "portrait_4_3"
  | "portrait_16_9"
  | "landscape_4_3"
  | "landscape_16_9";

type FluxImageSize = NamedImageSize | { width: number; height: number };

function toFluxImageSize(
  aspectRatio?: string,
  width?: number,
  height?: number,
): FluxImageSize {
  if (width && height) return { width, height };
  switch (aspectRatio) {
    case "1:1": return "square_hd";
    case "4:3": return "landscape_4_3";
    case "3:4": return "portrait_4_3";
    case "16:9": return "landscape_16_9";
    case "9:16": return "portrait_16_9";
    default: return { width: 1080, height: 1440 }; // 3:4 portrait for fashion
  }
}

// ── HTTP helpers ──────────────────────────────────────────────────────────────

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
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

// ── Retry with exponential backoff (429, 503) ─────────────────────────────────

const RETRYABLE_STATUS = new Set([429, 503]);
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 2_000;

async function fetchWithRetry(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<{ resp: Response; body: string }> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
      const jitter = Math.random() * 500;
      console.log(`[Flux] Retry ${attempt}/${MAX_RETRIES} after ${(delay + jitter) | 0}ms…`);
      await sleep(delay + jitter);
    }

    try {
      const resp = await fetchWithTimeout(url, init, timeoutMs);
      const body = await resp.text();

      if (!resp.ok && RETRYABLE_STATUS.has(resp.status) && attempt < MAX_RETRIES) {
        console.warn(`[Flux] Got ${resp.status}, will retry. Body: ${body.slice(0, 200)}`);
        lastError = new FluxError(`fal.ai error (${resp.status}): ${body.slice(0, 400)}`);
        continue;
      }

      return { resp, body };
    } catch (err: any) {
      if (err?.name === "AbortError") throw new FluxError("fal.ai request timed out.");
      lastError = err;
      if (attempt < MAX_RETRIES) {
        console.warn(`[Flux] Fetch error, will retry: ${String(err?.message || err).slice(0, 200)}`);
        continue;
      }
    }
  }

  throw lastError ?? new FluxError("fal.ai request failed after retries.");
}

// ── Download the generated image URL and return as base64 ────────────────────

async function downloadImageAsBase64(
  imageUrl: string,
): Promise<{ mimeType: string; base64: string }> {
  const resp = await fetchWithTimeout(imageUrl, {}, 60_000);
  if (!resp.ok) {
    throw new FluxError(`Failed to download generated image (${resp.status}).`);
  }
  const contentType = resp.headers.get("content-type") || "image/jpeg";
  const mimeType = contentType.split(";")[0].trim() || "image/jpeg";
  const buf = await resp.arrayBuffer();
  const bytes = new Uint8Array(buf);

  // Convert to base64 in 0x8000-byte chunks (avoids call-stack overflow)
  const chunkSize = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return { mimeType, base64: btoa(binary) };
}

// ── Upload a base64 image to fal.ai CDN storage ───────────────────────────────
// Returns the public CDN URL, or null if upload failed.

async function uploadReferenceImageToFal(
  imageBase64: string,
  mimeType: string,
): Promise<string | null> {
  const apiKey = env.FAL_API_KEY;
  if (!apiKey) return null;

  try {
    const binary = atob(imageBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    const ext = mimeType.includes("png") ? "png" : "jpg";
    const formData = new FormData();
    formData.append("file", new Blob([bytes], { type: mimeType }), `reference.${ext}`);

    const resp = await fetchWithTimeout(
      "https://fal.run/files/upload",
      {
        method: "POST",
        headers: { Authorization: `Key ${apiKey}` },
        body: formData,
      },
      30_000,
    );

    if (!resp.ok) {
      console.warn(`[Flux] Reference image upload failed (${resp.status}), proceeding without it.`);
      return null;
    }

    const json = await resp.json() as Record<string, unknown>;
    const url = (json?.url ?? json?.cdn_url ?? json?.file_url ?? null) as string | null;
    if (!url) {
      console.warn("[Flux] Upload response missing URL, proceeding without reference image.");
      return null;
    }
    return url;
  } catch (err) {
    console.warn("[Flux] Could not upload reference image:", String((err as any)?.message || err).slice(0, 200));
    return null;
  }
}

// ── Queue-based async polling (fallback when sync times out) ──────────────────

async function pollQueueResult(
  modelId: string,
  requestId: string,
  timeoutMs: number,
): Promise<unknown> {
  const apiKey = env.FAL_API_KEY!;
  const deadline = Date.now() + timeoutMs;
  const statusUrl = `https://queue.fal.run/${modelId}/requests/${requestId}/status`;
  const resultUrl = `https://queue.fal.run/${modelId}/requests/${requestId}`;

  while (Date.now() < deadline) {
    await sleep(3_000);

    const { resp, body } = await fetchWithRetry(
      statusUrl,
      { headers: { Authorization: `Key ${apiKey}` } },
      15_000,
    );

    if (!resp.ok) {
      throw new FluxError(`[Flux] Queue status check failed (${resp.status}): ${body.slice(0, 300)}`);
    }

    const status = JSON.parse(body) as { status: string };
    console.log(`[Flux] Queue status: ${status.status}`);

    if (status.status === "COMPLETED") {
      const { resp: rResp, body: rBody } = await fetchWithRetry(
        resultUrl,
        { headers: { Authorization: `Key ${apiKey}` } },
        30_000,
      );
      if (!rResp.ok) {
        throw new FluxError(`[Flux] Failed to fetch queue result (${rResp.status}).`);
      }
      return JSON.parse(rBody);
    }

    if (status.status === "FAILED") {
      throw new FluxError("fal.ai queue generation failed.");
    }
  }

  throw new FluxError("fal.ai queue generation timed out.");
}

// ── Main export: generateImage ────────────────────────────────────────────────

export async function generateImage(opts: {
  promptText: string;
  images?: { mimeType: string; data: string }[]; // base64-encoded reference images
  aspectRatio?: string;
  width?: number;
  height?: number;
  seed?: number;
  negativePrompt?: string;
  numInferenceSteps?: number;
  guidanceScale?: number;
  timeoutMs?: number;
}): Promise<{
  mimeType: string;
  imageBase64: string;
  raw: unknown;
  tokens: FluxTokenUsage;
}> {
  const apiKey = env.FAL_API_KEY;
  if (!apiKey) throw new FluxError("FAL_API_KEY is not configured on the server.");

  const imageSize = toFluxImageSize(opts.aspectRatio, opts.width, opts.height);
  const timeoutMs = opts.timeoutMs ?? 180_000;

  const payload: Record<string, unknown> = {
    prompt: opts.promptText,
    image_size: imageSize,
    num_inference_steps: opts.numInferenceSteps ?? 28,
    guidance_scale: opts.guidanceScale ?? 2.5,
    num_images: 1,
    safety_tolerance: "2",
    output_format: "jpeg",
  };

  if (typeof opts.seed === "number") payload.seed = opts.seed;

  // Upload ALL reference images to fal.ai CDN and pass as image_urls array.
  // IMAGE 1 = garment, IMAGE 2 = model photo (when provided) — matches prompt indexing.
  // fal-ai/flux-pro/kontext/multi accepts image_urls (array), not image_url (singular).
  if (opts.images && opts.images.length > 0) {
    const uploadedUrls = await Promise.all(
      opts.images.map((img) => uploadReferenceImageToFal(img.data, img.mimeType)),
    );
    const validUrls = uploadedUrls.filter((u): u is string => u !== null);
    if (validUrls.length > 0) {
      payload.image_urls = validUrls;
      console.log(`[Flux] ${validUrls.length} reference image(s) attached to kontext/multi.`);
    }
  }

  const MODEL_ID = "fal-ai/flux-pro/kontext/multi";
  console.log(`[Flux] Submitting generation to ${MODEL_ID}…`);

  // ── Try sync endpoint first ──────────────────────────────────────────────
  const syncUrl = `https://fal.run/${MODEL_ID}`;

  const { resp, body: rawBody } = await fetchWithRetry(
    syncUrl,
    {
      method: "POST",
      headers: {
        Authorization: `Key ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    timeoutMs,
  );

  let json: any;

  if (resp.status === 202) {
    // ── Async queue fallback ─────────────────────────────────────────────
    let queueResp: any;
    try {
      queueResp = JSON.parse(rawBody);
    } catch {
      throw new FluxError("fal.ai returned non-JSON queue response.");
    }
    const requestId = queueResp?.request_id as string | undefined;
    if (!requestId) throw new FluxError("fal.ai queue response missing request_id.");
    console.log(`[Flux] Queued as request_id=${requestId}, polling…`);
    json = await pollQueueResult(MODEL_ID, requestId, timeoutMs);
  } else if (!resp.ok) {
    throw new FluxError(`fal.ai API error (${resp.status}): ${rawBody.slice(0, 500)}`);
  } else {
    try {
      json = JSON.parse(rawBody);
    } catch {
      throw new FluxError("fal.ai returned non-JSON response.");
    }
  }

  const imageUrl = (json?.images as any[])?.[0]?.url as string | undefined;
  if (!imageUrl) {
    const detail = JSON.stringify(json).slice(0, 300);
    throw new FluxError(`fal.ai did not return an image URL. Response: ${detail}`);
  }

  console.log("[Flux] Downloading generated image…");
  const { mimeType, base64 } = await downloadImageAsBase64(imageUrl);

  return {
    mimeType,
    imageBase64: base64,
    raw: json,
    tokens: { promptTokens: 0, outputTokens: 0, totalTokens: 0 },
  };
}
