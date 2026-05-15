// GPT Image 2 Edit via fal.ai — https://fal.ai/models/openai/gpt-image-2/edit
// Uses the edit endpoint so GPT treats the garment image as an in-painting
// reference rather than a generation hint — much better garment preservation.
// Reference images are uploaded to fal.ai CDN (with data-URI fallback).

import { env } from "../../config/env.js";
import { AppError } from "../../utils/errors.js";

class GptImageError extends AppError {
  constructor(message: string) {
    super(502, message);
    this.name = "GptImageError";
  }
}

export type GptImageTokenUsage = {
  promptTokens: number;
  outputTokens: number;
  totalTokens: number;
};

export type GptImageQuality = "low" | "medium" | "high" | "auto";

export type GptImageSize =
  | "1024x1024"
  | "1536x1024"
  | "1024x1536"
  | "auto";

const MODEL_ID = "openai/gpt-image-2/edit";
const SYNC_URL = `https://fal.run/${MODEL_ID}`;

// ── HTTP helpers ──────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

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
      console.log(`[GptImage2] Retry ${attempt}/${MAX_RETRIES} after ${delay | 0}ms…`);
      await sleep(delay);
    }
    try {
      const resp = await fetchWithTimeout(url, init, timeoutMs);
      const body = await resp.text();
      if (!resp.ok && RETRYABLE.has(resp.status) && attempt < MAX_RETRIES) {
        console.warn(`[GptImage2] ${resp.status} — will retry`);
        lastError = new GptImageError(`fal.ai error (${resp.status}): ${body.slice(0, 400)}`);
        continue;
      }
      return { resp, body };
    } catch (err: any) {
      if (err?.name === "AbortError") throw new GptImageError("GPT Image 2 request timed out.");
      lastError = err;
      if (attempt < MAX_RETRIES) {
        console.warn(`[GptImage2] Fetch error: ${String(err?.message || err).slice(0, 200)}`);
        continue;
      }
    }
  }
  throw lastError ?? new GptImageError("GPT Image 2 request failed after retries.");
}

// ── CDN upload with data-URI fallback ─────────────────────────────────────────

async function resolveImageUrl(imageBase64: string, mimeType: string): Promise<string> {
  const apiKey = env.GPT_IMAGE_API_KEY ?? env.FAL_API_KEY;

  if (apiKey) {
    try {
      const binary = atob(imageBase64);
      const bytes  = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

      const ext      = mimeType.includes("png") ? "png" : "jpg";
      const formData = new FormData();
      formData.append("file", new Blob([bytes], { type: mimeType }), `gpt-ref.${ext}`);

      const resp = await fetchWithTimeout(
        "https://fal.run/files/upload",
        { method: "POST", headers: { Authorization: `Key ${apiKey}` }, body: formData },
        30_000,
      );

      if (resp.ok) {
        const json = await resp.json() as Record<string, unknown>;
        const url  = (json?.url ?? json?.cdn_url ?? json?.file_url ?? null) as string | null;
        if (url) {
          console.log("[GptImage2] Context image uploaded to CDN:", url.slice(0, 80) + "…");
          return url;
        }
        console.warn("[GptImage2] Upload response missing URL — falling back to data URI.");
      } else {
        const errBody = await resp.text().catch(() => "");
        console.warn(`[GptImage2] CDN upload failed (${resp.status}) — falling back to data URI. ${errBody.slice(0, 120)}`);
      }
    } catch (err) {
      console.warn("[GptImage2] CDN upload error — falling back to data URI:", String((err as any)?.message || err).slice(0, 200));
    }
  }

  const safeMime = mimeType || "image/jpeg";
  console.log("[GptImage2] Using data URI as image_url (mime:", safeMime, ")");
  return `data:${safeMime};base64,${imageBase64}`;
}

// ── Download generated image as base64 ───────────────────────────────────────

async function downloadImageAsBase64(imageUrl: string): Promise<{ mimeType: string; base64: string }> {
  const resp = await fetchWithTimeout(imageUrl, {}, 60_000);
  if (!resp.ok) throw new GptImageError(`Failed to download GPT Image 2 result (${resp.status}).`);
  const contentType = resp.headers.get("content-type") || "image/png";
  const mimeType    = contentType.split(";")[0].trim() || "image/png";
  const buf         = await resp.arrayBuffer();
  const bytes       = new Uint8Array(buf);
  const chunkSize   = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return { mimeType, base64: btoa(binary) };
}

// ── Queue polling ─────────────────────────────────────────────────────────────

