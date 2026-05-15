// ── Qwen Image Edit Multi-Angles — frontend proxy ────────────────────────────
// Calls POST /api/qwen/angles (backend proxies to fal-ai/qwen-image-edit-2511-multiple-angles).
// Only the rendered primary image is sent — raw garment/model/pose refs excluded.
//
// Angle reference (horizontal_angle):
//   0   = front view  (same as original)
//   90  = right side
//   180 = back view
//   270 = left side
//
// zoom: 0=wide, 5=full body (default), 9=close-up detail

import { getAccessToken, refreshTokenOnce } from "./api";
import type { GeminiInlineImage } from "./gemini";

export type QwenAnglesResult = {
  mimeType:    string;
  imageBase64: string;
  raw:         unknown;
};

export class QwenAnglesError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QwenAnglesError";
  }
}

// ── Uint8Array → base64 ───────────────────────────────────────────────────────

function uint8ArrayToBase64(bytes: Uint8Array): string {
  const chunkSize = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

// ── Backend proxy fetch ───────────────────────────────────────────────────────

async function proxyFetch<T>(payload: unknown, timeoutMs: number): Promise<T> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), Math.max(1, timeoutMs));

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = getAccessToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    let resp = await fetch("/api/qwen/angles", {
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
        resp = await fetch("/api/qwen/angles", {
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
      let msg = `Qwen request failed (${resp.status})`;
      try {
        const err = JSON.parse(text);
        if (err?.error) msg = err.error;
      } catch {}
      throw new QwenAnglesError(msg);
    }

    return JSON.parse(text) as T;
  } finally {
    clearTimeout(timer);
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function generateQwenAngle(opts: {
  /** The rendered Gemini Flash primary image */
  image:            GeminiInlineImage;
  horizontalAngle:  number;
  verticalAngle:    number;
  zoom?:            number;
  additionalPrompt?: string;
  seed?:            number;
  timeoutMs?:       number;
}): Promise<QwenAnglesResult> {
  return proxyFetch<QwenAnglesResult>(
    {
      image:            { mimeType: opts.image.mimeType, data: uint8ArrayToBase64(opts.image.data) },
      horizontalAngle:  opts.horizontalAngle,
      verticalAngle:    opts.verticalAngle,
      zoom:             opts.zoom,
      additionalPrompt: opts.additionalPrompt,
      outputFormat:     "jpeg",
      seed:             opts.seed,
    },
    opts.timeoutMs ?? 240_000,
  );
}
