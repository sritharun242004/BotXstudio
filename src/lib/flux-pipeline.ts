import { generateFluxImage } from "./flux";
import type { GeminiInlineImage } from "./gemini";
import type { DirectCompositeConfig } from "./pipeline";

// ── Kontext Multi prompt constants ───────────────────────────────────────────
//
// FLUX Kontext Multi (fal-ai/flux-pro/kontext/multi) accepts image_urls (array).
// IMAGE 1 = garment reference (always required).
// IMAGE 2 = model photo (when provided) — IDENTITY LOCK applied in prompt.
//
// Prompt strategy mirrors Gemini Pro Flash:
//   - STRICT MODE declaration
//   - Numbered priority system (GARMENT highest)
//   - Section-by-section locks (GARMENT, MODEL, POSE, BACKGROUND)
//   - Explicit photorealism + anti-cartoon negative rules
//   - Hard REJECT conditions

// ── Primary prompt builder ────────────────────────────────────────────────────

export function buildFluxCompositePrompt(opts: {
  config: DirectCompositeConfig;
  hasModelReference: boolean;
  hasBackgroundReference: boolean;
  hasPoseReference?: boolean;
  isRetry?: boolean;
  retryComment?: string;
  qualityBoost?: string;
}): string {
  const { config } = opts;
  const lines: string[] = [];

  if (opts.isRetry && opts.retryComment?.trim()) {
    lines.push(`CORRECTION: ${opts.retryComment.trim()}.`, "Apply this correction only. All rules below still apply.", "");
  }

  lines.push(
    "STRICT MODE. Generate a photorealistic ecommerce fashion photograph.",
    "",
    "PRIORITY ORDER:",
    "1. GARMENT (highest) — IMAGE 1 is the source of truth. Do NOT change it.",
    opts.hasModelReference
      ? "2. MODEL IDENTITY — reproduce exact person from IMAGE 2 (MODEL PHOTO)."
      : `2. MODEL — generate a consistent single ${(config.modelGender || "female").toLowerCase()} fashion model.`,
    opts.hasPoseReference ? "3. POSE — copy exact body structure from config pose or description." : "",
    opts.hasBackgroundReference ? "4. BACKGROUND — use exact background from config." : "",
    "",
  );

  // ── GARMENT LOCK ──────────────────────────────────────────────────────────
  lines.push(
    "--------------------------------",
    "GARMENT LOCK (ZERO TOLERANCE):",
    "--------------------------------",
    "IMAGE 1 = GARMENT REFERENCE — source of truth for garment design.",
    "- COLOR: reproduce the exact color. Do NOT lighten, darken, or shift the hue.",
    "- PRINT/GRAPHICS: reproduce all patterns, logos, text, and graphics exactly.",
    "- SHAPE: match neckline, collar, sleeve length/style, and hem exactly.",
    "- TEXTURE: preserve fabric weave, seam placement, and material detail.",
    "- Do NOT redesign, recolor, or change any element of the garment.",
    "- Do NOT add extra clothing layers (no jacket, cardigan, shawl, cape, scarf).",
    "- Do NOT hallucinate details not visible in IMAGE 1.",
    "✗ REJECT if garment color, print, silhouette, or any design detail differs from IMAGE 1.",
    "",
  );

  // ── MODEL LOCK ────────────────────────────────────────────────────────────
  lines.push(
    "--------------------------------",
    opts.hasModelReference ? "MODEL LOCK (IMAGE 2 — ABSOLUTE PRIORITY):" : "MODEL SPEC:",
    "--------------------------------",
  );
  if (opts.hasModelReference) {
    lines.push(
      "IMAGE 2 = MODEL PHOTO — the ONLY source of the output person's face, identity, and appearance.",
      "- Reproduce EXACTLY: age, face structure, jawline, eyes, nose, lips, skin tone, hair color, hair texture, body type.",
      "- Do NOT substitute a generic stock model or a different person.",
      "- Do NOT beautify, slim, or modify the face in any way.",
      "- Gender, age, and ethnicity are defined ENTIRELY by IMAGE 2.",
      "✗ REJECT if output person does not match IMAGE 2 exactly.",
      "",
    );
  } else {
    const gender    = (config.modelGender || "Female").toLowerCase();
    const ethnicity = config.modelEthnicity?.trim() || "";
    const age       = config.modelAgeRange?.replace(/\s*years?\s*/i, "").trim() || "20–25";
    lines.push(
      `- Gender: ${gender}`,
      `- Age: ${age} years old (clearly adult, not a minor)`,
      ...(ethnicity ? [`- Ethnicity: ${ethnicity}`] : []),
      ...(config.modelStylingNotes ? [`- Styling: ${config.modelStylingNotes}`] : ["- Styling: natural, clean, commercial ecommerce appearance."]),
      ...(config.modelCustomPrompt ? [config.modelCustomPrompt] : []),
      `- Generate exactly ONE ${gender} professional fashion model matching ALL of the above.`,
      "✗ REJECT if model appears to be a minor, cartoon, or does not match the spec.",
      "",
    );
  }

  // ── POSE LOCK ─────────────────────────────────────────────────────────────
  lines.push(
    "--------------------------------",
    "POSE:",
    "--------------------------------",
  );
  if (config.modelPose?.trim()) {
    lines.push(`- ${config.modelPose}.`, "");
  } else if (opts.hasPoseReference) {
    lines.push(
      "- Confident ecommerce front-facing pose.",
      "- Natural weight shift to one leg. Relaxed arms. Soft expression. Looking at camera.",
      "",
    );
  } else {
    lines.push(
      "- Natural standing pose. Weight shift to one leg. Relaxed arms. Slight head tilt. Soft expression. Looking at camera.",
      "",
    );
  }

  // ── BACKGROUND ────────────────────────────────────────────────────────────
  lines.push(
    "--------------------------------",
    "BACKGROUND:",
    "--------------------------------",
  );
  if (config.backgroundTheme?.trim()) {
    lines.push(`- ${config.backgroundTheme}.`, "- Match this setting realistically. Natural daylight.", "");
  } else if (opts.hasBackgroundReference) {
    lines.push("- Lifestyle editorial background. Natural daylight. Soft shadows.", "");
  } else {
    lines.push("- Clean neutral studio background. Soft diffused daylight. No harsh shadows.", "");
  }

  // ── STYLING ───────────────────────────────────────────────────────────────
  const stylingLines: string[] = [];
  if (config.occasion?.trim())      stylingLines.push(`- Occasion: ${config.occasion}`);
  if (config.bottomWear?.trim())    stylingLines.push(`- Bottom wear: ${config.bottomWear}`);
  if (config.footwear?.trim())      stylingLines.push(`- Footwear: ${config.footwear}`);
  if (config.accessories?.trim())   stylingLines.push(`- Accessories: ${config.accessories}`);
  if (config.styleKeywords?.trim()) stylingLines.push(`- Style: ${config.styleKeywords}`);
  if (stylingLines.length) {
    lines.push("--------------------------------", "STYLING:", "--------------------------------", ...stylingLines, "");
  }

  // ── IMAGE REQUIREMENTS ────────────────────────────────────────────────────
  lines.push(
    "--------------------------------",
    "IMAGE REQUIREMENTS:",
    "--------------------------------",
    "- Full body, head to toe. Both feet fully visible. No cropping at head or feet.",
    "- 3:4 portrait (1080×1440 px). Model fills ~80–85% of frame height.",
    "- PHOTOREALISTIC: shot on DSLR camera, sharp focus, commercial fashion photography quality.",
    "- NOT cartoon. NOT anime. NOT CGI. NOT illustration. NOT digital art. NOT 3D render.",
    "- Natural daylight: warm, soft, even front-side illumination. Medium contrast. No harsh shadows.",
    "- Realistic human proportions. Correct anatomy. No deformed hands or limbs.",
    ...(opts.qualityBoost ? [opts.qualityBoost] : []),
    "",
  );

  // ── NEGATIVE RULES ────────────────────────────────────────────────────────
  lines.push(
    "--------------------------------",
    "DO NOT (STRICT):",
    "--------------------------------",
    "- Cartoon, anime, CGI, illustration, or unreal look",
    "- Cropped head or feet",
    "- Extra garment layers (jacket, cape, cardigan, shawl, scarf)",
    "- Different garment design, recolored garment, or added design elements",
    opts.hasModelReference ? "- Different model, wrong face, or generic stock model" : "- Child, minor, or underage appearance",
    "- Extra people or duplicated figures",
    "- Deformed hands, extra limbs, or anatomical errors",
    "- Blur, low quality, or noise",
    "- Text overlay, watermarks, or brand logos",
  );

  if (opts.hasModelReference) {
    lines.push(
      "",
      `FINAL IDENTITY CHECK: Face in output MUST match IMAGE 2 — same eyes, nose, lips, jawline, skin tone, hair. Different face → REJECT.`,
    );
  }

  return lines.filter(Boolean).join("\n");
}