async function pollQueueResult(requestId: string, timeoutMs: number): Promise<unknown> {
  const apiKey    = (env.GPT_IMAGE_API_KEY ?? env.FAL_API_KEY)!;
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
    if (!resp.ok) throw new GptImageError(`Queue status check failed (${resp.status}): ${body.slice(0, 300)}`);

    const status = JSON.parse(body) as { status: string };
    console.log(`[GptImage2] Queue: ${status.status}`);

    if (status.status === "COMPLETED") {
      const { resp: rResp, body: rBody } = await fetchWithRetry(
        resultUrl,
        { headers: { Authorization: `Key ${apiKey}` } },
        30_000,
      );
      if (!rResp.ok) throw new GptImageError(`Failed to fetch queue result (${rResp.status}).`);
      return JSON.parse(rBody);
    }

    if (status.status === "FAILED") throw new GptImageError("GPT Image 2 generation failed.");
  }

  throw new GptImageError("GPT Image 2 generation timed out.");
}

// ── Map pixel-dimension size strings to fal.ai named sizes ───────────────────
// fal.ai accepts: square_hd | square | portrait_4_3 | portrait_16_9 | landscape_4_3 | landscape_16_9 | auto

function toFalSize(size: string): string {
  switch (size) {
    case "1024x1024": return "square_hd";
    case "512x512":   return "square";
    case "1024x1536":
    case "768x1024":  return "portrait_4_3";
    case "576x1024":  return "portrait_16_9";
    case "1536x1024":
    case "1024x768":  return "landscape_4_3";
    case "1024x576":  return "landscape_16_9";
    case "auto":      return "portrait_4_3"; // fashion default
    default:          return "portrait_4_3";
  }
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function generateImage(opts: {
  promptText: string;
  images?: { mimeType: string; data: string }[];
  quality?: GptImageQuality;
  size?: GptImageSize;
  timeoutMs?: number;
}): Promise<{
  mimeType: string;
  imageBase64: string;
  raw: unknown;
  tokens: GptImageTokenUsage;
}> {
  const apiKey = env.GPT_IMAGE_API_KEY ?? env.FAL_API_KEY;
  if (!apiKey) throw new GptImageError("GPT_IMAGE_API_KEY (or FAL_API_KEY) is not configured on the server.");

  // Edit endpoint default: high quality (vs medium for generation endpoint)
  const quality   = opts.quality  ?? "high";
  const size      = opts.size     ?? "1024x1536";
  const timeoutMs = opts.timeoutMs ?? 180_000;

  const payload: Record<string, unknown> = {
    prompt:        opts.promptText,
    image_size:    toFalSize(size),
    quality:       quality === "auto" ? "high" : quality,
    num_images:    1,
    output_format: "png",
  };

  // Edit endpoint requires image_urls (array) — upload all provided images to CDN.
  // IMAGE 1 = garment, IMAGE 2 = model photo (when provided) — matches prompt indexing.
  if (opts.images && opts.images.length > 0) {
    const imageUrls = await Promise.all(
      opts.images.map((img) => resolveImageUrl(img.data, img.mimeType)),
    );
    payload.image_urls = imageUrls;
  }

  console.log("[GptImage2] Submitting to", MODEL_ID, "| size:", payload.image_size, "quality:", quality);

  const { resp, body: rawBody } = await fetchWithRetry(
    SYNC_URL,
    {
      method:  "POST",
      headers: { Authorization: `Key ${apiKey}`, "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    },
    timeoutMs,
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let json: any;

  if (resp.status === 202) {
    let queueResp: any;
    try { queueResp = JSON.parse(rawBody); } catch {
      throw new GptImageError("fal.ai returned non-JSON queue response.");
    }
    const requestId = queueResp?.request_id as string | undefined;
    if (!requestId) throw new GptImageError("fal.ai queue response missing request_id.");
    console.log(`[GptImage2] Queued — polling request_id=${requestId}…`);
    json = await pollQueueResult(requestId, timeoutMs);
  } else if (!resp.ok) {
    throw new GptImageError(`fal.ai GPT Image 2 error (${resp.status}): ${rawBody.slice(0, 500)}`);
  } else {
    try { json = JSON.parse(rawBody); } catch {
      throw new GptImageError("fal.ai returned non-JSON response.");
    }
  }

  const imageUrl = (json?.images as any[])?.[0]?.url as string | undefined;
  if (!imageUrl) {
    throw new GptImageError(`fal.ai GPT Image 2 returned no image URL. Response: ${JSON.stringify(json).slice(0, 300)}`);
  }

  console.log("[GptImage2] Downloading generated image…");
  const { mimeType, base64 } = await downloadImageAsBase64(imageUrl);

  return {
    mimeType,
    imageBase64: base64,
    raw:    json,
    tokens: { promptTokens: 0, outputTokens: 0, totalTokens: 0 },
  };
}
