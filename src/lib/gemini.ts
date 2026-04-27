import { getAccessToken, refreshTokenOnce } from "./api";

export type GeminiInlineImage = { mimeType: string; data: Uint8Array };

export type GeminiTextResult = { text: string; raw: unknown };
export type GeminiImageResult = { mimeType: string; imageBase64: string; raw: unknown };

export class GeminiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GeminiError";
  }
}

// ─── Utility functions (kept for pipeline.ts / App.tsx compatibility) ────────

function uint8ArrayToBase64(bytes: Uint8Array): string {
  const chunkSize = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

export function base64ToBytes(base64: string): Uint8Array {
  const bin = atob(base64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
}

export async function fileToBytes(file: File): Promise<Uint8Array> {
  const buf = await file.arrayBuffer();
  return new Uint8Array(buf);
}

export async function fileToInlineImage(file: File): Promise<GeminiInlineImage> {
  const bytes = await fileToBytes(file);
  const mimeType = (file.type || "").split(";")[0].trim().toLowerCase() || "application/octet-stream";
  return { mimeType, data: bytes };
}

export function dataUrlToInlineImage(dataUrl: string): GeminiInlineImage {
  const trimmed = (dataUrl || "").trim();
  const match = trimmed.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new GeminiError("Invalid data URL (expected base64-encoded image).");
  }
  const mimeType = match[1].trim().toLowerCase() || "application/octet-stream";
  const data = base64ToBytes(match[2]);
  return { mimeType, data };
}

export function extractJsonObject(text: string): Record<string, unknown> {
  let src = (text || "").trim();
  if (!src) throw new GeminiError("Empty response.");

  if (src.includes("```")) {
    const lines = src.split(/\r?\n/g);
    const chunks: string[] = [];
    let inFence = false;
    for (const line of lines) {
      if (line.trim().startsWith("```")) {
        inFence = !inFence;
        continue;
      }
      if (inFence) chunks.push(line);
    }
    const candidate = chunks.join("\n").trim();
    if (candidate) src = candidate;
  }

  const start = src.indexOf("{");
  const end = src.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new GeminiError("No JSON object found.");
  }
  try {
    return JSON.parse(src.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    throw new GeminiError("Failed to parse JSON.");
  }
}

// ─── Convert GeminiInlineImage (Uint8Array) to API format (base64 string) ────

type ApiInlineImage = { mimeType: string; data: string };

function toApiImages(images: GeminiInlineImage[]): ApiInlineImage[] {
  return images.map((img) => ({
    mimeType: img.mimeType,
    data: uint8ArrayToBase64(img.data),
  }));
}

// ─── Backend proxy calls ─────────────────────────────────────────────────────

async function proxyFetch<T>(path: string, payload: unknown, timeoutMs: number): Promise<T> {
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

    // Auto-refresh on 401 (mutex-protected to avoid concurrent refresh races)
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
      throw new GeminiError(msg);
    }

    return JSON.parse(text) as T;
  } finally {
    clearTimeout(timer);
  }
}

/** Generate text via backend proxy (API key stays server-side) */
export async function generateText(opts: {
  model: string;
  promptText: string;
  images?: GeminiInlineImage[] | null;
  timeoutMs?: number;
  temperature?: number;
  maxOutputTokens?: number;
}): Promise<GeminiTextResult> {
  return proxyFetch<GeminiTextResult>("/api/generate/plan", {
    model: opts.model,
    promptText: opts.promptText,
    images: opts.images ? toApiImages(opts.images) : undefined,
    temperature: opts.temperature,
    maxOutputTokens: opts.maxOutputTokens,
  }, opts.timeoutMs ?? 120_000);
}

/** Generate image via backend proxy (API key stays server-side) */
export async function generateImage(opts: {
  model: string;
  promptText: string;
  images: GeminiInlineImage[];
  timeoutMs?: number;
  temperature?: number;
  aspectRatio?: string;
  width?: number;
  height?: number;
}): Promise<GeminiImageResult> {
  return proxyFetch<GeminiImageResult>("/api/generate/image", {
    model: opts.model,
    promptText: opts.promptText,
    images: toApiImages(opts.images),
    temperature: opts.temperature,
    aspectRatio: opts.aspectRatio,
    width: opts.width,
    height: opts.height,
  }, opts.timeoutMs ?? 180_000);
}
