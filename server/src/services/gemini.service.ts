import { env } from "../config/env.js";
import { AppError } from "../utils/errors.js";

type InlineImage = { mimeType: string; data: string }; // data is base64

class GeminiError extends AppError {
  constructor(message: string) {
    super(502, message);
    this.name = "GeminiError";
  }
}

function normalizeModelName(model: string, fallback: string): string {
  const trimmed = (model || "").trim();
  const effective = trimmed || fallback;
  if (!effective) return "models/gemini-2.5-flash-image";
  if (effective.startsWith("models/") || effective.startsWith("tunedModels/")) return effective;
  return `models/${effective}`;
}

function pickResponseJsonText(result: any): string {
  const parts = (((result?.candidates ?? [])[0]?.content ?? {})?.parts ?? []) as any[];
  const texts: string[] = [];
  for (const part of parts) {
    if (typeof part?.text === "string" && part.text.trim()) texts.push(part.text);
  }
  return texts.join("\n").trim();
}

export type TokenUsage = {
  promptTokens: number;
  outputTokens: number;
  totalTokens: number;
};

function extractTokenUsage(json: any): TokenUsage {
  const meta = json?.usageMetadata;
  return {
    promptTokens: meta?.promptTokenCount ?? 0,
    outputTokens: meta?.candidatesTokenCount ?? 0,
    totalTokens: meta?.totalTokenCount ?? 0,
  };
}

function pickResponseInlineImage(result: any): { mimeType: string; data: string } | null {
  const parts = (((result?.candidates ?? [])[0]?.content ?? {})?.parts ?? []) as any[];
  for (const part of parts) {
    const inline = part?.inline_data ?? part?.inlineData;
    if (inline?.data) {
      return {
        mimeType: (inline?.mime_type ?? inline?.mimeType ?? "image/png").toString(),
        data: inline.data.toString(),
      };
    }
  }
  return null;
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), Math.max(1, timeoutMs));
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

/* ── Retry with exponential backoff for transient errors (503, 429) ── */

const RETRYABLE_STATUS_CODES = new Set([429, 503]);
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 2_000; // 2s, 4s, 8s

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchWithRetry(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<{ resp: Response; body: string }> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1); // 2s, 4s, 8s
      const jitter = Math.random() * 500;
      console.log(`[Gemini] Retry ${attempt}/${MAX_RETRIES} after ${delay + jitter | 0}ms...`);
      await sleep(delay + jitter);
    }

    try {
      const resp = await fetchWithTimeout(url, init, timeoutMs);
      const body = await resp.text();

      if (!resp.ok && RETRYABLE_STATUS_CODES.has(resp.status) && attempt < MAX_RETRIES) {
        console.warn(`[Gemini] Got ${resp.status}, will retry. Body: ${body.slice(0, 200)}`);
        lastError = new GeminiError(`Gemini API error (${resp.status}): ${body.slice(0, 500)}`);
        continue;
      }

      return { resp, body };
    } catch (err: any) {
      // Abort errors (timeout) are not retryable
      if (err?.name === "AbortError") throw new GeminiError("Gemini API request timed out.");
      lastError = err;
      if (attempt < MAX_RETRIES) {
        console.warn(`[Gemini] Fetch error, will retry: ${String(err?.message || err).slice(0, 200)}`);
        continue;
      }
    }
  }

  throw lastError ?? new GeminiError("Gemini API request failed after retries.");
}

const PROMPT_QUALITY_MARKER = "Photo quality requirements:";
const PROMPT_PHOTOSHOOT_QUALITY_BLOCK = [
  "Photo quality requirements:",
  "- Output resolution: 1080×1440 pixels (3:4 portrait).",
  "- Photorealistic, high-resolution, ultra-sharp detail, crisp focus (no motion blur).",
  "- Professional high-end fashion/product photoshoot look (studio-grade lighting, clean color, high dynamic range).",
  "- Accurate textures (skin/fabric), natural shadows, realistic perspective and depth.",
  "- Shot on a high-end camera with a premium lens; clean, natural bokeh where applicable.",
  "- Composition: keep the main subject large and fully in frame; avoid extreme wide shots with a tiny subject.",
  "- Color & finish: balanced exposure, medium contrast, gentle highlight roll-off; natural skin tones; no crushed blacks or blown highlights.",
  "- Detail: preserve natural skin texture (no plastic/over-smoothed retouching); enhance fabric micro-contrast so seams/weave/print read clearly.",
  "- Avoid: low-res, blurry, noise, compression artifacts, over-smoothing/plastic look, CGI/cartoon look.",
].join("\n");

