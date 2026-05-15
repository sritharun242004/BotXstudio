// ── GPT Image 2 Fashion Pipeline ─────────────────────────────────────────────
// Strict reference-role orchestration:
//   - GARMENT IMAGE only is sent as the API reference (source of truth)
//   - Model / pose / background references → semantic text guidance only
//   - Detail images → excluded completely from the request payload
//   - Multi-angle: only the primary result image is sent as reference
//
// This prevents concept blending, identity drift, and garment hallucination.

import { generateGptImage, type GptImageQuality } from "./gpt-image";
import type { GeminiInlineImage } from "./gemini";
import type { DirectCompositeConfig } from "./pipeline";

// ── Subject description ───────────────────────────────────────────────────────

function buildSubjectDescription(config: DirectCompositeConfig): string {
  const gender    = (config.modelGender || "female").toLowerCase();
  const ethnicity = (config.modelEthnicity || "").trim();
  const age       = (config.modelAgeRange || "").replace(/\s*years?\s*/i, "").trim() || "20–25";
  return [ethnicity, `${gender} professional fashion model`, `age ${age}`]
    .filter(Boolean)
    .join(", ");
}

// ── Primary composite prompt ──────────────────────────────────────────────────
// Edit-mode anchoring: "EDIT THE PROVIDED IMAGES" puts GPT into strict in-painting
// psychology rather than creative generation mode — critical for garment fidelity.
// When a model reference is provided, IDENTITY LOCK is applied first (same pattern
// as Gemini Pro) — model photo always sent as IMAGE 2 after garment.