// ── Angle prompt builder ──────────────────────────────────────────────────────
// Context: main generated image → Kontext edits for back/detail views.
// Uses section-based structure matching the composite prompt for consistency.

export function buildFluxMultiAnglePrompt(opts: {
  view: "back" | "detail";
  config: DirectCompositeConfig;
  hasModelReference: boolean;
  hasBackgroundReference: boolean;
}): string {
  const { config } = opts;

  if (opts.view === "back") {
    const bgLine = config.backgroundTheme?.trim()
      ? `- Background: ${config.backgroundTheme}. Match realistically.`
      : "- Same background and studio lighting as the provided image.";

    return [
      "EDIT THE PROVIDED IMAGE. Generate a full-body BACK VIEW of this ecommerce fashion photo.",
      "",
      "TASK: Show the same model from behind wearing the same garment. Reproduce the rear construction of this outfit.",
      "",
      "GARMENT BACK DESIGN (reproduce from garment reference):",
      "- Show the back panel of the garment: rear seams, back neckline/collar back, back hem, back panel.",
      "- Match all colors and print patterns from the front view — apply them correctly to the rear construction.",
      "- Extrapolate realistic back construction based on the garment design visible in the source image.",
      "- Do NOT redesign or change the garment. Do NOT invent new design elements.",
      "- Do NOT add extra layers (jacket, cape, cardigan, shawl).",
      "",
      "IDENTITY LOCK:",
      "- Same model: same hairstyle seen from back/top, same skin tone, same body build.",
      "- Do NOT change the person.",
      "",
      "SCENE LOCK:",
      bgLine,
      "- Same lighting quality and direction.",
      "",
      "POSE:",
      "- Natural full-body rear-facing ecommerce standing pose.",
      "- Relaxed arms, weight evenly distributed or slight natural weight shift.",
      "- Do NOT mirror or copy the front-view stance — use a natural back-view pose.",
      "- Head looking straight forward or slight natural turn.",
      "",
      "IMAGE REQUIREMENTS:",
      "- Full body, head to toe. No cropping at head or feet.",
      "- PHOTOREALISTIC — NOT cartoon, NOT CGI, NOT anime, NOT illustration.",
      "- Sharp DSLR quality, commercial ecommerce fashion photography.",
      "- Correct human anatomy. No deformed limbs.",
      "",
      "DO NOT:",
      "- Front view or mirrored front pose",
      "- Different garment or redesigned back panel",
      "- Different model or changed hairstyle",
      "- Cropped head or feet",
      "- Cartoon, CGI, or unreal look",
      "- Extra clothing layers",
    ].join("\n");
  }

  // ── Detail / close-up ────────────────────────────────────────────────────
  return [
    "EDIT THE PROVIDED IMAGE. Create a close-up upper-body DETAIL SHOT with a slight camera angle twist.",
    "",
    "TASK: Zoom into the upper torso area with a 15–20 degree camera angle shift left or right of centre.",
    "",
    "GARMENT DETAIL (reproduce exactly):",
    "- Same garment from the provided image.",
    "- Show fabric texture, seams, stitching, print, and construction details sharply.",
    "- Focus on: collar, neckline, buttons, zippers, fabric weave, logo, upper garment construction.",
    "- Do NOT change or redesign any garment detail.",
    "",
    "IDENTITY LOCK:",
    "- Same model: same face, skin tone, and hairstyle.",
    "- Do NOT change the person.",
    "",
    "CAMERA INSTRUCTIONS:",
    "- 15–20 degree camera angle twist left or right — NOT the same straight-on front angle.",
    "- Slight natural shoulder turn with the camera shift.",
    "- Crop to upper body: collar to mid-torso area.",
    "- Maintain realistic perspective and proportions.",
    "",
    "IMAGE REQUIREMENTS:",
    "- PHOTOREALISTIC — NOT cartoon, NOT CGI, NOT anime, NOT illustration.",
    "- Sharp DSLR quality, commercial ecommerce fashion photography.",
    "- Same background tone and lighting as the provided image.",
    "",
    "DO NOT:",
    "- Full body shot or same straight-on front angle",
    "- Different garment or redesigned details",
    "- Different model",
    "- Cartoon, CGI, or unreal look",
    "- Blur or soft focus on garment",
  ].join("\n");
}