function enhanceImagePrompt(promptText: string): string {
  const trimmed = (promptText || "").trim();
  if (!trimmed) return PROMPT_PHOTOSHOOT_QUALITY_BLOCK;
  if (trimmed.includes(PROMPT_QUALITY_MARKER)) return trimmed;
  return `${trimmed}\n\n${PROMPT_PHOTOSHOOT_QUALITY_BLOCK}`;
}

/** Generate text from Gemini (plan look from garment) */
export async function generateText(opts: {
  model?: string;
  promptText: string;
  images?: InlineImage[];
  timeoutMs?: number;
  temperature?: number;
  maxOutputTokens?: number;
}): Promise<{ text: string; raw: unknown; tokens: TokenUsage }> {
  const modelName = normalizeModelName(opts.model || "", "gemini-2.5-flash");
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent`;
  const url = `${endpoint}?${new URLSearchParams({ key: env.GEMINI_API_KEY }).toString()}`;

  const parts: any[] = [{ text: opts.promptText }];
  for (const img of opts.images ?? []) {
    parts.push({
      inlineData: { mimeType: img.mimeType, data: img.data },
    });
  }

  const payload: any = {
    contents: [{ role: "user", parts }],
    generationConfig: {
      temperature: typeof opts.temperature === "number" ? opts.temperature : 0.2,
      ...(typeof opts.maxOutputTokens === "number" ? { maxOutputTokens: opts.maxOutputTokens } : {}),
    },
  };

  const { resp, body: rawBody } = await fetchWithRetry(
    url,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    typeof opts.timeoutMs === "number" ? opts.timeoutMs : 120_000,
  );

  if (!resp.ok) {
    throw new GeminiError(`Gemini API error (${resp.status}): ${rawBody.slice(0, 500)}`);
  }

  let json: any;
  try {
    json = JSON.parse(rawBody);
  } catch {
    throw new GeminiError("Gemini API returned non-JSON response.");
  }

  const text = pickResponseJsonText(json);
  if (!text) throw new GeminiError("Gemini API did not return text.");
  return { text, raw: json, tokens: extractTokenUsage(json) };
}

/** Generate image from Gemini */
export async function generateImage(opts: {
  model?: string;
  promptText: string;
  images: InlineImage[];
  timeoutMs?: number;
  temperature?: number;
  aspectRatio?: string;
  width?: number;
  height?: number;
}): Promise<{ mimeType: string; imageBase64: string; raw: unknown; tokens: TokenUsage }> {
  const modelName = normalizeModelName(opts.model || "", "gemini-2.5-flash-image");
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent`;
  const url = `${endpoint}?${new URLSearchParams({ key: env.GEMINI_API_KEY }).toString()}`;

  const parts: any[] = [{ text: enhanceImagePrompt(opts.promptText) }];
  for (const img of opts.images ?? []) {
    parts.push({
      inlineData: { mimeType: img.mimeType, data: img.data },
    });
  }

  // Flash models require IMAGE-only modality — adding TEXT causes IMAGE_OTHER finish reason.
  // Pro models require TEXT+IMAGE or they silently return a text refusal instead of an image.
  const isFlash = (modelName || "").toLowerCase().includes("flash");
  const responseModalities = isFlash ? ["IMAGE"] : ["TEXT", "IMAGE"];

  const payloadBase: any = {
    contents: [{ role: "user", parts }],
    generationConfig: {
      temperature: typeof opts.temperature === "number" ? opts.temperature : 0.2,
      responseModalities,
      // Gemini image generation only supports aspectRatio in imageConfig.
      // width/height are Vertex-only and cause IMAGE_OTHER on the standard API.
      ...(opts.aspectRatio
        ? { imageConfig: { aspectRatio: opts.aspectRatio } }
        : {}),
    },
  };

  async function post(payload: any): Promise<any> {
    const { resp, body: rawBody } = await fetchWithRetry(
      url,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
      typeof opts.timeoutMs === "number" ? opts.timeoutMs : 180_000,
    );

    if (!resp.ok) {
      throw new GeminiError(`Gemini API error (${resp.status}): ${rawBody.slice(0, 500)}`);
    }

    try {
      return JSON.parse(rawBody);
    } catch {
      throw new GeminiError("Gemini API returned non-JSON response.");
    }
  }

  // IMAGE_OTHER is a transient application-level refusal (HTTP 200, no image in body).
  // Unlike HTTP 429/503 (handled by fetchWithRetry), it needs a higher-level retry loop.
  const MAX_IMAGE_OTHER_RETRIES = 2;

  for (let attempt = 0; attempt <= MAX_IMAGE_OTHER_RETRIES; attempt++) {
    if (attempt > 0) {
      const delay = 3_000 * attempt; // 3s, 6s
      console.warn(`[Gemini] IMAGE_OTHER — retry ${attempt}/${MAX_IMAGE_OTHER_RETRIES} after ${delay}ms…`);
      await sleep(delay);
    }

    let json: any;
    try {
      json = await post(payloadBase);
    } catch (err: any) {
      const msg = String(err?.message || err);
      const isImageConfigError =
        opts.aspectRatio &&
        (msg.includes("Unknown name") ||
          msg.includes("unknown field") ||
          msg.includes("Invalid JSON payload") ||
          msg.includes("imageConfig") ||
          msg.includes("aspectRatio"));
      if (!isImageConfigError) throw err;

      // aspectRatio not accepted by this model variant — retry without imageConfig
      const payloadFallback = {
        ...payloadBase,
        generationConfig: { ...payloadBase.generationConfig },
      };
      delete payloadFallback.generationConfig.imageConfig;
      json = await post(payloadFallback);
    }

    const inline = pickResponseInlineImage(json);
    if (inline) {
      return { mimeType: inline.mimeType, imageBase64: inline.data, raw: json, tokens: extractTokenUsage(json) };
    }

    const responseText = pickResponseJsonText(json);
    const detail = (responseText || "").trim();
    const finishReason = json?.candidates?.[0]?.finishReason ?? "";
    const blockReason = json?.promptFeedback?.blockReason ?? "";
    const safetyRatings = json?.candidates?.[0]?.safetyRatings
      ? JSON.stringify(json.candidates[0].safetyRatings).slice(0, 300)
      : "";

    // Retry on IMAGE_OTHER (transient) or blockReason=OTHER (transient content filter).
    // Other finish reasons (SAFETY, MAX_TOKENS, RECITATION, etc.) are final — do not retry.
    const isRetryable = finishReason === "IMAGE_OTHER" || blockReason === "OTHER";
    if (!isRetryable || attempt === MAX_IMAGE_OTHER_RETRIES) {
      console.error("[Gemini] No image returned.", { model: modelName, finishReason, blockReason, safetyRatings, responseText: detail.slice(0, 300) });
      throw new GeminiError(
        [
          "Gemini API did not return an image.",
          finishReason ? ` Finish reason: ${finishReason}.` : "",
          blockReason  ? ` Block reason: ${blockReason}.` : "",
          detail       ? ` Model said: ${detail.slice(0, 300)}` : "",
        ].join(""),
      );
    }

    const retryReason = blockReason === "OTHER" ? "Block reason: OTHER" : "IMAGE_OTHER";
    console.warn(`[Gemini] ${retryReason} — will retry.`, { model: modelName, attempt, safetyRatings });
  }

  // Unreachable — loop always returns or throws. TypeScript needs this.
  throw new GeminiError("Gemini API did not return an image after retries.");
}

/** Extract JSON object from LLM text response */
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
