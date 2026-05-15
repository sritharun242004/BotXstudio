// ── Hybrid Editorial Pipeline ─────────────────────────────────────────────────
// Primary image  → Gemini 2.5 Flash Image  (single call — raw garment as IMAGE 1)
// Multi-angle    → FLUX Kontext Multi  (ONLY the rendered primary result)
//
// Single-shot design:
//   The raw garment photo goes directly as IMAGE 1 in the composite call.
//   No intermediate garment-reference step → 1 API call, zero garment drift.
//   Garment colors, prints, and details are preserved exactly as uploaded.
//
// Why FLUX Kontext Multi for multi-angle:
//   Kontext Multi is an instruction-following image editing model.
//   It receives the rendered Gemini primary result as context and applies
//   structured back-view / detail-shot prompts with hard garment + identity locks.
//
// Reference routing:
//   garment[0]  ─┐
//   pose        ─┤──► Gemini 2.5 Flash ──► MAIN IMAGE ──► FLUX Kontext Multi ──► back + detail
//   model       ─┤                              │
//   background  ─┘                              └─ (FLUX never sees raw inputs)

import {
  buildDirectCompositePrompt,
  type DirectCompositeConfig,
} from "./pipeline";
import { buildFluxMultiAnglePrompt } from "./flux-pipeline";
import { generateFluxImage } from "./flux";
import { generateImage, GeminiError, type GeminiInlineImage } from "./gemini";

export const HYBRID_GEMINI_MODEL = "gemini-2.5-flash-image" as const;

// ── Convert GeminiInlineImage → data URL (for garmentRefDataUrl hand-off) ────
function inlineImageToDataUrl(img: GeminiInlineImage): string {
  const chunkSize = 0x8000;
  let binary = "";
  for (let i = 0; i < img.data.length; i += chunkSize) {
    binary += String.fromCharCode(...img.data.subarray(i, i + chunkSize));
  }
  return `data:${img.mimeType};base64,${btoa(binary)}`;
}

// ── Primary result type ───────────────────────────────────────────────────────

export type HybridPrimaryResult = {
  compositeDataUrl:   string;
  compositeMimeType:  string;
  garmentRefDataUrl:  string | null;
  garmentRefMimeType: string | null;
  promptUsed: {
    garmentRef: string;
    composite:  string;
  };
  timings: {
    garmentRefMs: number;
    compositeMs:  number;
    totalMs:      number;
  };
};

// ── Primary generation — Gemini 2.5 Flash Image (single call) ─────────────────
// Sends raw garment photo directly as IMAGE 1 — no garment-reference pre-pass.
// Flash image order: garment → pose → model → background (matches prompt labels).

export async function generateHybridPrimaryImage(opts: {
  config:               DirectCompositeConfig;
  garmentImages:        GeminiInlineImage[];
  modelImage:           GeminiInlineImage | null;
  backgroundImage:      GeminiInlineImage | null;
  poseImages?:          GeminiInlineImage[];
  width?:               number;
  height?:              number;
  temperatureOverride?: number;
  qualityBoost?:        string;
  onStep?:              (step: "garment_ref" | "composite") => void;
}): Promise<HybridPrimaryResult> {
  if (opts.garmentImages.length === 0) {
    throw new Error("Hybrid pipeline: at least one garment image is required.");
  }

  const t0 = performance.now();
  opts.onStep?.("composite");

  const hasPoseReference       = Boolean(opts.poseImages?.length);
  const hasModelReference      = Boolean(opts.modelImage);
  const hasBackgroundReference = Boolean(opts.backgroundImage);

  const compositePrompt = buildDirectCompositePrompt({
    hasModelReference,
    hasPoseReference,
    hasBackgroundReference,
    config: opts.config,
    model:  HYBRID_GEMINI_MODEL,
  });

  const promptWithQuality = opts.qualityBoost
    ? `${compositePrompt}\n${opts.qualityBoost}`
    : compositePrompt;

  // Flash image order: garment(1) → pose(2?) → model(3?) → background(4?)
  // Matches IMAGE N labels used in buildFlashDirectCompositePrompt.
  const compositeImages: GeminiInlineImage[] = [
    opts.garmentImages[0],
    ...(hasPoseReference    ? [opts.poseImages![0]]  : []),
    ...(opts.modelImage     ? [opts.modelImage]      : []),
    ...(opts.backgroundImage ? [opts.backgroundImage] : []),
  ];

  const t1 = performance.now();
  const result = await generateImage({
    model:       HYBRID_GEMINI_MODEL,
    promptText:  promptWithQuality,
    images:      compositeImages,
    aspectRatio: "3:4",
    timeoutMs:   180_000,
    temperature: opts.temperatureOverride ?? 0.1,
  });
  const compositeMs = Math.round(performance.now() - t1);

  if (!result.imageBase64) {
    throw new GeminiError("Hybrid primary: Gemini 2.5 Flash did not return an image.");
  }

  return {
    compositeDataUrl:   `data:${result.mimeType};base64,${result.imageBase64}`,
    compositeMimeType:  result.mimeType,
    // Expose raw garment as garmentRefDataUrl so the multi-angle null-check passes
    garmentRefDataUrl:  inlineImageToDataUrl(opts.garmentImages[0]),
    garmentRefMimeType: opts.garmentImages[0].mimeType,
    promptUsed: {
      garmentRef: "",
      composite:  promptWithQuality,
    },
    timings: {
      garmentRefMs: 0,
      compositeMs,
      totalMs: Math.round(performance.now() - t0),
    },
  };
}

