import { getAccessToken, refreshTokenOnce } from "./api";
import type { GeminiInlineImage } from "./gemini";

export type FluxImageResult = {
  mimeType: string;
  imageBase64: string;
  raw: unknown;
};

export class FluxError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FluxError";
  }
}

// ── Uint8Array → base64 string ────────────────────────────────────────────────

function uint8ArrayToBase64(bytes: Uint8Array): string {
  const chunkSize = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

type ApiInlineImage = { mimeType: string; data: string };

function toApiImages(images: GeminiInlineImage[]): ApiInlineImage[] {
  return images.map((img) => ({
    mimeType: img.mimeType,
    data: uint8ArrayToBase64(img.data),
  }));
}

// ── Backend proxy ─────────────────────────────────────────────────────────────

async function proxyFetch<T>(
  path: string,
  payload: unknown,
  timeoutMs: number,
): Promise<T> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), Math.max(1, timeoutMs));

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = getAccessToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    let resp = await fetch(path, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
      credentials: "include",
    });

    if (resp.status === 401 && token) {
      const newToken = await refreshTokenOnce();
      if (newToken) {
        headers["Authorization"] = `Bearer ${newToken}`;
        resp = await fetch(path, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
          signal: controller.signal,
          credentials: "include",
        });
      }
    }

    const text = await resp.text();
    if (!resp.ok) {
      let msg = `Request failed (${resp.status})`;
      try {
        const err = JSON.parse(text);
        if (err?.error) msg = err.error;
      } catch {}
      throw new FluxError(msg);
    }

    return JSON.parse(text) as T;
  } finally {
    clearTimeout(timer);
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function generateFluxImage(opts: {
  promptText: string;
  images?: GeminiInlineImage[];
  aspectRatio?: string;
  width?: number;
  height?: number;
  seed?: number;
  timeoutMs?: number;
}): Promise<FluxImageResult> {
  return proxyFetch<FluxImageResult>(
    "/api/flux/image",
    {
      promptText:  opts.promptText,
      images:      opts.images ? toApiImages(opts.images) : [],
      aspectRatio: opts.aspectRatio,
      width:       opts.width,
      height:      opts.height,
      seed:        opts.seed,
    },
    opts.timeoutMs ?? 240_000,
  );
}