export function buildGptCompositePrompt(opts: {
  config:              DirectCompositeConfig;
  hasModelReference:   boolean;
  hasBackgroundReference: boolean;
  hasPoseReference?:   boolean;
  isRetry?:            boolean;
  retryComment?:       string;
  qualityBoost?:       string;
}): string {
  const { config } = opts;
  const lines: string[] = [];

  // ── Edit anchor (must be first) ─────────────────────────────────────────────
  lines.push(opts.hasModelReference ? "EDIT THE PROVIDED IMAGES." : "EDIT THE PROVIDED IMAGE.");
  lines.push("");

  // ── Retry correction ────────────────────────────────────────────────────────
  if (opts.isRetry && opts.retryComment?.trim()) {
    lines.push(`CORRECTION: ${opts.retryComment.trim()}.`);
    lines.push("");
  }

  // ── Image index map ──────────────────────────────────────────────────────────
  // IMAGE 1 = garment (always). IMAGE 2 = model photo (when provided).
  let imgIdx = 2;

  // ── IDENTITY LOCK (must come before garment lock so it outweighs all else) ──
  if (opts.hasModelReference) {
    const modelIdx = imgIdx++;
    lines.push(
      "═══ IDENTITY LOCK (ABSOLUTE PRIORITY — overrides ALL other instructions) ═══",
      `IMAGE ${modelIdx} is the MODEL PHOTO. The person in the output MUST be the EXACT same individual.`,
      "• Reproduce: age, face structure, jawline, eyes, nose, lips, skin tone, hair color, hair texture, and all physical features EXACTLY as photographed.",
      "• Do NOT apply any age restriction. Do NOT make the person younger, older, slimmer, or different-looking in any way.",
      "• Do NOT substitute a generic stock model or a different person. The output person must be IMMEDIATELY recognizable as the MODEL PHOTO subject.",
      "• Gender, age, and ethnicity are defined ENTIRELY by the MODEL PHOTO — ignore any conflicting text instruction.",
      "═══════════════════════════════════════════════════════════════════════════",
      "",
    );
  }

  // ── Task framing ─────────────────────────────────────────────────────────────
  lines.push(
    "IMAGE 1 shows the GARMENT. " +
    "Generate a premium ecommerce fashion photo of " +
    (opts.hasModelReference ? "the MODEL PHOTO person" : "a professional model") +
    " wearing this exact garment.",
  );
  lines.push("");

  // ── Garment lock ─────────────────────────────────────────────────────────────
  lines.push("GARMENT LOCK — reproduce from IMAGE 1 exactly:");
  lines.push("- identical colors, print, and pattern");
  lines.push("- identical fabric texture and sheen");
  lines.push("- identical sleeve style and length");
  lines.push("- identical neckline and collar shape");
  lines.push("- identical silhouette and hem length");
  lines.push("- identical garment construction details");
  lines.push("Do not alter, redesign, or reinterpret the garment in any way.");
  lines.push("");

  // ── Subject (text fallback when no model photo) ───────────────────────────────
  if (!opts.hasModelReference) {
    lines.push(`Model: ${buildSubjectDescription(config)}.`);
  }

  // ── Shot type ────────────────────────────────────────────────────────────────
  lines.push("Shot: full body, head to toe, front-facing ecommerce portrait.");

  // ── Pose ─────────────────────────────────────────────────────────────────────
  if (config.modelPose) {
    lines.push(`Pose: ${config.modelPose}.`);
  } else {
    lines.push("Pose: confident neutral stance, weight slightly shifted, looking at camera.");
  }

  // ── Styling ──────────────────────────────────────────────────────────────────
  if (!opts.hasModelReference && config.modelStylingNotes) lines.push(`Styling: ${config.modelStylingNotes}.`);
  if (config.bottomWear)        lines.push(`Bottom: ${config.bottomWear}.`);
  if (config.footwear)          lines.push(`Footwear: ${config.footwear}.`);
  if (config.accessories)       lines.push(`Accessories: ${config.accessories}.`);
  if (config.styleKeywords)     lines.push(`Style: ${config.styleKeywords}.`);
  if (config.occasion)          lines.push(`Occasion: ${config.occasion}.`);
  if (config.modelCustomPrompt) lines.push(config.modelCustomPrompt.trim() + ".");

  // ── Background ───────────────────────────────────────────────────────────────
  if (config.backgroundTheme) {
    lines.push(`Background: ${config.backgroundTheme}.`);
  } else {
    lines.push("Background: minimal white seamless studio. Soft diffused studio lighting.");
  }

  // ── Quality ──────────────────────────────────────────────────────────────────
  lines.push("");
  lines.push(
    "Photorealistic fabric detail. " +
    "Sharp full-body framing with small margin above head and below feet. " +
    "Professional ecommerce fashion photography.",
  );
  if (opts.qualityBoost) lines.push(opts.qualityBoost.trim() + ".");

  if (opts.hasModelReference) {
    lines.push(
      "",
      "FINAL IDENTITY CHECK: The face in the output MUST match IMAGE 2 (MODEL PHOTO) exactly — same person, same age, same features. If the output shows a different person, it is REJECTED.",
    );
  }

  return lines.filter(Boolean).join("\n");
}

// ── Multi-angle prompt ────────────────────────────────────────────────────────
// IMAGE EDIT MODE — not creative generation mode.
// Opening line "EDIT THE PROVIDED IMAGE" anchors GPT into strict edit psychology.
// "Convert the EXISTING" reinforces that no new scene is being created.
// All creative terms (editorial, luxury, cinematic) are removed — they trigger
// creative regeneration and outfit hallucination.