// ── Primary image generation ──────────────────────────────────────────────────
// FLUX Kontext Multi: garment IMAGE 1, model photo IMAGE 2 (when provided).
// Pose reference and background reference are incorporated as text descriptions.

export type FluxGeneratePrimaryResult = {
  compositeDataUrl: string;
  compositeMimeType: string;
  promptUsed: string;
  timings: { compositeMs: number; totalMs: number };
};

export async function generateFluxPrimaryImage(opts: {
  config: DirectCompositeConfig;
  garmentImages: GeminiInlineImage[];
  modelImage: GeminiInlineImage | null;
  backgroundImage: GeminiInlineImage | null;
  poseImages?: GeminiInlineImage[];
  /** Pass a pre-built prompt (e.g. retry with correction comment) instead of building from config. */
  promptOverride?: string;
  /** Quality tier boost appended to the prompt. */
  qualityBoost?: string;
  /** Aspect ratio override from quality tier (e.g. "4:3" for Fast Draft, "3:4" for others). */
  aspectRatioOverride?: string;
  onStep?: (step: "composite") => void;
}): Promise<FluxGeneratePrimaryResult> {
  if (opts.garmentImages.length === 0) {
    throw new Error("At least one garment image is required for FLUX Kontext Pro generation.");
  }

  const hasModelReference      = Boolean(opts.modelImage);
  const hasBackgroundReference = Boolean(opts.backgroundImage);
  const hasPoseReference       = Boolean(opts.poseImages && opts.poseImages.length > 0);

  const compositePrompt = opts.promptOverride ?? buildFluxCompositePrompt({
    config: opts.config,
    hasModelReference,
    hasBackgroundReference,
    hasPoseReference,
    qualityBoost: opts.qualityBoost,
  });

  // Image order: garment first, then model photo (matches IDENTITY LOCK indexing in prompt).
  // Kontext Multi supports image_urls array — model photo sent as IMAGE 2 when provided.
  const contextImages: GeminiInlineImage[] = [
    opts.garmentImages[0],
    ...(opts.modelImage ? [opts.modelImage] : []),
  ];

  opts.onStep?.("composite");

  const aspectRatio = opts.aspectRatioOverride ?? "3:4";

  const t0 = performance.now();
  const result = await generateFluxImage({
    promptText:  compositePrompt,
    images:      contextImages,
    aspectRatio,
    timeoutMs:   240_000,
  });
  const compositeMs = Math.round(performance.now() - t0);

  if (!result.imageBase64) throw new Error("FLUX Kontext generation returned no image data.");

  return {
    compositeDataUrl:  `data:${result.mimeType};base64,${result.imageBase64}`,
    compositeMimeType: result.mimeType,
    promptUsed:        compositePrompt,
    timings:           { compositeMs, totalMs: compositeMs },
  };
}