// ── Multi-angle result type ───────────────────────────────────────────────────

export type HybridMultiAngleResult = {
  backDataUrl:    string | null;
  backMimeType:   string | null;
  detailDataUrl:  string | null;
  detailMimeType: string | null;
  timingsMs:      { back: number; detail: number; total: number };
  promptsUsed:    { back: string; detail: string };
};

// ── Multi-angle generation — FLUX Kontext Multi ───────────────────────────────
// STRICT: only the rendered Gemini composite is sent as the source image.
// Raw garment / model / pose / background images are intentionally excluded.
// Both views are generated in parallel from the SAME primary Gemini result.
// Do NOT chain FLUX outputs — always generate from the primary Gemini result.

export async function generateHybridMultiAngleImages(opts: {
  config:          DirectCompositeConfig;
  mainResultImage: GeminiInlineImage;
  views?:          ("back" | "detail")[];
}): Promise<HybridMultiAngleResult> {
  const views = opts.views ?? ["back", "detail"];
  const t0    = performance.now();

  const backPrompt   = buildFluxMultiAnglePrompt({ view: "back",   config: opts.config, hasModelReference: false, hasBackgroundReference: false });
  const detailPrompt = buildFluxMultiAnglePrompt({ view: "detail", config: opts.config, hasModelReference: false, hasBackgroundReference: false });

  const results: Omit<HybridMultiAngleResult, "promptsUsed"> = {
    backDataUrl:    null,
    backMimeType:   null,
    detailDataUrl:  null,
    detailMimeType: null,
    timingsMs:      { back: 0, detail: 0, total: 0 },
  };

  const tasks: Promise<void>[] = [];

  if (views.includes("back")) {
    tasks.push((async () => {
      const t = performance.now();
      const r = await generateFluxImage({
        promptText:  backPrompt,
        images:      [opts.mainResultImage],
        aspectRatio: "3:4",
        timeoutMs:   240_000,
      });
      results.backMimeType = r.mimeType;
      results.backDataUrl  = `data:${r.mimeType};base64,${r.imageBase64}`;
      results.timingsMs.back = Math.round(performance.now() - t);
    })());
  }

  if (views.includes("detail")) {
    tasks.push((async () => {
      const t = performance.now();
      const r = await generateFluxImage({
        promptText:  detailPrompt,
        images:      [opts.mainResultImage],
        aspectRatio: "3:4",
        timeoutMs:   240_000,
      });
      results.detailMimeType = r.mimeType;
      results.detailDataUrl  = `data:${r.mimeType};base64,${r.imageBase64}`;
      results.timingsMs.detail = Math.round(performance.now() - t);
    })());
  }

  await Promise.allSettled(tasks);
  results.timingsMs.total = Math.round(performance.now() - t0);

  return { ...results, promptsUsed: { back: backPrompt, detail: detailPrompt } };
}