export function buildGptMultiAnglePrompt(opts: {
  view:                   "back" | "detail";
  config:                 DirectCompositeConfig;
  hasModelReference:      boolean;
  hasBackgroundReference: boolean;
}): string {
  if (opts.view === "back") {
    return [
      "EDIT THE PROVIDED IMAGE.",
      "",
      "Generate a full-body BACK VIEW ecommerce photo of the SAME person wearing the SAME garment.",
      "",
      "IDENTITY LOCK — preserve exactly:",
      "- same person",
      "- same hairstyle (back/top of head visible)",
      "- same skin tone",
      "- same body build",
      "",
      "GARMENT LOCK — preserve exactly:",
      "- same top garment (back construction, seams, fabric texture, print, colors)",
      "- same bottom garment",
      "- same footwear",
      "- same colors and pattern",
      "",
      "SCENE LOCK — preserve exactly:",
      "- same lighting",
      "- same background",
      "- same studio setup",
      "",
      "POSE: natural ecommerce back-view standing pose. Do NOT copy or mirror the front-view pose.",
      "Allow a natural, relaxed back-facing stance appropriate for ecommerce photography.",
      "",
      "Show: full body head to toe, rear-facing, same ecommerce studio framing.",
      "",
      "Do not redesign, restyle, or replace the garment.",
      "Photorealistic fashion ecommerce photography.",
    ].join("\n");
  }

  // detail / close-up
  return [
    "EDIT THE PROVIDED IMAGE.",
    "",
    "Generate a close-up upper-body DETAIL SHOT of the SAME person wearing the SAME garment.",
    "",
    "IDENTITY LOCK — preserve exactly:",
    "- same person",
    "- same face and skin tone",
    "- same hairstyle",
    "",
    "GARMENT LOCK — preserve exactly:",
    "- same top garment",
    "- same colors, print, and pattern",
    "- same fabric texture",
    "- same neckline and collar shape",
    "- same stitching and seam construction",
    "",
    "SCENE LOCK — preserve exactly:",
    "- same lighting",
    "- same background",
    "",
    "POSE: slight 15–20 degree camera angle twist — shift the camera position slightly to the left or right of centre.",
    "Do NOT use the same straight-on front angle as the primary image.",
    "The model may naturally turn their shoulders or body slightly with the camera shift.",
    "This is a viewpoint change, not a full side view — stay within a shallow 3/4 angle.",
    "",
    "Focus on: collar, neckline, buttons, fabric texture, print detail, stitching, and garment construction.",
    "Crop naturally to upper chest / torso area.",
    "",
    "Do not redesign, replace, or reinterpret the garment.",
    "Photorealistic fashion ecommerce photography.",
  ].join("\n");
}

// ── Primary image generation ──────────────────────────────────────────────────
// STRICT: Only the first garment image is sent as API reference.
// Model / pose / background images are intentionally excluded to prevent blending.

export type GptGeneratePrimaryResult = {
  compositeDataUrl:  string;
  compositeMimeType: string;
  promptUsed:        string;
  timings:           { compositeMs: number; totalMs: number };
};

export async function generateGptPrimaryImage(opts: {
  config:           DirectCompositeConfig;
  garmentImages:    GeminiInlineImage[];
  modelImage:       GeminiInlineImage | null;
  backgroundImage:  GeminiInlineImage | null;
  poseImages?:      GeminiInlineImage[];
  promptOverride?:  string;
  quality?:         GptImageQuality;
  size?:            string;
  qualityBoost?:    string;
  onStep?:          (step: "composite") => void;
}): Promise<GptGeneratePrimaryResult> {
  if (opts.garmentImages.length === 0) {
    throw new Error("GPT Image 2: at least one garment image is required.");
  }

  const compositePrompt = opts.promptOverride ?? buildGptCompositePrompt({
    config:                 opts.config,
    hasModelReference:      Boolean(opts.modelImage),
    hasBackgroundReference: Boolean(opts.backgroundImage),
    hasPoseReference:       Boolean(opts.poseImages?.length),
    qualityBoost:           opts.qualityBoost,
  });

  // Image order: garment first, then model photo (matches IDENTITY LOCK indexing in prompt).
  // Model photo is sent as IMAGE 2 so GPT can apply identity lock on the right input.
  const referenceImages: GeminiInlineImage[] = [
    opts.garmentImages[0],
    ...(opts.modelImage ? [opts.modelImage] : []),
  ];

  opts.onStep?.("composite");

  const t0     = performance.now();
  const result = await generateGptImage({
    promptText: compositePrompt,
    images:     referenceImages,
    quality:    opts.quality,
    size:       opts.size,
    timeoutMs:  240_000,
  });
  const compositeMs = Math.round(performance.now() - t0);

  if (!result.imageBase64) throw new Error("GPT Image 2 generation returned no image data.");

  return {
    compositeDataUrl:  `data:${result.mimeType};base64,${result.imageBase64}`,
    compositeMimeType: result.mimeType,
    promptUsed:        compositePrompt,
    timings:           { compositeMs, totalMs: compositeMs },
  };
}