// ── Multi-angle generation ────────────────────────────────────────────────────
// Context: main generated image → Kontext edits for back/detail views.
// The main result has the locked identity + outfit, giving far better consistency.

export type FluxMultiAngleResult = {
  backDataUrl:    string | null;
  backMimeType:   string | null;
  detailDataUrl:  string | null;
  detailMimeType: string | null;
  timingsMs: { back: number; detail: number; total: number };
};

export async function generateFluxMultiAngleImages(opts: {
  config: DirectCompositeConfig;
  /** Primary generated image — Kontext context for back/detail consistency */
  mainResultImage: GeminiInlineImage;
  garmentImages: GeminiInlineImage[];
  modelImage: GeminiInlineImage | null;
  backgroundImage: GeminiInlineImage | null;
  views?: ("back" | "detail")[];
  qualityBoost?: string;
}): Promise<FluxMultiAngleResult> {
  const hasModelReference      = Boolean(opts.modelImage);
  const hasBackgroundReference = Boolean(opts.backgroundImage);
  const views                  = opts.views ?? ["back", "detail"];

  const t0      = performance.now();
  const results = {
    backDataUrl:    null as string | null,
    backMimeType:   null as string | null,
    detailDataUrl:  null as string | null,
    detailMimeType: null as string | null,
    timingsMs:      { back: 0, detail: 0, total: 0 },
  };

  const tasks: Promise<void>[] = [];

  if (views.includes("back")) {
    const basePrompt = buildFluxMultiAnglePrompt({
      view: "back",
      config: opts.config,
      hasModelReference,
      hasBackgroundReference,
    });
    const prompt = opts.qualityBoost ? `${basePrompt}, ${opts.qualityBoost}` : basePrompt;
    tasks.push(
      (async () => {
        const tBack = performance.now();
        const res   = await generateFluxImage({
          promptText:  prompt,
          images:      [opts.mainResultImage],
          aspectRatio: "3:4",
          timeoutMs:   240_000,
        });
        if (res.imageBase64) {
          results.backMimeType = res.mimeType;
          results.backDataUrl  = `data:${res.mimeType};base64,${res.imageBase64}`;
        }
        results.timingsMs.back = Math.round(performance.now() - tBack);
      })(),
    );
  }

  if (views.includes("detail")) {
    const basePrompt = buildFluxMultiAnglePrompt({
      view: "detail",
      config: opts.config,
      hasModelReference,
      hasBackgroundReference,
    });
    const prompt = opts.qualityBoost ? `${basePrompt}, ${opts.qualityBoost}` : basePrompt;
    tasks.push(
      (async () => {
        const tDetail = performance.now();
        const res     = await generateFluxImage({
          promptText:  prompt,
          images:      [opts.mainResultImage],
          aspectRatio: "3:4",
          timeoutMs:   240_000,
        });
        if (res.imageBase64) {
          results.detailMimeType = res.mimeType;
          results.detailDataUrl  = `data:${res.mimeType};base64,${res.imageBase64}`;
        }
        results.timingsMs.detail = Math.round(performance.now() - tDetail);
      })(),
    );
  }

  await Promise.all(tasks);
  results.timingsMs.total = Math.round(performance.now() - t0);

  return results;
}