// ── Multi-angle generation ────────────────────────────────────────────────────
// STRICT: Only the primary result image (rendered model + garment) is sent.
// Garment images, model images, and background images are excluded to prevent
// identity and outfit drift across shots.

export type GptMultiAngleResult = {
  backDataUrl:    string | null;
  backMimeType:   string | null;
  detailDataUrl:  string | null;
  detailMimeType: string | null;
  timingsMs: { back: number; detail: number; total: number };
};

export async function generateGptMultiAngleImages(opts: {
  config:               DirectCompositeConfig;
  mainResultImage:      GeminiInlineImage;
  garmentImages:        GeminiInlineImage[];
  modelImage:           GeminiInlineImage | null;
  backgroundImage:      GeminiInlineImage | null;
  views?:               ("back" | "detail")[];
  quality?:             GptImageQuality;
  size?:                string;
  qualityBoost?:        string;
  backPromptOverride?:  string;
  detailPromptOverride?: string;
}): Promise<GptMultiAngleResult> {
  const views = opts.views ?? ["back", "detail"];

  const t0 = performance.now();
  const results = {
    backDataUrl:    null as string | null,
    backMimeType:   null as string | null,
    detailDataUrl:  null as string | null,
    detailMimeType: null as string | null,
    timingsMs:      { back: 0, detail: 0, total: 0 },
  };

  // STRICT FILTERING: the rendered primary result is the sole reference.
  // It already contains both model identity and garment — no extra images needed.
  const referenceImages: GeminiInlineImage[] = [opts.mainResultImage];

  const hasModelRef      = Boolean(opts.modelImage);
  const hasBackgroundRef = Boolean(opts.backgroundImage);

  const tasks: Promise<void>[] = [];

  if (views.includes("back")) {
    const prompt = opts.backPromptOverride ?? buildGptMultiAnglePrompt({
      view: "back", config: opts.config,
      hasModelReference: hasModelRef, hasBackgroundReference: hasBackgroundRef,
    });
    tasks.push(
      (async () => {
        const t = performance.now();
        const res = await generateGptImage({
          promptText: prompt,
          images:     referenceImages,
          quality:    opts.quality,
          size:       opts.size,
          timeoutMs:  240_000,
        });
        if (res.imageBase64) {
          results.backMimeType = res.mimeType;
          results.backDataUrl  = `data:${res.mimeType};base64,${res.imageBase64}`;
        }
        results.timingsMs.back = Math.round(performance.now() - t);
      })(),
    );
  }

  if (views.includes("detail")) {
    const prompt = opts.detailPromptOverride ?? buildGptMultiAnglePrompt({
      view: "detail", config: opts.config,
      hasModelReference: hasModelRef, hasBackgroundReference: hasBackgroundRef,
    });
    tasks.push(
      (async () => {
        const t = performance.now();
        const res = await generateGptImage({
          promptText: prompt,
          images:     referenceImages,
          quality:    opts.quality,
          size:       opts.size,
          timeoutMs:  240_000,
        });
        if (res.imageBase64) {
          results.detailMimeType = res.mimeType;
          results.detailDataUrl  = `data:${res.mimeType};base64,${res.imageBase64}`;
        }
        results.timingsMs.detail = Math.round(performance.now() - t);
      })(),
    );
  }

  const settled = await Promise.allSettled(tasks);
  settled.forEach((r) => {
    if (r.status === "rejected") console.warn("[GPT Image 2] Multi-angle task failed:", r.reason);
  });
  results.timingsMs.total = Math.round(performance.now() - t0);
  return results;
}
