import { extractJsonObject, generateText, generateImage, dataUrlToInlineImage, GeminiError, type GeminiInlineImage } from "./gemini";
import { hashImages, getCachedGarmentRef, storeCachedGarmentRef } from "./garment-cache";

export type AssetMeta = {
  id: string;
  title: string;
  theme?: string | null;
  ethnicity?: string | null;
  tags: string[];
};

export type LookPlan = {
  occasion: string;
  color_scheme: string;
  print_style: string;
  style_keywords: string[];
  background_theme: string;
  footwear: string;
  accessories: string[];
  negative_prompt: string;
  model_ethnicity: string;
  model_pose: string;
  model_styling_notes: string;
};

export type LookOverrides = {
  occasion?: string | null;
  color_scheme?: string | null;
  print_style?: string | null;
  background_theme?: string | null;
  footwear?: string | null;
  model_ethnicity?: string | null;
  model_pose?: string | null;
  model_styling_notes?: string | null;
};

const MODEL_AGE_RULE =
  "Model age: young adult (18–23), not older than 23. The model must look clearly adult (do not depict a minor).";
const FULL_BODY_RULE =
  "HARD FRAMING: full-body head-to-toe. Include the entire head and both feet/shoes in frame (no cropping at any edge). Leave a small margin above head and below feet. Aspect ratio: 3:4 portrait. Output resolution: 1080×1440 px (3:4).";
const GARMENT_FIDELITY_RULE =
  "Garment fidelity: match the garment reference exactly (silhouette, neckline, sleeves, hem, print/pattern, logos/graphics, seams, fabric texture). Do not add extra fabric, extra layers, or new design elements.";
const BACKGROUND_LOCK_RULE =
  "Background fidelity: if a BACKGROUND PHOTO is provided, treat it as locked and match it closely (do not switch to a different background; do not add/remove major background objects).";
const GLOBAL_AVOID =
  "cropped head, cropped feet, cut off shoes, cut off top of head, out-of-frame limbs, close-up portrait, half-body, extreme wide shot, tiny product, distant subject, extra people, duplicated people, extra limbs, deformed hands, blur, low quality, text overlay, watermark, brand logos, extra fabric, added clothing layers, jacket, coat, cardigan, shawl, scarf, cape, gritty street style, dramatic high-fashion editorial, harsh hard shadows, moody low-key lighting, heavy film grain, CGI/cartoon look, child, teen, minor, underage, middle-aged, elderly";

// When a model reference photo is uploaded, age/demographic restrictions are dropped —
// the uploaded person's actual appearance defines age, gender, and ethnicity.
const GLOBAL_AVOID_WITH_MODEL_REF =
  "cropped head, cropped feet, cut off shoes, cut off top of head, out-of-frame limbs, close-up portrait, half-body, extreme wide shot, tiny product, distant subject, extra people, duplicated people, extra limbs, deformed hands, blur, low quality, text overlay, watermark, brand logos, extra fabric, added clothing layers, jacket, coat, cardigan, shawl, scarf, cape, gritty street style, dramatic high-fashion editorial, harsh hard shadows, moody low-key lighting, heavy film grain, CGI/cartoon look, wrong face, different person, generic stock model";

// ─── Model-aware dispatch helper ─────────────────────────────────────────────
/**
 * Returns true when `model` is a Flash-class image model.
 * Flash models benefit from highly-structured, explicit prompts with numbered
 * sections, repetition of critical constraints, and "REJECT if" conditions —
 * behaviours that Pro can infer from shorter prose.
 */
function isFlashModel(model: string): boolean {
  return (model || "").toLowerCase().includes("flash");
}

function normalizeAvoidClause(text: string): string {
  const trimmed = (text || "").trim();
  if (!trimmed) return "";
  return trimmed.replace(/^avoid\s*:\s*/i, "").trim();
}

function coerceStr(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s || null;
}

function coerceStrList(v: unknown): string[] {
  if (v === null || v === undefined) return [];
  if (Array.isArray(v)) {
    const out: string[] = [];
    for (const item of v) {
      const s = coerceStr(item);
      if (s) out.push(s);
    }
    return out;
  }
  if (typeof v === "string") {
    return v
      .replace(/;/g, ",")
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
  }
  return [];
}

function overrideLines(overrides: LookOverrides): string[] {
  const pairs: Array<[string, string | null | undefined]> = [
    ["occasion", overrides.occasion],
    ["color_scheme", overrides.color_scheme],
    ["print_style", overrides.print_style],
    ["background_theme", overrides.background_theme],
    ["footwear", overrides.footwear],
    ["model_ethnicity", overrides.model_ethnicity],
    ["model_pose", overrides.model_pose],
    ["model_styling_notes", overrides.model_styling_notes],
  ];

  const lines: string[] = [];
  for (const [k, raw] of pairs) {
    const v = (raw || "").trim();
    if (v) lines.push(`- ${k}: ${v}`);
  }
  return lines;
}

export async function planLookFromGarment(opts: {
  model: string;
  garmentImages: Array<{ mimeType: string; data: Uint8Array }>;
  availableBackgroundThemes: string[];
  availableModelEthnicities: string[];
  userOverrides: LookOverrides;
  timeoutMs?: number;
}): Promise<{ plan: LookPlan; rawText: string; rawJson: Record<string, unknown> }> {
  const bgHint = opts.availableBackgroundThemes.length
    ? opts.availableBackgroundThemes.slice(0, 20).join(", ")
    : "(none available)";
  const ethHint = opts.availableModelEthnicities.length
    ? opts.availableModelEthnicities.slice(0, 20).join(", ")
    : "(none available)";

  const ovLines = overrideLines(opts.userOverrides);
  const overridesBlock = ovLines.length ? ovLines.join("\n") : "- (none)";

  const prompt = `
You are a senior fashion ecommerce creative director for product photography.
The input is 1–4 GARMENT PHOTOS of the SAME garment (front/side/back angles are common). There is no real person in the input.

Goal: propose a styling plan to generate a photorealistic, high-conversion ecommerce product image:
- A single model wearing EXACTLY the same garment from the GARMENT PHOTO.
- Be creative in the scene + styling while keeping it commercially usable and product-first.

	Style guide to follow (non-negotiable):
	- Product-first catalogue photography that still feels aspirational lifestyle (not pure studio).
	- Vibe: warm, sunny, polished, approachable, slightly editorial. Think "vacation wardrobe lookbook".
	- Not gritty street-style; not dramatic high-fashion; no harsh moody lighting.
		- Prioritize full-body vertical framing; model head-to-toe in frame; garment clearly visible and readable (avoid tiny/distant subject).
		- ${MODEL_AGE_RULE}
		- Accessories: minimal but intentional/matching (0–3), realistic; do not cover the garment.
		- Footwear: pick ONE realistic footwear choice that matches the occasion + styling (e.g., white sneakers, strappy heels, sandals). Keep it commercially usable and clearly visible in a full-body shot.
		- Hair/makeup: natural glam, clean and commercial (defined brows, neutral lip), no extreme looks.
		- Pose notes (for model_styling_notes): natural weight-shift (S-curve), slight torso twist, relaxed hands, subtle motion if needed to show drape.

	Hard rules:
	- Output ONLY valid JSON (no markdown, no commentary).
	- Keep the garment design accurate: do NOT invent or change neckline, sleeves, hem, print/pattern, logos/graphics, or fabric texture.
	- Never add new garment elements (no extra fabric, no added layers, no jackets/shawls/scarves).
	- Do not hallucinate specific garment details you cannot see; when uncertain, use "as-is".

If the user provided overrides, respect them:
${overridesBlock}

Background themes available (if you can match one, do so): ${bgHint}
Model ethnicities available (if you can match one, do so): ${ethHint}

Return JSON with exactly these keys:
{
  "occasion": string (examples: "beachwear", "party", "evening", "casual"),
  "color_scheme": string (short; for the overall scene palette; must NOT imply recoloring the garment),
  "print_style": string (short; describe the garment print if visible, otherwise "as-is"),
	  "style_keywords": array of strings (3-8 items, short),
	  "background_theme": string,
		  "footwear": string (one footwear choice; can be empty if unsure),
		  "accessories": array of strings (0-6 items; realistic),
		  "negative_prompt": string (short avoid clause; include things like cropped head/feet, tiny/distant product, close-up portrait, extra limbs, blur, text/watermarks, extra fabric/layers, and any style-guide violations),
		  "model_ethnicity": string,
		  "model_pose": string (short; main-image pose direction such as "front hero", "3/4 turn", "walking step"; keep it ecommerce-friendly and full-body),
		  "model_styling_notes": string (short; hair/makeup/jewelry guidance)
		}`.trim();

  const result = await generateText({
    model: opts.model,
    promptText: prompt,
    images: opts.garmentImages,
    timeoutMs: opts.timeoutMs ?? 120_000,
    temperature: 0.2,
    maxOutputTokens: 512,
  });

  const rawJson = extractJsonObject(result.text);

  const occasion =
    coerceStr(opts.userOverrides.occasion) || coerceStr(rawJson.occasion) || "casual";
  const color_scheme =
    coerceStr(opts.userOverrides.color_scheme) || coerceStr(rawJson.color_scheme) || "neutral";
  const print_style =
    coerceStr(opts.userOverrides.print_style) || coerceStr(rawJson.print_style) || "as-is";
  const style_keywords = coerceStrList(rawJson.style_keywords);
  const background_theme =
    coerceStr(opts.userOverrides.background_theme) ||
    coerceStr(rawJson.background_theme) ||
    occasion;
  const footwear =
    coerceStr(opts.userOverrides.footwear) ||
    coerceStr(rawJson.footwear) ||
    "";
  const accessories = coerceStrList(rawJson.accessories);
  const negative_prompt =
    coerceStr(rawJson.negative_prompt) ||
    "blurry, low quality, cropped head, cropped feet, incorrect garment, altered design, extra fabric, added layers, wrong print, extra limbs, deformed hands, extra people, text overlay, watermark";
  const model_ethnicity =
    coerceStr(opts.userOverrides.model_ethnicity) || coerceStr(rawJson.model_ethnicity) || "";
  const model_pose =
    coerceStr(opts.userOverrides.model_pose) ||
    coerceStr(rawJson.model_pose) ||
    "";
  const model_styling_notes =
    coerceStr(opts.userOverrides.model_styling_notes) ||
    coerceStr(rawJson.model_styling_notes) ||
    "";

  return {
    plan: {
      occasion,
      color_scheme,
      print_style,
      style_keywords,
      background_theme,
      footwear,
      accessories,
      negative_prompt,
      model_ethnicity,
      model_pose,
      model_styling_notes,
    },
    rawText: result.text,
    rawJson,
  };
}

export function chooseBackground(backgrounds: AssetMeta[], desiredTheme: string): AssetMeta | null {
  if (!backgrounds.length) return null;
  const desired = (desiredTheme || "").trim().toLowerCase();
  const desiredKey = desired ? (desired.split(/[—–:,()-]/)[0] || desired).trim() : "";
  const themed = desired
    ? backgrounds.filter((b) => {
        const theme = (b.theme || "").trim().toLowerCase();
        if (!theme) return false;
        if (theme === desired) return true;
        if (desiredKey && theme === desiredKey) return true;
        if (desired.includes(theme)) return true;
        if (desiredKey && theme.includes(desiredKey)) return true;
        return false;
      })
    : [];
  const list = themed.length ? themed : backgrounds;
  return list[Math.floor(Math.random() * list.length)] || backgrounds[0] || null;
}

export function chooseModel(models: AssetMeta[], desiredEthnicity: string): AssetMeta | null {
  if (!models.length) return null;
  const desired = (desiredEthnicity || "").trim().toLowerCase();
  const matched = desired
    ? models.filter((m) => (m.ethnicity || "").trim().toLowerCase() === desired)
    : [];
  const list = matched.length ? matched : models;
  return list[Math.floor(Math.random() * list.length)] || models[0] || null;
}

export async function generateFinalPrompt(opts: {
  model: string;
  plan: LookPlan;
  background: AssetMeta | null;
  chosenModel: AssetMeta | null;
  hasBackgroundReference: boolean;
  hasModelReference: boolean;
  timeoutMs?: number;
}): Promise<{ prompt: string; rawText: string }> {
  // ── Compact clause builders (~20 tokens each vs ~60 before) ──────────────
  const bgClause = opts.hasBackgroundReference
    ? `Background: use BACKGROUND PHOTO as-is — write "in the provided background", do not invent or describe a location.`
    : `Background: photorealistic setting matching "${opts.plan.background_theme || opts.plan.occasion}".`;

  const modelClause = opts.hasModelReference
    ? `Model: write "matching the MODEL PHOTO identity exactly" — do NOT describe face, skin, hair, or ethnicity in the prompt.`
    : `Model: suitable female fashion model${opts.plan.model_ethnicity ? `, prefer ${opts.plan.model_ethnicity}` : ""}.`;

  const poseClause = opts.plan.model_pose?.trim()
    ? opts.plan.model_pose.trim()
    : "natural S-curve, slight torso twist, relaxed hands, soft smile";

  // Compact one-liner: only non-empty styling fields, pipe-separated
  const stylingParts = [
    opts.plan.occasion             && `occasion: ${opts.plan.occasion}`,
    opts.plan.footwear             && `footwear: ${opts.plan.footwear}`,
    opts.plan.accessories.length   && `accessories: ${opts.plan.accessories.join(", ")}`,
    opts.plan.style_keywords.length && `style: ${opts.plan.style_keywords.join(", ")}`,
    opts.plan.model_styling_notes  && `styling: ${opts.plan.model_styling_notes}`,
  ].filter(Boolean).join(" | ");

  // ── Optimised prompt (~350–450 tokens vs ~900+ before) ───────────────────
  // Removed: verbose camera/lens specs, lighting angle details, composition theory,
  //          repeated negative rules, redundant style guide paragraphs, full GLOBAL_AVOID
  //          expansion, and background_desc/model_desc verbose metadata blocks.
  const prompt = `Write ONE image-generation prompt (3–4 sentences, ≤120 words) for a photorealistic ecommerce fashion photo.

NON-NEGOTIABLE RULES — weave naturally into the prompt, do not list verbatim:
• Garment: model wears EXACTLY the garment from GARMENT REFERENCE — match color, print, seams, silhouette; no added fabric or layers.
• Framing: full-body head-to-toe, 3:4 portrait, 1080×1440 px; model fills ~80–85% of frame height; no cropping at any edge.
• Age: young adult female 18–23, clearly adult.
• ${bgClause}
• ${modelClause}
• Pose: ${poseClause}.
• Look: warm, sunny, polished ecommerce lookbook; natural daylight; crisp focus; medium contrast; no CGI/plastic finish.
• Clean: one person, correct anatomy, no text overlays, no watermarks.

STYLING (incorporate naturally — use what fits, skip "(none)"):
${stylingParts || "(use occasion from garment context)"}

OUTPUT: plain prompt text only — no quotes, no JSON, no headings.
Avoid: ${opts.plan.negative_prompt || "blurry, cropped head/feet, extra limbs, text overlay, CGI look"}`.trim();

  try {
    const result = await generateText({
      model: opts.model,
      promptText: prompt,
      images: null,
      timeoutMs: opts.timeoutMs ?? 120_000,
      temperature: 0.2,
      maxOutputTokens: 150, // 3–4 sentences ≈ 80–120 tokens; 150 gives comfortable headroom
    });
    return { prompt: result.text.trim(), rawText: result.text };
  } catch (err: any) {
    // Compact structured fallback — no run-on sentence
    const bgFallback = opts.hasBackgroundReference
      ? "in the BACKGROUND PHOTO"
      : `in a photorealistic ${opts.plan.background_theme || opts.plan.occasion} setting`;
    const modelFallback = opts.hasModelReference
      ? "matching the MODEL PHOTO identity exactly"
      : `one female model${opts.plan.model_ethnicity ? ` (${opts.plan.model_ethnicity})` : ""}`;
    const fallback = [
      `Photorealistic ecommerce fashion photo, warm sunny lookbook style.`,
      `${modelFallback}, young adult 18–23, wearing EXACTLY the garment from GARMENT REFERENCE — same color, print, seams; no extra fabric.`,
      `Full-body head-to-toe 3:4 portrait 1080×1440 px, model fills 80–85% of frame, no cropping.`,
      opts.plan.occasion     ? `Occasion: ${opts.plan.occasion}.` : "",
      opts.plan.footwear     ? `Footwear: ${opts.plan.footwear}.` : "",
      opts.plan.accessories.length ? `Accessories: ${opts.plan.accessories.join(", ")}.` : "",
      `${bgFallback}. Natural daylight, crisp focus, medium contrast.`,
      `Avoid: ${opts.plan.negative_prompt || "blurry, cropped, extra limbs, text overlay"}.`,
    ].filter(Boolean).join(" ");
    return { prompt: fallback, rawText: String(err?.message || err) };
  }
}

export function buildGarmentReferencePrompt(hasBackView = false, model = ""): string {
  const inputDesc = hasBackView
    ? "IMAGE 1 = FRONT view of the garment. IMAGE 2 = BACK view of the SAME garment. Use both views to capture the complete design accurately."
    : "IMAGE 1 = FRONT view of the garment.";

  if (isFlashModel(model)) {
    return [
      "Generate a photorealistic ecommerce product reference image of a garment.",
      "",
      `INPUT: ${inputDesc}`,
      "",
      "TASK: Create a clean catalog cutout of this garment on a neutral background.",
      "",
      "OUTPUT REQUIREMENTS — follow each rule exactly:",
      "1. BACKGROUND: Pure white or very light neutral gray (#f5f5f5 or lighter). Seamless, flat. No shadows on the backdrop itself.",
      "2. LIGHTING: Even diffused studio light from front and sides. No harsh directional shadows. Garment must look evenly lit.",
      "3. GARMENT POSITION:",
      "   • CENTERED in frame — equal margins on all four sides (~10–15% padding).",
      "   • FULLY VISIBLE — no cropping at any edge.",
      "   • Show: complete collar/neckline at top, full hem at bottom, both full sleeves.",
      "   • Garment fills approximately 70–80% of the frame width.",
      "4. GARMENT ACCURACY — this is the most critical requirement:",
      "   • COLOR: reproduce the exact garment color. Do NOT lighten, darken, or shift the hue.",
      "   • PRINT/GRAPHICS: reproduce all patterns, logos, text, graphics exactly as they appear in the input.",
      "   • SHAPE: match neckline shape, collar type, sleeve length/style, and hem shape exactly.",
      "   • TEXTURE: preserve fabric weave, seam placement, and material detail.",
      "   • RULE: Do NOT add, remove, simplify, or modify any design element.",
      "5. BODY/MANNEQUIN: Remove the mannequin, body, and stand from the output. Ghost mannequin (invisible body form) is the preferred output.",
      "6. QUALITY: photorealistic, high resolution, crisp garment edges, sharp focus, commercially usable.",
      "",
      "REJECT output if any of these are true:",
      "- Garment is cropped at any edge",
      "- Garment color differs from the input",
      "- Any graphic, text, or logo is missing, altered, or simplified",
      "- Background is not clean and neutral",
      "- Mannequin, body, or body parts are visible",
      "- Lighting is harsh or uneven",
    ].join("\n");
  }

  // ── Gemini 3 Pro prompt — concise prose, model fills in nuance ──
  return [
    "You are generating a photorealistic ecommerce product reference image of a garment.",
    `INPUT: ${inputDesc}`,
    "OUTPUT: A clean, high-resolution catalog cutout of the FRONT of the garment on a plain light-neutral background.",
    "Use even, diffused studio lighting; accurate color; crisp edges; no harsh shadows.",
    "Hard rules:",
    "- Preserve the garment design exactly — color (no hue shifts), print/pattern, logos/graphics, text, texture, seams, silhouette.",
    "- Do NOT add or remove design elements. Do NOT invent missing details. If unclear, keep it as-is.",
    "- Remove mannequin/body/stand. Ghost mannequin preferred.",
    "- Center the garment fully visible (no cropping at any edge), proportions realistic, medium-large in frame.",
    "- Equal padding on all sides (~10–15%). Full collar, sleeves, and hem visible.",
    "- No additional text, no watermark, no new logos.",
  ].join("\n");
}

export function buildPrintApplicationPrompt(opts: {
  additionalPrompt: string;
  retryComment?: string;
  colorHex?: string;
  hasDesign?: boolean;
  view?: "front" | "back" | "side";
  garmentType?: string;
}): string {
  const extra = (opts.additionalPrompt || "").trim();
  const hasRetry = typeof opts.retryComment === "string";
  const retryComment = (opts.retryComment || "").trim();
  const colorHex = (opts.colorHex || "").trim();
  const hasColorHex = Boolean(colorHex);
  const view = opts.view || "front";
  const garment = (opts.garmentType || "garment").toLowerCase();

  const lines: string[] = [];

  if (hasRetry) {
    lines.push(
      "RETRY: Regenerate with same inputs. Keep composition identical.",
      ...(retryComment ? [`Improve: ${retryComment}`] : []),
      "",
    );
  }

  const viewLabel = view === "front" ? "FRONT" : view === "back" ? "BACK" : "SIDE (90° profile)";
  const viewRule =
    view === "front"
      ? "FRONT view — garment faces camera fully. Full collar, both sleeves, and hem visible (no cropping)."
      : view === "back"
      ? "BACK view — show back of garment only. No front buttons or chest visible."
      : "SIDE view — true 90° profile. Mannequin faces left or right, not camera.";
  const isNotFront = view !== "front";

  if (hasColorHex && opts.hasDesign) {
    lines.push(
      `IMAGE 1 = DESIGN PATTERN. IMAGE 2 = ${garment} template (${viewLabel}).`,
      "",
      `TASK: (1) Recolor ${garment} fabric to HEX ${colorHex}. (2) Apply design from IMAGE 1 as fabric texture on top.`,
      "",
      "STEP 1 — RECOLOR:",
      `- Tint garment fabric only to ${colorHex}. Preserve shadows, highlights, wrinkles, folds, fabric texture.`,
      "- No change to mannequin, background, camera angle, or framing.",
      "",
      "STEP 2 — DESIGN OVERLAY:",
      "- Blend design onto recolored surface (multiply/overlay mode) — not a flat sticker.",
      "- Design follows garment folds, contours, perspective. Confined to fabric only — no bleed past seams, neckline, hem, cuffs.",
      "- Recolored base remains as ground color. Preserve all fabric shadows and highlights.",
      "- Pattern scale = garment bounding box (not canvas). Uniform tiling density.",
      "",
      `VIEW: ${viewRule}`,
      isNotFront
        ? "Match front view: same hex tone, pattern scale, tiling density, lighting."
        : "REFERENCE VIEW — back view must replicate this pattern scale exactly.",
      "",
      "HARD RULES: framing/size identical to IMAGE 2 · full garment visible · no background change · no mannequin change · no silhouette distortion · pattern never outside garment boundary.",
      "Style: photorealistic e-commerce product photo, sharp, commercially usable.",
    );
  } else if (hasColorHex) {
    lines.push(
      `IMAGE 1 = COLOR SWATCH. IMAGE 2 = ${garment} template (${viewLabel}).`,
      "",
      `TASK: Recolor ${garment} fabric in IMAGE 2 to HEX ${colorHex}.`,
      "",
      "RULES:",
      `1. Apply ${colorHex} to garment fabric only. Color looks dyed into cloth — preserves shadows, highlights, wrinkles, fabric texture.`,
      "2. Keep everything else pixel-identical: mannequin, background, lighting, shadows, framing, camera angle.",
      "3. Full garment visible — no cropping. Same whitespace and margins as IMAGE 2.",
      "4. No new patterns, gradients, or hue drift.",
      `5. VIEW: ${viewRule}`,
      "Style: photorealistic e-commerce product photo.",
    );
  } else {
    lines.push(
      `IMAGE 1 = DESIGN PATTERN. IMAGE 2 = ${garment} template (${viewLabel}).`,
      "",
      `TASK: Apply design from IMAGE 1 onto the ${garment} in IMAGE 2 as realistic fabric texture.`,
      "",
      "RULES:",
      "1. FRAME: Garment size, zoom, crop, whitespace, background — IDENTICAL to IMAGE 2.",
      "2. TEXTURE: Blend design into fabric (multiply/overlay) — not a flat sticker. Follows folds, contours, perspective.",
      "3. BOUNDARY: Design on garment fabric only. No bleed past seams, neckline, hem, or cuffs.",
      "4. PRESERVATION: Base fabric color, shadows, highlights, texture unchanged. No bleaching or lightening.",
      "5. SCALE: Pattern tile = garment bounding box (not canvas). Uniform density.",
      `6. VIEW: ${viewRule}`,
      isNotFront
        ? "   Match front view: same pattern scale, tiling density, lighting integration."
        : "   REFERENCE VIEW — back must replicate this pattern scale exactly.",
      "7. OUTPUT: Full garment visible (collar, sleeves, hem). No new elements, no background change, no silhouette distortion.",
    );
  }

  if (extra) {
    lines.push("", `Enhancement: ${extra}`);
  }

  return lines.join("\n").trim();
}

export function buildCompositePrompt(opts: {
  plan: LookPlan;
  finalPrompt: string;
  hasModelReference: boolean;
  hasPoseReference?: boolean;
  hasBackgroundReference: boolean;
  originalGarmentCount?: number;
}): string {
  const avoid = [normalizeAvoidClause(opts.plan.negative_prompt), GLOBAL_AVOID].filter(Boolean).join(", ");

  const lines: string[] = [
    "You are generating a photorealistic ecommerce fashion product photo for an online store.",
    "The product is the hero: keep the garment accurate and undistorted.",
    "Style baseline: warm, sunny, polished, approachable, slightly editorial. Aspirational lifestyle (vacation wardrobe lookbook). Not gritty street-style; not dramatic high-fashion.",
    "Camera & lighting: vertical 3:4 full-body, 35–50mm look, eye-level, f/3.2–f/4 separation, natural daylight with soft front-side light and gentle fill; medium contrast; warm midtones; crisp focus with visible fabric texture.",
    opts.plan.model_pose
      ? `Pose direction (must follow): ${opts.plan.model_pose}`
      : "Pose direction: natural weight shift (S-curve), legs uncrossed, slight torso twist/shoulder tilt, relaxed hands lightly touching fabric/hip/railing (no clenched fists), slight head tilt, soft smile; optional subtle step/sway to show drape.",
    "Garment presentation: wrinkle-free/steamed look, clear fit and drape, keep neckline/waistline/hemline readable; keep hair/props from covering the garment.",
    "Composition: rule-of-thirds friendly, clean commercial framing with a little breathing room (while keeping full body + product large).",
    "IMAGE 1 is the GARMENT REFERENCE (clean catalog cutout derived from the input garment photo). Use it as the single source of truth for garment design (color, print, texture, seams, silhouette).",
  ];

  let imgIndex = 2;

  // Model photo comes FIRST (right after garment ref) for maximum face fidelity weight
  if (opts.hasModelReference) {
    lines.push(
      `IMAGE ${imgIndex++} is the MODEL PHOTO — the IDENTITY SOURCE. This is the most important reference for the person's appearance.`,
      "FACE IDENTITY LOCK (CRITICAL — equal priority to garment accuracy):",
      "- The generated person MUST be the EXACT same individual as in the MODEL PHOTO.",
      "- Reproduce her face pixel-perfectly: facial bone structure, eye shape, eye color, eyebrow shape, nose shape, lip shape, jawline, chin, cheekbones, forehead, and skin tone.",
      "- Reproduce her hair exactly: hair color, hair texture, hair length, hair style, parting, and volume.",
      "- Do NOT beautify, smooth, age, de-age, slim, widen, lighten, darken, or alter any facial feature.",
      "- Do NOT generate a generic/stock model face. Do NOT average or blend with any other face source.",
      "- The person in the output must be immediately recognizable as the MODEL PHOTO person by someone who knows them.",
    );
  } else {
    lines.push(
      "No model reference is provided: create a suitable single female fashion model"
        + (opts.plan.model_ethnicity ? ` (prefer ${opts.plan.model_ethnicity})` : "")
        + ".",
    );
  }

  // Original garment photos as secondary design reference
  const origCount = opts.originalGarmentCount ?? 0;
  if (origCount > 0) {
    const startIdx = imgIndex;
    const endIdx = imgIndex + origCount - 1;
    imgIndex += origCount;
    lines.push(
      origCount === 1
        ? `IMAGE ${startIdx} is the ORIGINAL GARMENT PHOTO showing the actual print/design details. Use it as secondary reference for graphic accuracy — preserve every graphic print, text, logo, and pattern placement exactly as shown.`
        : `IMAGES ${startIdx}–${endIdx} are the ORIGINAL GARMENT PHOTOS showing the actual print/design details from different angles. Use them as secondary reference for graphic accuracy — preserve every graphic print, text, logo, and pattern placement exactly as shown.`,
    );
  }

  if (opts.hasPoseReference) {
    lines.push(
      `IMAGE ${imgIndex++} is the POSE REFERENCE. Extract ONLY the body pose, posture, and joint positions from this image.`
        + " DO NOT copy the person, face, identity, clothing, or appearance from this image."
        + " The final model identity MUST come from the MODEL PHOTO only, NOT from this image."
        + " If the pose image shows a different person, ignore that person entirely — use only their body position.",
    );
  }

  if (opts.hasBackgroundReference) {
    lines.push(
      `IMAGE ${imgIndex++} is the BACKGROUND PHOTO. ${BACKGROUND_LOCK_RULE}`,
    );
  } else {
    lines.push(
      `No background reference is provided: create a photorealistic background matching ${opts.plan.background_theme || opts.plan.occasion}.`,
    );
  }

  lines.push(
    "The final image must show ONE model wearing the EXACT garment from IMAGE 1.",
    MODEL_AGE_RULE,
    FULL_BODY_RULE,
    "Product scale: keep the model/garment medium-large in frame (avoid wide shots). Aim for the model to fill ~80–85% of the image height while still fully visible head-to-toe. Ensure fabric texture/print details are readable.",
    "Keep the entire garment visible and unobstructed (do not hide it behind props or hair).",
    GARMENT_FIDELITY_RULE,
    "DESIGN PRESERVATION: The garment's graphic prints, text, logos, and pattern placement must be preserved exactly as shown in the GARMENT REFERENCE and ORIGINAL GARMENT PHOTOS — do not simplify, redraw, reinterpret, or alter any graphic elements. If the garment has a specific print or logo, it must appear in the same position, size, and detail.",
    "No added text overlays, no watermarks, no brand logos in the background.",
    "Keep anatomy correct. No extra people. No duplicates.",
  );

  if (opts.plan.accessories.length) {
    lines.push(
      "MUST include these accessories (keep realistic and visible, but do not cover the garment): "
        + opts.plan.accessories.join(", "),
    );
  }
  if (opts.plan.footwear) {
    lines.push("Footwear: " + opts.plan.footwear + " (ensure shoes are visible in the full-body frame).");
  }
  if (opts.plan.style_keywords.length) {
    lines.push("Style keywords: " + opts.plan.style_keywords.join(", "));
  }
  if (opts.plan.model_pose) {
    lines.push("Model pose: " + opts.plan.model_pose);
  }
  if (opts.plan.model_styling_notes) {
    lines.push("Model styling notes: " + opts.plan.model_styling_notes);
  }

  if ((opts.finalPrompt || "").trim()) {
    lines.push(
      "Draft text prompt to incorporate. If it conflicts with any image reference or rules above, ignore the conflicting parts:",
    );
    lines.push(opts.finalPrompt.trim());
  }

  lines.push(
    "FINAL CHECK (non-negotiable):",
    FULL_BODY_RULE,
    MODEL_AGE_RULE,
    "Garment must match IMAGE 1 exactly (no extra fabric, no added layers, no design changes).",
    opts.hasBackgroundReference ? BACKGROUND_LOCK_RULE : "Background must match the scene direction above.",
    "One person only; correct anatomy; no extra limbs; no duplicates.",
  );
  if (opts.hasModelReference) {
    lines.push(
      "FACE IDENTITY FINAL CHECK: Compare the output face to the MODEL PHOTO — it MUST be the same person. Same eyes, nose, lips, jawline, skin tone, hair color, hair style. If it does not look like the same person, the image is REJECTED.",
    );
  }
  if (opts.hasPoseReference && opts.hasModelReference) {
    lines.push(
      "The pose image is body-position-only reference — do NOT transfer any identity, face, hair, or clothing from the pose image.",
    );
  }
  lines.push(`Avoid: ${avoid}${opts.hasModelReference ? ", altered face, wrong face, face morphing, generic stock model face, different person than MODEL PHOTO" : ""}`);
  return lines.join("\n").trim();
}

export function buildRetryCompositePrompt(opts: {
  plan: LookPlan;
  finalPrompt: string;
  hasModelReference: boolean;
  hasPoseReference?: boolean;
  hasBackgroundReference: boolean;
  retryComment: string;
  originalGarmentCount?: number;
}): string {
  const base = buildCompositePrompt({
    plan: opts.plan,
    finalPrompt: opts.finalPrompt,
    hasModelReference: opts.hasModelReference,
    hasPoseReference: opts.hasPoseReference,
    hasBackgroundReference: opts.hasBackgroundReference,
    originalGarmentCount: opts.originalGarmentCount,
  });

  const comment = (opts.retryComment || "").trim();
  const header: string[] = [
    "RETRY PASS (main image): This is a re-generation of the main image for the SAME garment.",
    "Keep the garment design identical and follow all hard framing + fidelity rules.",
    "Apply the user's retry comments as targeted improvements; do not introduce new clothing elements or extra fabric.",
    `Occasion: ${opts.plan.occasion || "(auto)"}`,
    `Color scheme: ${opts.plan.color_scheme || "(auto)"}`,
    `Background theme: ${opts.plan.background_theme || "(auto)"}`,
    `Model: ${opts.plan.model_ethnicity || "(auto)"}`,
    `Model pose: ${opts.plan.model_pose || "(auto)"}`,
    `Footwear: ${opts.plan.footwear || "(auto)"}`,
    `Accessories: ${opts.plan.accessories.length ? opts.plan.accessories.join(", ") : "(auto)"}`,
    `Style keywords: ${opts.plan.style_keywords.length ? opts.plan.style_keywords.join(", ") : "(auto)"}`,
    `Model styling notes: ${opts.plan.model_styling_notes || "(auto)"}`,
  ];
  if (comment) header.push(`User retry comments: ${comment}`);
  header.push("");

  return header.join("\n") + base;
}

export type MultiAngleKind = "side" | "back" | "detail";

export function buildMultiAnglePrompt(opts: {
  angle: MultiAngleKind;
  plan: LookPlan;
  finalPrompt: string;
  garmentAngleCount: number;
  hasModelReference: boolean;
  hasBackgroundReference: boolean;
  hasPoseReference?: boolean;
  garmentType?: string;
}): string {
  const avoid = [normalizeAvoidClause(opts.plan.negative_prompt), GLOBAL_AVOID].filter(Boolean).join(", ");

  const garmentAngles = Math.max(0, Math.min(4, Math.floor(opts.garmentAngleCount || 0)));
  const mainImageIndex = 2 + garmentAngles;
  const modelIndex = opts.hasModelReference ? mainImageIndex + 1 : null;
  const backgroundIndex = opts.hasBackgroundReference ? mainImageIndex + (opts.hasModelReference ? 2 : 1) : null;
  const poseRefIndex = opts.hasPoseReference
    ? mainImageIndex + (opts.hasModelReference ? 1 : 0) + (opts.hasBackgroundReference ? 1 : 0) + 1
    : null;

  const lines: string[] = [
    "You are generating additional angles for an ecommerce fashion product photo.",
    "Goal: create an additional view of the SAME look as the MAIN RESULT image, while keeping the garment design accurate.",
    "Style baseline: warm, sunny, polished, approachable, slightly editorial. Aspirational lifestyle (vacation wardrobe lookbook). Not gritty street-style; not dramatic high-fashion.",
    "Camera & lighting: vertical 3:4 full-body, 35–50mm look, eye-level, f/3.2–f/4 separation, natural daylight with soft front-side light and gentle fill; medium contrast; warm midtones; crisp focus with visible fabric texture.",
    FULL_BODY_RULE,
    "Product scale: keep the model/garment medium-large in frame (avoid wide shots). Aim for the model to fill ~80–85% of the image height while still fully visible head-to-toe.",
    "Keep the entire garment visible and unobstructed (no hair/props covering key details).",
    MODEL_AGE_RULE,
    GARMENT_FIDELITY_RULE,
    "Keep anatomy correct. One person only.",
    "IMAGE 1 is the GARMENT REFERENCE CUTOUT (source of truth for garment design).",
  ];

  if (garmentAngles) {
    lines.push(
      `IMAGES 2–${1 + garmentAngles} are additional GARMENT PHOTOS of the SAME garment (different angles). Use them only to preserve back/side details; ignore mannequin/body/stand and ignore those photos' original backgrounds.`,
    );
  }

  lines.push(`IMAGE ${mainImageIndex} is the MAIN RESULT image (match the same model identity, hair/makeup, accessories, lighting, and scene).`);

  if (modelIndex) {
    lines.push(`IMAGE ${modelIndex} is the MODEL PHOTO (optional; use it for identity/face consistency).`);
  }
  if (backgroundIndex) {
    lines.push(`IMAGE ${backgroundIndex} is the BACKGROUND PHOTO (optional; use it for scene consistency).`);
  }

  if (opts.angle === "side") {
    lines.push(
      "Requested view: SIDE VIEW.",
      "Pose: natural ecommerce side/3-4 turn. Rotate the body ~60–80° from camera, subtle weight shift (S-curve), one foot slightly forward, relaxed arms (one hand lightly on hip or along thigh), shoulders relaxed, soft smile.",
      "Composition: show the garment silhouette and side seam clearly; do not obscure the garment with hair or arms.",
    );
    if (poseRefIndex) {
      lines.push(`IMAGE ${poseRefIndex} is a SIDE POSE REFERENCE photo. Use it to guide the model's body pose and stance for the side view. Do NOT copy the model's face, hair, clothing, or background from this reference — only use the body pose and stance as inspiration.`);
    }
  } else if (opts.angle === "back") {
    lines.push(
      "Requested view: BACK VIEW.",
      "Pose: natural ecommerce back view. Model facing away from camera, slight head turn 15–30° (profile/3-4), arms relaxed slightly away from body to reveal the garment back, gentle weight shift, soft expression.",
      "Composition: show the garment back details clearly; move hair aside so the back of the garment is visible.",
    );
    if (poseRefIndex) {
      lines.push(`IMAGE ${poseRefIndex} is a BACK POSE REFERENCE photo. Use it to guide the model's body pose and stance for the back view. Do NOT copy the model's face, hair, clothing, or background from this reference — only use the body pose and stance as inspiration.`);
    }
  } else {
    // detail shot
    const gType = (opts.garmentType || "").trim().toLowerCase();
    let focusRegion: string;
    if (["t-shirt", "shirt", "hoodie", "sweater"].some((g) => gType.includes(g))) {
      focusRegion = "from shoulders to waist — capturing the neckline, chest, and hem of the upper body garment";
    } else if (["jacket", "blazer"].some((g) => gType.includes(g))) {
      focusRegion = "from shoulders to slightly below waist — capturing lapels, buttons, and the structured silhouette of the outerwear";
    } else if (["pant", "jeans", "shorts"].some((g) => gType.includes(g))) {
      focusRegion = "from waist to knee or thigh — capturing the waistband, fly, pockets, and leg fabric of the lower body garment";
    } else if (gType.includes("saree")) {
      focusRegion = "the draped area around the waist and the flowing pallu fabric — highlighting pleats, border, and textile texture of the saree";
    } else {
      focusRegion = "the most garment-rich region of the body (typically shoulders to waist for upper body, or waist to knee for lower body)";
    }
    lines.push(
      "Requested view: DETAIL SHOT (zoomed-in garment close-up).",
      `Focus region: ${focusRegion}.`,
      "Framing: crop tightly so the garment fills most of the frame; keep minimal background visible; exclude face and irrelevant body parts (e.g. legs for upper-body garments, head/face for lower-body garments).",
      "Garment must be centered and occupy at least 80% of the frame.",
      "Highlight fine fabric details: folds, stitching, seams, texture, and realistic shadows. Sharp focus, high resolution.",
      "Maintain the exact same garment design, color, texture, fit, and print as seen in the MAIN RESULT image. Do not alter the outfit.",
      "Style: professional fashion e-commerce detail shot, clean composition, realistic lighting, high detail.",
      "Do NOT show a full body. Do NOT include the face. Do NOT add new garment elements.",
    );
  }

  if (opts.plan.accessories.length) {
    lines.push(
      "Accessories (keep consistent with the main image and do not cover the garment): " + opts.plan.accessories.join(", "),
    );
  }
  if (opts.plan.footwear) {
    lines.push("Footwear (keep consistent with the main image): " + opts.plan.footwear);
  }
  if (opts.plan.style_keywords.length) {
    lines.push("Style keywords: " + opts.plan.style_keywords.join(", "));
  }
  if (opts.plan.model_styling_notes) {
    lines.push("Model styling notes: " + opts.plan.model_styling_notes);
  }

  if ((opts.finalPrompt || "").trim()) {
    lines.push("Baseline description to keep consistent (override only the pose/viewpoint as requested):");
    lines.push(opts.finalPrompt.trim());
  }

  if (opts.angle === "detail") {
    lines.push(
      "FINAL CHECK (non-negotiable):",
      "This is a DETAIL SHOT — do NOT output a full-body image. Crop tightly to the garment focus region.",
      MODEL_AGE_RULE,
      "Garment must match IMAGE 1 and the MAIN RESULT exactly (no extra fabric, no added layers, no design changes).",
      "One person only; correct anatomy; no face visible; no extra limbs.",
    );
  } else {
    lines.push(
      "FINAL CHECK (non-negotiable):",
      FULL_BODY_RULE,
      MODEL_AGE_RULE,
      "Garment must match IMAGE 1 and the MAIN RESULT (no extra fabric, no added layers, no design changes).",
      "Match the same background/scene as the MAIN RESULT (and BACKGROUND PHOTO if provided).",
      "One person only; correct anatomy; no extra limbs; no duplicates.",
    );
  }
  lines.push(`Avoid: ${avoid}`);
  return lines.join("\n").trim();
}

export function applyFreeformOverrides(
  plan: LookPlan,
  opts: { styleKeywords?: string[]; accessories?: string[]; footwear?: string | null },
): LookPlan {
  return {
    ...plan,
    ...(opts.styleKeywords && opts.styleKeywords.length ? { style_keywords: opts.styleKeywords } : {}),
    ...(opts.accessories && opts.accessories.length ? { accessories: opts.accessories } : {}),
    ...(opts.footwear && opts.footwear.trim() ? { footwear: opts.footwear.trim() } : {}),
  };
}

// ─── Saree Analysis ──────────────────────────────────────────────────────────

export type SareeAnalysis = {
  pallu_position: string;       // e.g. "right_end", "left_end", "draped_over_shoulder"
  pallu_design: string;         // e.g. "heavy zari work", "floral embroidery", "plain"
  border_width: string;         // "thin" | "medium" | "thick"
  border_design: string;        // e.g. "gold zari stripe", "woven geometric", "plain"
  body_pattern: string;         // e.g. "floral", "checks", "stripes", "plain", "paisley"
  body_color: string;           // dominant body color
  fabric: string;               // e.g. "silk", "cotton", "georgette", "chiffon", "linen"
  drape_style: string;          // e.g. "nivi", "gujarati", "maharashtrian", "unknown"
  embellishments: string[];     // e.g. ["zari", "sequins", "mirror work"]
  occasion: string;             // e.g. "bridal", "festive", "casual", "formal"
  confidence_notes: string;     // anything uncertain or inferred
};

export async function analyzeSaree(opts: {
  model: string;
  sareeImage: { mimeType: string; data: Uint8Array };
  timeoutMs?: number;
}): Promise<{ analysis: SareeAnalysis; rawText: string; rawJson: Record<string, unknown> }> {
  const prompt = `
You are an expert saree analyst with deep knowledge of Indian textiles, weaving traditions, and draping styles.
Examine the saree in the image carefully and identify each component.

Return ONLY valid JSON with exactly these keys:

{
  "pallu_position": string (where the pallu is: "right_end", "left_end", "draped_over_shoulder", "not_visible", or describe),
  "pallu_design": string (design/work on the pallu: e.g. "heavy zari work", "floral embroidery", "plain", "woven motifs"),
  "border_width": string ("thin" | "medium" | "thick" — judge relative to the body),
  "border_design": string (e.g. "gold zari stripe", "woven temple border", "plain", "embroidered floral"),
  "body_pattern": string (dominant pattern: "plain", "floral", "checks", "stripes", "paisley", "geometric", "abstract", "banarasi buti", etc.),
  "body_color": string (dominant body color in plain English, e.g. "deep red", "ivory", "teal"),
  "fabric": string (best guess: "silk", "cotton", "georgette", "chiffon", "linen", "organza", "net", "crepe", "tussar", "chanderi", "as-is"),
  "drape_style": string ("nivi", "gujarati", "maharashtrian", "seedha pallu", "unknown" — infer from image if possible),
  "embellishments": array of strings (e.g. ["zari", "sequins", "mirror work", "stone work"] — empty array if none visible),
  "occasion": string ("bridal", "festive", "casual", "formal", "party", "daily wear"),
  "confidence_notes": string (note anything uncertain, inferred, or partially visible)
}

Hard rules:
- Output ONLY valid JSON. No markdown, no commentary, no code fences.
- If a detail is not visible, use "not_visible" or "unknown" rather than guessing wildly.
- Do not hallucinate details you cannot see.
`.trim();

  const result = await generateText({
    model: opts.model,
    promptText: prompt,
    images: [opts.sareeImage],
    timeoutMs: opts.timeoutMs ?? 60_000,
    temperature: 0.1,
    maxOutputTokens: 512,
  });

  const rawJson = extractJsonObject(result.text);

  const analysis: SareeAnalysis = {
    pallu_position: coerceStr(rawJson.pallu_position) || "unknown",
    pallu_design: coerceStr(rawJson.pallu_design) || "unknown",
    border_width: coerceStr(rawJson.border_width) || "medium",
    border_design: coerceStr(rawJson.border_design) || "unknown",
    body_pattern: coerceStr(rawJson.body_pattern) || "unknown",
    body_color: coerceStr(rawJson.body_color) || "unknown",
    fabric: coerceStr(rawJson.fabric) || "unknown",
    drape_style: coerceStr(rawJson.drape_style) || "unknown",
    embellishments: coerceStrList(rawJson.embellishments),
    occasion: coerceStr(rawJson.occasion) || "festive",
    confidence_notes: coerceStr(rawJson.confidence_notes) || "",
  };

  return { analysis, rawText: result.text, rawJson };
}

export async function generateSareePrompt(opts: {
  model: string;
  analysis: SareeAnalysis;
  extraNotes?: string;
  timeoutMs?: number;
}): Promise<{ prompt: string; negativePrompt: string; rawText: string }> {
  const a = opts.analysis;
  const embStr = a.embellishments.length ? a.embellishments.join(", ") : "none";

  const prompt = `
You write prompts for a photorealistic AI image generation model that creates ecommerce/fashion photos.
Based on the saree analysis below, write ONE concise, detailed generation prompt (3–5 sentences) that accurately describes the saree for an image generation model.

Saree analysis:
- Fabric: ${a.fabric}
- Body color: ${a.body_color}
- Body pattern: ${a.body_pattern}
- Border width: ${a.border_width}
- Border design: ${a.border_design}
- Pallu position: ${a.pallu_position}
- Pallu design: ${a.pallu_design}
- Drape style: ${a.drape_style}
- Embellishments: ${embStr}
- Occasion: ${a.occasion}
${opts.extraNotes ? `- Extra notes: ${opts.extraNotes}` : ""}

Rules for the prompt:
- Describe the saree garment itself in rich, precise detail (fabric, color, pattern, border, pallu).
- Include draping style and how the pallu falls/is arranged.
- Mention embellishments and their placement.
- Keep it commercially usable and photorealistic (not illustrated or artistic).
- Do NOT describe the model's face, hairstyle, or jewelry (those are decided elsewhere).
- Keep it under 120 words.

Also write a short negative prompt (under 30 words) listing things to avoid (e.g. wrong drape, altered design, extra fabric, print errors).

Return JSON with exactly two keys:
{
  "prompt": string,
  "negative_prompt": string
}
Output ONLY valid JSON. No markdown, no code fences.
`.trim();

  const result = await generateText({
    model: opts.model,
    promptText: prompt,
    images: null,
    timeoutMs: opts.timeoutMs ?? 60_000,
    temperature: 0.2,
    maxOutputTokens: 300,
  });

  let generatedPrompt = "";
  let negativePrompt = "";

  try {
    const json = extractJsonObject(result.text);
    generatedPrompt = coerceStr(json.prompt) || result.text.trim();
    negativePrompt = coerceStr(json.negative_prompt) || "wrong drape, altered print, extra fabric, blurry, low quality";
  } catch {
    generatedPrompt = result.text.trim();
    negativePrompt = "wrong drape, altered print, extra fabric, blurry, low quality";
  }

  return { prompt: generatedPrompt, negativePrompt, rawText: result.text };
}

export function buildSareeCompositePrompt(opts: {
  analysis: SareeAnalysis;
  sareePrompt: string;
  hasModelReference: boolean;
  hasPoseReference?: boolean;
  hasBackgroundReference: boolean;
  plan?: Partial<LookPlan>;
}): string {
  const a = opts.analysis;
  const avoid = [
    "wrong drape, altered saree design, extra fabric, added layers, incorrect border, wrong print",
    GLOBAL_AVOID,
  ].join(", ");

  const lines: string[] = [
    "You are generating a photorealistic ecommerce/fashion photo of a woman wearing a traditional Indian saree.",
    "The saree is the hero: preserve every detail of the garment accurately.",
    "Style baseline: warm, polished, aspirational — traditional elegance meets modern catalogue photography.",
    "Camera & lighting: vertical 3:4 full-body, 35–50mm look, eye-level, f/3.2–f/4 separation, natural daylight with soft fill; warm midtones; crisp focus; visible fabric texture and embellishment detail.",
    FULL_BODY_RULE,
    MODEL_AGE_RULE,
    "IMAGE 1 is the SAREE REFERENCE. It is the single source of truth for the saree's color, pattern, border, pallu, and fabric texture.",
  ];

  let imgIndex = 2;

  if (opts.hasModelReference) {
    lines.push(`IMAGE ${imgIndex++} is the MODEL PHOTO. Match her exact identity, face, and body proportions.`);
  } else {
    lines.push("No model reference provided: create a suitable female model appropriate for the saree occasion.");
  }

  if (opts.hasPoseReference) {
    const pI = imgIndex++;
    lines.push(
      `IMAGE ${pI} is the POSE REFERENCE — body skeleton and stance ONLY.`,
      `• Extract ONLY: joint positions, body posture, limb angles, weight distribution, and stance from IMAGE ${pI}.`,
      `• COMPLETELY IGNORE from IMAGE ${pI}: the person's face, hair, skin tone, identity, clothing, and outfit.`,
      `• DO NOT reproduce the clothing shown in IMAGE ${pI}. Output saree = IMAGE 1 only.`,
    );
  }

  if (opts.hasBackgroundReference) {
    lines.push(`IMAGE ${imgIndex++} is the BACKGROUND PHOTO. ${BACKGROUND_LOCK_RULE}`);
  } else {
    const bg = opts.plan?.background_theme || opts.analysis.occasion || "festive indoor";
    lines.push(`No background reference provided: create a photorealistic setting appropriate for a ${bg} saree.`);
  }

  lines.push(
    "",
    "Saree details (MUST reproduce accurately):",
    `- Fabric: ${a.fabric}`,
    `- Body color: ${a.body_color}`,
    `- Body pattern: ${a.body_pattern}`,
    `- Border: ${a.border_width} width, design: ${a.border_design}`,
    `- Pallu: ${a.pallu_position}, design: ${a.pallu_design}`,
    `- Drape style: ${a.drape_style}`,
    a.embellishments.length ? `- Embellishments: ${a.embellishments.join(", ")}` : "",
    `- Occasion: ${a.occasion}`,
    "",
    "Draping rules:",
    "- Show neat front pleats tucked into the waistband, clearly visible and well-pressed.",
    "- Pallu draped naturally over the left shoulder with the design/border clearly visible.",
    "- Blouse should be a matching or complementary color — no extra layers, no added jacket/shawl.",
    "- Full 6-yard drape silhouette must be visible from head to toe.",
    "",
    GARMENT_FIDELITY_RULE,
    "Keep anatomy correct. One person only. No extra people, no duplicates.",
  );

  if ((opts.sareePrompt || "").trim()) {
    lines.push("", "Additional prompt guidance (incorporate; defer to image references if conflict):");
    lines.push(opts.sareePrompt.trim());
  }

  lines.push(
    "",
    "FINAL CHECK (non-negotiable):",
    FULL_BODY_RULE,
    MODEL_AGE_RULE,
    "Saree must match IMAGE 1 exactly — correct color, pattern, border, pallu, fabric texture.",
    opts.hasBackgroundReference ? BACKGROUND_LOCK_RULE : "Background must match the occasion/scene direction.",
    "One person only; correct anatomy; no extra limbs; no duplicates.",
  );
  if (opts.hasPoseReference) {
    lines.push(
      "POSE REFERENCE is body-position-only — do NOT transfer any identity, face, hair, or clothing from it.",
      "Clothing/outfit visible in the POSE REFERENCE must NOT appear in the output — output saree = IMAGE 1 only.",
    );
  }
  if (opts.hasPoseReference && opts.hasModelReference) {
    lines.push("IDENTITY: final person MUST be MODEL PHOTO person only — do NOT use identity from pose image.");
  }
  lines.push(`Avoid: ${avoid}${opts.hasPoseReference ? ", copying clothing from pose reference" : ""}`);
  return lines.filter(Boolean).join("\n").trim();
}

export function computeTimingsMs(timings: Record<string, number>): {
  textLlmMs: number;
  imageGenMs: number;
  totalMs: number;
} {
  const textLlmMs = (timings.plan ?? 0) + (timings.final_prompt ?? 0);
  const imageGenMs = (timings.garment_reference ?? 0) + (timings.composite ?? 0);
  const totalMs = textLlmMs + imageGenMs;
  return { textLlmMs, imageGenMs, totalMs };
}

// ─── Cost-Optimized Pipeline v2 ──────────────────────────────────────────────
//
// BEFORE (original flow):
//   planLookFromGarment()    → 1 text LLM call  (~₹3–5)
//   generateFinalPrompt()    → 1 text LLM call  (~₹2–4)
//   garment reference gen    → 1 image call     (~₹5–8)  [no cache]
//   composite gen            → 1 image call     (~₹5–8)
//   TOTAL                    → ~₹15–25 per run
//
// AFTER (optimized flow):
//   garment reference gen    → cached or 1 image call (~₹0–8)
//   composite gen            → 1 image call     (~₹5–8)
//   TOTAL                    → ~₹5–16 per run
//
// Savings:
//   - 2 text LLM calls removed → ~₹5–9 saved
//   - Garment ref cached by SHA-256 hash → ~₹5–8 saved on repeat runs
//   - Prompt size reduced to ~600 tokens (was ~1100) → token cost cut ~45%
//   - Image inputs cut from 5–8 images to 2–4 → reduces image token cost

// ── Types ────────────────────────────────────────────────────────────────────

export type DirectCompositeConfig = {
  occasion?: string;
  footwear?: string;
  accessories?: string;
  /** Dedicated bottom-wear directive — e.g. "black bell bottom pants". Kept separate from styleKeywords so the AI treats it as the required lower garment, not a style tag. */
  bottomWear?: string;
  styleKeywords?: string;
  modelPose?: string;
  modelStylingNotes?: string;
  backgroundTheme?: string;
  /** Model person config (Flash model only — ignored when a model reference photo is uploaded) */
  modelGender?: string;
  modelAgeRange?: string;
  modelEthnicity?: string;
  modelCustomPrompt?: string;
};

// ── Prompt builders ───────────────────────────────────────────────────────────

// ────────────────────────────────────────────────────────────────────────────
// Flash-specific composite prompt builder
// Strategy: highly-structured sections, numbered rules, explicit REJECT list.
// Flash models are more literal — every requirement must be spelled out clearly.
// ────────────────────────────────────────────────────────────────────────────
function buildFlashDirectCompositePrompt(opts: {
  hasModelReference: boolean;
  hasPoseReference?: boolean;
  hasBackgroundReference: boolean;
  config: DirectCompositeConfig;
  isRetry?: boolean;
  retryComment?: string;
}): string {
  const lines: string[] = [];

  // FLASH IMAGE ORDER: pose comes BEFORE model photo intentionally.
  // Flash has a recency bias — the last human face seen tends to dominate the output.
  // By placing the MODEL PHOTO last among human-containing images, its face takes priority.
  let _idx = 2;
  const I_POSE  = opts.hasPoseReference       ? _idx++ : null;  // pose first (body-only)
  const I_MODEL = opts.hasModelReference      ? _idx++ : null;  // model last (face-dominant)
  const I_BG    = opts.hasBackgroundReference ? _idx++ : null;

  if (opts.isRetry) {
    lines.push(
      "RETRY PASS — re-generate for the SAME inputs. Apply ONLY the correction listed below. All rules still apply.",
      opts.retryComment?.trim() ? `Correction: ${opts.retryComment.trim()}` : "",
      "",
    );
  }

  // Face-source disambiguation must come first so Flash reads it before any image index
  if (I_MODEL !== null && I_POSE !== null) {
    lines.push(
      "⚠️ FACE SOURCE — READ BEFORE PROCESSING ANY IMAGE:",
      `IMAGE ${I_MODEL} = MODEL PHOTO → the ONLY permitted face in the output.`,
      `IMAGE ${I_POSE}  = POSE SKELETON → face in this image is BLOCKED. Never use it. Never blend it.`,
      `Rule: output face = IMAGE ${I_MODEL} | output body pose = IMAGE ${I_POSE} | output garment = IMAGE 1`,
      "",
    );
  }

  lines.push(
    "STRICT MODE.",
    "",
    "PRIORITY:",
    "1. GARMENT (highest) — IMAGE 1 is the source of truth. Do NOT change it.",
    I_MODEL !== null ? "2. MODEL IDENTITY — reproduce exact person from MODEL PHOTO." : "2. MODEL — generate consistent single model.",
    I_POSE  !== null ? "3. POSE — copy exact body structure from POSE IMAGE." : "",
    I_BG    !== null ? "4. BACKGROUND — use exact background from BACKGROUND IMAGE." : "",
    "",
    "--------------------------------",
    "",
    "Generate a photorealistic ecommerce fashion image.",
    "",
    "⚠️ CRITICAL: This is a CONTROLLED GENERATION task.",
    "You MUST strictly follow ALL provided image references.",
    "",
    "--------------------------------",
    "🔒 ASSET LOCK RULES (HIGHEST PRIORITY)",
    "--------------------------------",
    "",
    "IMAGE 1 = GARMENT REFERENCE (source of truth for garment design, color, print, texture, stitching, silhouette).",
    "PRIORITY: GARMENT is highest priority. Do NOT change it.",
    I_POSE  !== null ? `IMAGE ${I_POSE}  = POSE REFERENCE — body skeleton ONLY. Face in this image is BLOCKED.` : "",
    I_MODEL !== null ? `IMAGE ${I_MODEL} = MODEL PHOTO — the ONLY source of the output person's face, hair, skin, and identity.` : "",
    I_BG    !== null ? `IMAGE ${I_BG}    = BACKGROUND PHOTO — the exact scene/location to use.` : "",
  );

  // 1. MODEL LOCK
  lines.push("", "1. MODEL LOCK" + (I_MODEL !== null ? "" : " (no model photo provided — generate a suitable model)") + ":");
  if (I_MODEL !== null) {
    lines.push(
      `- The generated person MUST be the EXACT same individual as in IMAGE ${I_MODEL} (MODEL IMAGE).`,
      "- Preserve face identity exactly: facial structure, eyes, nose, lips, skin tone, hair, body type.",
      "- DO NOT generate a different person.",
      "- DO NOT beautify, modify, or average the face.",
      "- Any mismatch = WRONG OUTPUT.",
    );
    if (I_POSE !== null) {
      lines.push(
        `- ⚠ IMAGE ${I_POSE} (pose reference) contains a different person's face — IGNORE it completely.`,
        `- Output face = IMAGE ${I_MODEL} ONLY. No blending, no averaging.`,
      );
    }
  } else {
    const _gender = (opts.config.modelGender || "Female").trim();
    const _ageRange = opts.config.modelAgeRange?.trim();
    const _agePart = _ageRange ? `${_ageRange} years old` : "young adult (18–23)";
    const _ethnicity = opts.config.modelEthnicity?.trim();
    const _ethnicityPart = _ethnicity ? ` ${_ethnicity}` : "";
    const _styling = opts.config.modelStylingNotes?.trim();
    const _custom  = opts.config.modelCustomPrompt?.trim();
    lines.push(
      "── MODEL FROM CONFIG (STRICT) ──",
      `- Gender: ${_gender}`,
      `- Age range: ${_agePart}`,
      ...(  _ethnicityPart ? [`- Ethnicity:${_ethnicityPart}`] : []),
      ...(_custom  ? [`- Notes: ${_custom}`]  : []),
      `- Generate exactly ONE ${_gender.toLowerCase()} fashion model matching ALL of the above. Clearly adult — not a minor.`,
      _styling ? `- Styling: ${_styling}.` : "- Styling: natural glam — fresh, clean, commercial ecommerce appearance.",
      "- This SAME model MUST appear in ALL generated images (main + every angle).",
      "- Do NOT change: gender, face, body type between images.",
      "- Do NOT generate a different person in any other angle.",
      "✗ REJECT if model does not match config exactly or differs across images.",
    );
  }

  // 2. GARMENT LOCK
  lines.push(
    "",
    "2. GARMENT LOCK (ZERO TOLERANCE — garment MUST remain EXACTLY as in IMAGE 1):",
    "- The model MUST wear the EXACT garment from IMAGE 1. No exceptions.",
    "- COLOR: reproduce the exact color — DO NOT lighten, darken, or shift the hue in any way.",
    "- PRINT/GRAPHICS: reproduce all patterns, logos, text, and graphics exactly — pixel-accurate, no simplification.",
    "- SHAPE: match neckline, collar, sleeve length/style, and hem exactly.",
    "- TEXTURE: preserve fabric weave, seam placement, and material detail.",
    "- DO NOT redesign, recolor, or change any element of the garment.",
    "- DO NOT add extra clothing layers (no jacket, cardigan, shawl, cape, scarf).",
    "- DO NOT hallucinate details not visible in IMAGE 1.",
    I_POSE !== null ? `- DO NOT copy the garment from IMAGE ${I_POSE} (pose reference) — output garment = IMAGE 1 ONLY.` : "",
    "✗ REJECT if garment color, print, silhouette, or any design detail differs from IMAGE 1.",
  );

  // 3. POSE LOCK
  lines.push("", "3. POSE LOCK" + (I_POSE !== null ? "" : " (no pose reference — use config pose)") + ":");
  if (I_POSE !== null) {
    lines.push(
      `- Copy the EXACT pose from IMAGE ${I_POSE} (POSE REFERENCE).`,
      "- Match body posture, limb angles, stance, and orientation precisely.",
      "- DO NOT change the pose.",
      `- Copy skeleton/joint angles ONLY from IMAGE ${I_POSE}. Face, garment, shoes, accessories, background all come from their own references.`,
      `✓ COPY from IMAGE ${I_POSE}: shoulder/elbow/wrist/hip/knee/ankle angles, stance, weight distribution, foot placement, head tilt angle.`,
      `✗ BLOCK from IMAGE ${I_POSE}: face, hair, skin tone, top garment, bottom garment, shoes, accessories, background, lighting.`,
    );
  } else if (opts.config.modelPose?.trim()) {
    lines.push(`- Pose: ${opts.config.modelPose}.`);
  } else {
    lines.push("- Natural standing pose. Weight shift to one leg. Relaxed hands. Slight head tilt. Soft smile.");
  }

  // 4. BACKGROUND LOCK
  lines.push("", "4. BACKGROUND LOCK" + (I_BG !== null ? "" : " (no background photo — generate from config)") + ":");
  if (I_BG !== null) {
    lines.push(
      `- Use the EXACT background from IMAGE ${I_BG} (BACKGROUND IMAGE).`,
      "- DO NOT change location, objects, layout, or structure.",
      "- DO NOT replace the environment.",
      "- Only integrate the model naturally into this background.",
    );
  } else {
    const bg = opts.config.backgroundTheme || opts.config.occasion;
    lines.push(
      bg ? `- Background: photorealistic "${bg}" setting.` : "- Background: clean lifestyle or studio setting.",
      "- Atmosphere: warm, sunny, polished, approachable. Natural daylight.",
    );
  }

  // STYLING section
  const occasion   = opts.config.occasion?.trim()           || "(match the garment)";
  const accessories = opts.config.accessories?.trim()       || "minimal, matching the outfit";
  const footwear   = opts.config.footwear?.trim()           || "appropriate for the occasion";
  const bottomWear = opts.config.bottomWear?.trim()         || "matching bottom wear appropriate for the outfit";
  const stylingParts: string[] = [];
  if (!opts.hasModelReference && opts.config.modelStylingNotes?.trim()) stylingParts.push(opts.config.modelStylingNotes);
  if (opts.config.styleKeywords?.trim()) stylingParts.push(`style: ${opts.config.styleKeywords}`);
  if (opts.config.modelPose?.trim() && !opts.hasPoseReference) stylingParts.push(`pose: ${opts.config.modelPose}`);
  const stylingNotes = stylingParts.join("; ") || "(auto — match the garment and occasion)";

  lines.push(
    "",
    "--------------------------------",
    "🎯 STYLING (APPLY WITHOUT BREAKING LOCKS)",
    "--------------------------------",
    `- Occasion: ${occasion}`,
    `- Accessories: ${accessories}`,
    `- Footwear: ${footwear}`,
    `- Bottom wear: ${bottomWear}`,
    `- Styling notes: ${stylingNotes}`,
  );

  // IMAGE REQUIREMENTS
  lines.push(
    "",
    "--------------------------------",
    "📸 IMAGE REQUIREMENTS",
    "--------------------------------",
    "- Full body (head to toe fully visible)",
    "- No cropping at head or feet",
    "- 3:4 portrait (1080x1440)",
    "- Sharp, high-quality, realistic lighting",
    "- Commercial ecommerce style",
    "- Model fills ~80–85% of frame height",
    "- Natural daylight: warm, soft, even front-side illumination; medium contrast; no harsh shadows",
  );

  // STRICT NEGATIVE RULES
  lines.push(
    "",
    "--------------------------------",
    "🚫 STRICT NEGATIVE RULES",
    "--------------------------------",
    I_MODEL !== null
      ? `- No different model — output face MUST match IMAGE ${I_MODEL} exactly`
      : opts.config.modelAgeRange?.trim()
        ? `- Model must appear ${opts.config.modelAgeRange} years old — clearly adult, not a minor`
        : "- No child or underage appearance",
    I_POSE !== null
      ? `- No pose deviation — body MUST match IMAGE ${I_POSE} skeleton exactly`
      : "- No extreme or unnatural poses",
    I_BG !== null
      ? `- No background changes — scene MUST match IMAGE ${I_BG} exactly`
      : "- No inconsistent or placeholder background",
    "- No extra garments or layers",
    "- No blur, distortion, or extra limbs",
    "- No text, watermark, or logo",
    "- No extra people, no duplicates",
    "- No cropped head or feet",
    I_MODEL !== null && I_POSE !== null
      ? `- No face bleed: output face must NOT resemble IMAGE ${I_POSE} person`
      : "",
  );

  // FINAL GOAL
  lines.push(
    "",
    "--------------------------------",
    "✅ FINAL GOAL",
    "--------------------------------",
    "The output MUST be a perfect combination of:",
    "MODEL (identity) + GARMENT (design) + POSE (structure) + BACKGROUND (scene)",
    "",
    "If ANY of these do not match the provided images exactly, the output is incorrect.",
  );

  // Final identity/pose checks for extra reinforcement
  if (I_MODEL !== null) {
    lines.push(
      "",
      `FINAL IDENTITY CHECK: Face in output MUST match IMAGE ${I_MODEL} — same eyes, nose, lips, jawline, skin tone, hair. Different face → REJECT.`,
      I_POSE !== null
        ? `⚠ If face resembles IMAGE ${I_POSE} person instead of IMAGE ${I_MODEL} → REJECT.`
        : "",
    );
  }
  if (I_POSE !== null) {
    lines.push(
      `FINAL POSE CHECK: Body pose MUST replicate IMAGE ${I_POSE} skeleton. Output garment = IMAGE 1 ONLY. Output person = IMAGE ${I_MODEL ?? "model spec"} ONLY.`,
    );
  }

  lines.push(
    "",
    "--------------------------------",
    "FINAL CHECK:",
    "Garment must match IMAGE 1 exactly. Do NOT change color, print, or shape.",
    I_POSE  !== null ? `Pose must match IMAGE ${I_POSE} template exactly.` : "",
    I_MODEL !== null ? `Same person as IMAGE ${I_MODEL} must appear.` : "Same consistent model must appear.",
    "If not → output is incorrect.",
  );

  return lines.filter(Boolean).join("\n").trim();
}

/**
 * Concise composite prompt — no LookPlan or LLM required.
 * ~600 tokens vs ~1100 tokens for the full buildCompositePrompt().
 *
 * Image order expected by caller:
 *   IMAGE 1: garment reference
 *   IMAGE 2: model photo (if hasModelReference)
 *   IMAGE 3: pose reference (if hasPoseReference)
 *   IMAGE N: background photo (if hasBackgroundReference)
 */
export function buildDirectCompositePrompt(opts: {
  hasModelReference: boolean;
  hasPoseReference?: boolean;
  hasBackgroundReference: boolean;
  config: DirectCompositeConfig;
  isRetry?: boolean;
  retryComment?: string;
  /** Image model ID — selects model-optimised prompt variant. */
  model?: string;
}): string {
  // Flash models need a fully-structured, section-by-section prompt
  if (isFlashModel(opts.model || "")) return buildFlashDirectCompositePrompt(opts);

  // ── Gemini 3 Pro prompt (prose-style, concise, model fills in nuance) ────────
  const lines: string[] = [];

  if (opts.isRetry) {
    lines.push(
      "RETRY: re-generate for the SAME inputs. Apply the correction below only. All other hard rules still apply.",
      opts.retryComment?.trim() ? `Correction: ${opts.retryComment.trim()}` : "",
      "",
    );
  }

  let imgIdx = 2;

  // ── IDENTITY LOCK must come first so it outweighs every other instruction ──
  if (opts.hasModelReference) {
    lines.push(
      "═══ IDENTITY LOCK (ABSOLUTE PRIORITY — overrides ALL other instructions) ═══",
      `IMAGE ${imgIdx++} is the MODEL PHOTO. The person in the output MUST be the EXACT same individual.`,
      "• Reproduce age, face structure, jawline, eyes, nose, lips, skin tone, hair color, hair texture, and all physical features EXACTLY as photographed.",
      "• Do NOT apply any age restriction. Do NOT make the person younger, older, slimmer, or different-looking in any way.",
      "• Do NOT substitute a generic stock model or a different person. The output person must be IMMEDIATELY recognizable as the MODEL PHOTO subject by anyone who knows them.",
      "• Gender, age, and ethnicity are defined ENTIRELY by the MODEL PHOTO — ignore any other instruction that conflicts with this.",
      "═══════════════════════════════════════════════════════════════════════════",
      "",
    );
  }

  lines.push(
    "Photorealistic ecommerce fashion photo. Warm, sunny, polished lifestyle look.",
    "Camera: vertical 3:4 full-body, 35–50mm, eye-level, natural daylight with soft fill, medium contrast, crisp focus.",
    FULL_BODY_RULE,
    // Age rule is dropped when a real person's photo is provided — their actual age applies
    opts.hasModelReference ? "" : MODEL_AGE_RULE,
    "",
    "IMAGE 1: GARMENT REFERENCE (SOURCE OF TRUTH — non-negotiable).",
    "GARMENT LOCK: Output MUST show EXACTLY this garment. FORBIDDEN: redesign, recolor, pattern change, silhouette change, or substitution. Match color, print, seams, neckline, hem, sleeve length, and texture exactly. No extra fabric, no added layers."
      + (opts.hasPoseReference ? " The garment worn in the POSE REFERENCE image is IRRELEVANT — the output garment comes ONLY from IMAGE 1." : ""),
  );

  if (!opts.hasModelReference) {
    lines.push("No model reference: create a suitable single female fashion model.");
  }

  if (opts.hasPoseReference) {
    const poseIdx = imgIdx++;
    lines.push(
      `IMAGE ${poseIdx}: POSE REFERENCE — treat as a WIRE-FRAME SKELETON DIAGRAM. Extract joint positions only; block every other attribute.`,
      ``,
      `POSE LOCK — copy from IMAGE ${poseIdx}: joint angles (shoulder/elbow/wrist/hip/knee/ankle), overall stance, limb directions, weight distribution, foot placement, head direction angle.`,
      ``,
      `ISOLATION — completely ignore and DO NOT copy from IMAGE ${poseIdx}:`,
      `• Face, hair, skin tone → comes from MODEL PHOTO (IMAGE 2)`,
      `• Top garment (shirt/top/blouse/jacket) → comes from GARMENT REFERENCE (IMAGE 1)`,
      `• Bottom garment (pants/jeans/skirt/shorts/leggings) → comes from bottom wear spec only`,
      `• Shoes/footwear → comes from footwear spec only`,
      `• Accessories, jewelry, bag → comes from accessories spec only`,
      `• Background, environment, location, floor, wall → comes from BACKGROUND spec only`,
      `• Lighting direction or color from pose scene → DO NOT replicate`,
      opts.hasModelReference
        ? `• ⚠ The person in IMAGE ${poseIdx} is a different individual — their identity/face MUST NOT appear in the output. Output person = IMAGE 2 (MODEL PHOTO) only.`
        : `• DO NOT copy the pose person's clothing or appearance into the output.`,
    );
    if (opts.hasModelReference) {
      lines.push(
        ``,
        `POSE REFERENCE FACE ISOLATION (critical): IMAGE ${poseIdx} contains a human face — that face belongs to the pose model and must NOT appear in the output.`,
        `• The output face must be EXCLUSIVELY the person from IMAGE 2 (MODEL PHOTO). No blending or averaging.`,
        `• Treat IMAGE ${poseIdx} as a skeleton diagram only — copy joint angles, block the face entirely.`,
      );
    }
  }

  if (opts.hasBackgroundReference) {
    lines.push(
      `IMAGE ${imgIdx++}: BACKGROUND REFERENCE — SCENE LOCK (non-negotiable).`,
      `• Reproduce this EXACT background/environment. Match the floor, walls, surfaces, lighting direction, depth of field, and atmosphere exactly.`,
      `• DO NOT substitute, change, simplify, or invent a different background. The scene in the output must be immediately recognizable as the BACKGROUND REFERENCE.`,
    );
  } else {
    const bg = opts.config.backgroundTheme || opts.config.occasion;
    if (bg) lines.push(`Background: photorealistic setting matching "${bg}".`);
  }

  const details: string[] = [];
  if (opts.config.occasion?.trim())      details.push(`Occasion: ${opts.config.occasion}`);
  // Bottom wear as a dedicated directive — model MUST wear this as the lower garment
  if (opts.config.bottomWear?.trim())    details.push(`BOTTOM GARMENT (required): ${opts.config.bottomWear} — the model MUST wear these as the lower garment. Do not substitute or omit.`);
  if (opts.config.footwear?.trim())      details.push(`Footwear: ${opts.config.footwear}`);
  if (opts.config.accessories?.trim())   details.push(`Accessories: ${opts.config.accessories}`);
  if (opts.config.styleKeywords?.trim()) details.push(`Style: ${opts.config.styleKeywords}`);
  if (opts.config.modelPose?.trim() && !opts.hasPoseReference) details.push(`Pose: ${opts.config.modelPose}`);
  // When model photo is uploaded, styling notes are suppressed — the person's own appearance takes full priority
  if (!opts.hasModelReference && opts.config.modelStylingNotes?.trim()) details.push(`Styling: ${opts.config.modelStylingNotes}`);
  if (details.length) lines.push("", details.join("\n") + "\n");

  const poseAvoidSuffix = opts.hasPoseReference
    ? ", copying clothing from pose reference, outfit from pose image, garment from pose image"
    : "";
  lines.push(
    "",
    GARMENT_FIDELITY_RULE,
    "One person only. Correct anatomy. No extra limbs. No extra people. No text overlay. No watermarks.",
    opts.hasModelReference
      ? `Avoid: ${GLOBAL_AVOID_WITH_MODEL_REF}${poseAvoidSuffix}`
      : `Avoid: ${GLOBAL_AVOID}${poseAvoidSuffix}`,
  );

  if (opts.hasModelReference) {
    lines.push(
      "FINAL IDENTITY CHECK: The face in the output MUST match IMAGE 2 (MODEL PHOTO) exactly — same person, same age, same features. If the output shows a different person, it is REJECTED.",
    );
    if (opts.hasPoseReference) {
      lines.push(
        "⚠ If the face resembles the person in the POSE REFERENCE instead of IMAGE 2 (MODEL PHOTO) → REJECTED. The pose reference person's face must never appear in the output.",
      );
    }
  }
  if (opts.hasPoseReference) {
    lines.push(
      "FINAL POSE + GARMENT CHECK: Body pose MUST match the POSE REFERENCE (body skeleton only).",
      "The clothing/outfit visible in the POSE REFERENCE must NOT appear in the output — only the body position is copied from it.",
      "Output garment = IMAGE 1 only. Output identity = IMAGE 2 (MODEL PHOTO) only.",
    );
  }

  return lines.filter(Boolean).join("\n").trim();
}

/**
 * DEPRECATED shim — delegates to buildOptimizedMultiAnglePrompt().
 */
export function buildDirectMultiAnglePrompt(opts: {
  angle: "side" | "back" | "detail";
  hasModelReference: boolean;
  hasBackgroundReference: boolean;
  hasPoseReference?: boolean;
  config: DirectCompositeConfig;
  garmentType?: string;
  hasBackGarmentPhoto?: boolean;
  model?: string;
}): string {
  return buildOptimizedMultiAnglePrompt(opts);
}

// ────────────────────────────────────────────────────────────────────────────
// Flash-specific multi-angle prompt builder
// Provides explicitly-structured prompts for back-view and detail-shot.
// ────────────────────────────────────────────────────────────────────────────
function buildFlashMultiAnglePrompt(opts: {
  angle: "side" | "back" | "detail";
  hasModelReference: boolean;
  hasBackgroundReference: boolean;
  hasPoseReference?: boolean;
  config: DirectCompositeConfig;
  garmentType?: string;
  hasBackGarmentPhoto?: boolean;
}): string {
  const isDetail = opts.angle === "detail";
  const isBack   = opts.angle === "back";
  const isBackWithPhoto = isBack && Boolean(opts.hasBackGarmentPhoto);

  // FLASH MULTI-ANGLE IMAGE ORDER (identity-optimised):
  //   IMAGE 1: garment reference (highest priority — locked)
  //   IMAGE 2: main result       (identity + scene anchor)
  //   IMAGE 3: pose reference    (if any — body geometry only)
  //   IMAGE 4: background        (if any — scene lock)
  //   IMAGE 5: model photo       (if any — LAST for recency = identity dominance)
  let _idx = 1;
  const I_GARMENT = _idx++;
  const I_MAIN    = _idx++;
  const I_POSE    = opts.hasPoseReference        ? _idx++ : null;
  const I_BG      = opts.hasBackgroundReference  ? _idx++ : null;
  const I_MODEL   = opts.hasModelReference       ? _idx++ : null;

  const lines: string[] = [
    "STRICT MODE.",
    "",
    "PRIORITY:",
    "1. GARMENT (highest) — IMAGE 1 is the source of truth. Do NOT change it.",
    "2. MODEL IDENTITY — same person as IMAGE 2 (MAIN RESULT). Do NOT generate a different person.",
    "3. POSE — copy exact body structure from POSE IMAGE. Do NOT approximate.",
    "4. BACKGROUND — same scene as IMAGE 2.",
    "",
    "--------------------------------",
    "",
    `GARMENT (IMAGE ${I_GARMENT}):`,
    "Keep EXACT same design as IMAGE 1.",
    "Do NOT change color, print, or shape.",
    "Do NOT redesign. Do NOT hallucinate details.",
    "",
    `IDENTITY LOCK (IMAGE ${I_MAIN} — MAIN RESULT):`,
    `The same person as in IMAGE ${I_MAIN} MUST appear in this image.`,
    "Face, body, hair must remain identical to the MAIN RESULT.",
    "Do NOT generate a different person.",
    I_MODEL !== null
      ? `IMAGE ${I_MODEL} (MODEL PHOTO) is an additional identity reference — same person.`
      : "",
    "",
  ];

  if (isDetail) {
    // ── Detail shot ────────────────────────────────────────────────────────────
    const gType = (opts.garmentType || "").toLowerCase();

    let focusRule: string;
    if (["t-shirt", "shirt", "hoodie", "sweater", "blazer"].some((g) => gType.includes(g))) {
      focusRule = "upper body only, crop from chin to hip, exclude legs, face partially visible or cropped above lips";
    } else if (["pant", "jeans", "shorts"].some((g) => gType.includes(g))) {
      focusRule = "lower body only, crop from hip to feet, full legs visible, exclude upper body";
    } else if (gType.includes("saree")) {
      focusRule = "focus on saree drape from shoulder to feet, emphasize fabric folds and texture";
    } else {
      focusRule = "upper body only, crop from chin to hip, garment clearly centered";
    }

    const angleHint = Math.random() > 0.5 ? "slight right angle" : "slight left angle";

    lines.push(
      "Ultra-realistic fashion product detail shot.",
      "",
      `Subject: model wearing ${opts.garmentType || "garment"}.`,
      "",
      `Framing: tight zoomed shot, ${angleHint}, garment occupies 80–90% of frame.`,
      "",
      `Focus: strictly on ${focusRule}, ensure garment is fully visible and centered.`,
      "",
      "Pose: natural minimal pose, slight turn for depth.",
      "",
      "Background: soft neutral studio background, blurred, non-distracting.",
      "",
      "Lighting: soft studio lighting, highlights on fabric texture.",
      "",
      "Camera: 85mm lens, shallow depth of field.",
      "",
      "Constraints: no wide shot, no unnecessary background, no distortion, no blur, no extra objects.",
      "",
      "ultra-detailed, sharp focus, realistic texture.",
      "",
      "━━━ REFERENCES ━━━",
      `IMAGE ${I_GARMENT}: GARMENT REFERENCE — match color, print, design exactly.`,
      `IMAGE ${I_MAIN}: MAIN RESULT — match garment design and lighting tone.`,
      I_MODEL !== null ? `IMAGE ${I_MODEL}: MODEL PHOTO — identity reference.` : "",
      I_BG    !== null ? `IMAGE ${I_BG}: BACKGROUND PHOTO — atmosphere reference.` : "",
      "",
      "━━━ GARMENT ACCURACY ━━━",
      `• Color: MUST match IMAGE ${I_GARMENT} exactly. Do NOT alter.`,
      `• Print/graphics: MUST match IMAGE ${I_GARMENT} exactly. No simplification.`,
      `• Design: must also be consistent with IMAGE ${I_MAIN}.`,
    );

  } else if (isBack) {
    // ── Back view ──────────────────────────────────────────────────────────────
    lines.push(
      "TASK: Generate a photorealistic ecommerce fashion photo — BACK VIEW.",
      "FORMAT: 3:4 portrait · 1080×1440 px · FULL BODY head-to-toe.",
      "",
      "━━━ INPUT IMAGES ━━━",
      isBackWithPhoto
        ? `IMAGE ${I_GARMENT}: BACK GARMENT PHOTO — the ACTUAL BACK of the garment. This is the sole source for all back design details.`
        : `IMAGE ${I_GARMENT}: GARMENT REFERENCE — use to infer the garment back construction and fabric.`,
      `IMAGE ${I_MAIN}: MAIN RESULT — match same model identity, hair, makeup, accessories, lighting, and scene.`,
      I_MODEL !== null ? `IMAGE ${I_MODEL}: MODEL PHOTO — face/identity reference.` : "",
      I_BG    !== null ? `IMAGE ${I_BG}: BACKGROUND PHOTO — scene reference.` : "",
      I_POSE  !== null ? `IMAGE ${I_POSE}: BACK POSE REFERENCE — skeleton/joint positions ONLY. ⚠ Face, pants, shoes, background visible here are ALL BLOCKED.` : "",
      "",
      "━━━ VIEW SPECIFICATION ━━━",
      "• Model faces AWAY from camera. Camera sees the model's BACK.",
      "• Head turn: slight, 15–20° maximum (small profile glimpse only). Front face is NOT visible.",
      "• Arms relaxed slightly away from body — back garment panel is fully exposed.",
      "• Hair swept aside or pulled forward so back neckline of the garment is visible.",
      "",
    );

    if (isBackWithPhoto) {
      lines.push(
        "━━━ GARMENT BACK DESIGN ━━━",
        `All back garment details MUST come from IMAGE ${I_GARMENT} ONLY.`,
        `• Reproduce exactly from IMAGE ${I_GARMENT}: back neckline, back seams, rear hem, any back print or logo.`,
        "• Do NOT show the front garment design on the back output.",
        "• Do NOT mirror the front design. Do NOT invent back details.",
        `• If IMAGE ${I_GARMENT} shows no back print, the back output must have no print.`,
      );
    } else {
      lines.push(
        "━━━ GARMENT BACK DESIGN ━━━",
        `Infer the back design from IMAGE ${I_GARMENT} (garment construction, fabric, and style).`,
        "• Show: back seams, rear neckline shape, back hem, fabric texture — consistent with the garment front.",
        "• Do NOT copy or mirror the front print or logo to the back.",
        "• Keep construction details consistent with the garment type and silhouette.",
      );
    }

    if (I_POSE !== null) {
      lines.push(
        "",
        `━━━ POSE — WIRE-FRAME SKELETON FROM IMAGE ${I_POSE} ━━━`,
        `Adopt the back-facing body position from IMAGE ${I_POSE} — joint angles and stance ONLY.`,
        `✓ COPY: shoulder angle, arm position, hip angle, knee angle, foot placement, head direction`,
        `✗ BLOCK — do NOT copy from IMAGE ${I_POSE}:`,
        `  • Face or hair → from MODEL PHOTO`,
        `  • Top garment → from IMAGE ${I_GARMENT} (garment reference)`,
        `  • Pants / bottom garment → from bottom wear spec only`,
        `  • Shoes / footwear → from footwear spec only`,
        `  • Accessories → from accessories spec only`,
        `  • Background, floor, walls → from BACKGROUND spec only`,
      );
    }

    lines.push(
      "",
      "━━━ CONSISTENCY — MUST MATCH IMAGE 2 (MAIN RESULT) ━━━",
      "• Same model identity (seen from behind/side profile — match hair, makeup, body proportions)",
      "• Same accessories worn",
      `• Same footwear${opts.config.footwear ? ` (${opts.config.footwear})` : ""} — must be visible at bottom of frame`,
      opts.config.bottomWear ? `• Same bottom wear: ${opts.config.bottomWear}` : "",
      "• Same background/scene",
      "• Same lighting quality and direction",
      "",
      "━━━ FRAMING ━━━",
      "• FULL BODY: model head (from back/profile) to shoes — all visible, no cropping.",
      "• Same framing proportions as the MAIN RESULT (IMAGE 2).",
      "• 3:4 portrait, full head-to-toe.",
      "",
      "━━━ REJECT IF ANY CONDITION IS TRUE ━━━",
      "✗ Model facing toward the camera (must face AWAY)",
      "✗ Front face clearly visible (slight profile is OK)",
      isBackWithPhoto ? `✗ Front garment design appears on the back (back design MUST come from IMAGE ${I_GARMENT})` : "✗ Front design mirrored to the back",
      "✗ Head or feet cropped from frame",
      `✗ Different background than IMAGE ${I_MAIN}`,
    );

  } else {
    // ── Side view ──────────────────────────────────────────────────────────────
    lines.push(
      "TASK: Generate a photorealistic ecommerce fashion photo — SIDE VIEW.",
      "FORMAT: 3:4 portrait · 1080×1440 px · FULL BODY head-to-toe.",
      "",
      "━━━ INPUT IMAGES ━━━",
      `IMAGE ${I_GARMENT}: GARMENT REFERENCE — match garment design exactly.`,
      `IMAGE ${I_MAIN}: MAIN RESULT — match same model, hair, makeup, accessories, scene.`,
      I_MODEL !== null ? `IMAGE ${I_MODEL}: MODEL PHOTO — identity reference.` : "",
      I_BG    !== null ? `IMAGE ${I_BG}: BACKGROUND PHOTO — scene reference.` : "",
      "",
      "━━━ VIEW SPECIFICATION ━━━",
      "• True SIDE VIEW: model rotated approximately 70°. Camera sees the model's profile.",
      "• This is NOT a 3/4 front turn — model must NOT face toward the camera.",
      "• Head and feet both fully in frame. Side seam of garment clearly visible.",
      "• Pose: S-curve weight shift, one foot slightly forward, arms relaxed along sides.",
      "• Arms must not block the side seam.",
      "",
      "━━━ FRAMING ━━━",
      "• Full body head-to-toe. No cropping.",
      `• Footwear visible at bottom${opts.config.footwear ? ` (${opts.config.footwear})` : ""}.`,
      "",
      "━━━ REJECT IF ━━━",
      "✗ Model facing front or at 3/4 angle (must be side profile)",
      "✗ Head or feet cropped",
      "✗ Garment design differs from IMAGE 1",
    );
  }

  lines.push(
    "",
    "--------------------------------",
    "",
    "FINAL CHECK:",
    `Garment must match IMAGE ${I_GARMENT} exactly.`,
    `Same person as IMAGE ${I_MAIN} must appear — IDENTICAL face, body type, and gender.`,
    I_MODEL !== null
      ? `Model photo (IMAGE ${I_MODEL}) is the identity anchor — face/body must match it exactly.`
      : (() => {
          const _g  = (opts.config.modelGender || "Female").trim();
          const _ar = opts.config.modelAgeRange?.trim();
          const _et = opts.config.modelEthnicity?.trim();
          const parts = [_g, _ar ? `${_ar} years old` : "young adult (18–23)", _et].filter(Boolean);
          return `Model must match config exactly (${parts.join(", ")}) and remain SAME across all outputs.`;
        })(),
    I_POSE !== null ? `Pose must match IMAGE ${I_POSE} skeleton exactly.` : "",
    "Do NOT change: gender, face, or body type between images.",
    "If not → output is incorrect.",
  );

  return lines.filter(Boolean).join("\n").trim();
}

/**
 * View-isolated multi-angle prompt builder.
 *
 * KEY FIX: strict view isolation prevents front design bleed into back output.
 *
 * When hasBackGarmentPhoto = true (back view only):
 *   IMAGE 1 = BACK GARMENT PHOTO (caller must pass back photo as first image)
 *   Prompt blocks all front design references — back design comes from IMAGE 1 only.
 *
 * When hasBackGarmentPhoto = false (back view, no back photo):
 *   IMAGE 1 = FRONT garment reference → model infers back from silhouette/fabric.
 *
 * Image order for SIDE / DETAIL (unchanged):
 *   IMAGE 1: front garment reference
 *   IMAGE 2: main result
 *   IMAGE 3: model photo        (if hasModelReference)
 *   IMAGE 4: background photo   (if hasBackgroundReference)
 *   IMAGE N: pose reference     (if hasPoseReference)
 *
 * Image order for BACK (hasBackGarmentPhoto = true):
 *   IMAGE 1: back garment photo   ← replaces front garment ref
 *   IMAGE 2: main result
 *   IMAGE 3: model photo          (if hasModelReference)
 *   IMAGE 4: background photo     (if hasBackgroundReference)
 *   IMAGE N: pose reference       (if hasPoseReference)
 */
export function buildOptimizedMultiAnglePrompt(opts: {
  angle: "side" | "back" | "detail";
  hasModelReference: boolean;
  hasBackgroundReference: boolean;
  hasPoseReference?: boolean;
  config: DirectCompositeConfig;
  garmentType?: string;
  /** When true, IMAGE 1 is the actual BACK GARMENT PHOTO — not the front garment ref. */
  hasBackGarmentPhoto?: boolean;
  /** Image model ID — selects model-optimised prompt variant. */
  model?: string;
}): string {
  // Flash models get the explicitly structured variant
  if (isFlashModel(opts.model || "")) return buildFlashMultiAnglePrompt(opts);

  // ── Gemini 3 Pro prompt ────────────────────────────────────────────────────
  const isDetail = opts.angle === "detail";
  const isBackWithPhoto = opts.angle === "back" && Boolean(opts.hasBackGarmentPhoto);

  // Sequential image index assignment
  let _idx = 1;
  const I_GARMENT = _idx++;   // always 1 — front garment ref OR back photo depending on view
  const I_MAIN    = _idx++;   // always 2
  const I_MODEL   = opts.hasModelReference      ? _idx++ : null;
  const I_BG      = opts.hasBackgroundReference  ? _idx++ : null;
  const I_POSE    = opts.hasPoseReference        ? _idx++ : null;

  // ── Header ────────────────────────────────────────────────────────────────

  let header: string[];

  if (isDetail) {
    header = [
      "Photorealistic ecommerce GARMENT DETAIL SHOT. The garment is the only subject.",
      `IMAGE ${I_GARMENT}: FRONT GARMENT REFERENCE — color, print, logo, design (source of truth).`,
      `IMAGE ${I_MAIN}: MAIN RESULT — match same garment, lighting tone, and background.`,
      I_MODEL ? `IMAGE ${I_MODEL}: MODEL PHOTO — identity reference if body is partially visible.` : "",
      I_BG    ? `IMAGE ${I_BG}: BACKGROUND PHOTO — background tone only.` : "",
    ];
  } else if (isBackWithPhoto) {
    // Back view with dedicated back photo — completely isolated from front design
    header = [
      "Photorealistic ecommerce fashion photo — BACK VIEW.",
      `${FULL_BODY_RULE}`,
      `${MODEL_AGE_RULE}`,
      "",
      // ── Critical view isolation ──────────────────────────────────────────
      `IMAGE ${I_GARMENT}: BACK GARMENT PHOTO — this is the ACTUAL BACK of the garment.`,
      `• This is the SOLE source of truth for back design: back neckline, back seams, back print/logo, rear hem, back panel.`,
      `• Reproduce IMAGE ${I_GARMENT} exactly on the back of the output garment.`,
      `• DO NOT use the front garment design for any part of the back output.`,
      "",
      `IMAGE ${I_MAIN}: MAIN RESULT — use ONLY for: model identity, hair, makeup, accessories, lighting, and scene.`,
      `• CRITICAL: The MAIN RESULT shows the garment FRONT. Do NOT copy its front design to this back output.`,
      `• Ignore the garment design visible in IMAGE ${I_MAIN} — use IMAGE ${I_GARMENT} for all garment design.`,
      I_MODEL ? `IMAGE ${I_MODEL}: MODEL PHOTO — identity/face reference only.` : "",
      I_BG    ? `IMAGE ${I_BG}: BACKGROUND PHOTO — match background scene.` : "",
    ];
  } else {
    // Side view, or back view without back photo (infer from front)
    header = [
      "Photorealistic ecommerce fashion photo — additional angle of the SAME look.",
      `${FULL_BODY_RULE}`,
      `${MODEL_AGE_RULE}`,
      `IMAGE ${I_GARMENT}: GARMENT REFERENCE — match garment design exactly (color, print, seams, silhouette).`,
      `IMAGE ${I_MAIN}: MAIN RESULT — match same model identity, hair, makeup, accessories, lighting, and scene.`,
      I_MODEL ? `IMAGE ${I_MODEL}: MODEL PHOTO — identity/face reference.` : "",
      I_BG    ? `IMAGE ${I_BG}: BACKGROUND PHOTO — match background scene.` : "",
    ];
  }

  // ── View-specific block ───────────────────────────────────────────────────

  let viewBlock: string[];

  if (opts.angle === "side") {
    viewBlock = [
      "",
      "VIEW: SIDE VIEW (strictly 70° rotation — true side angle, not 3/4 front).",
      "• Model's body faces sideways: camera sees profile, shoulder line, and side seam.",
      "• This is NOT a 3/4 front turn — model must NOT face toward camera.",
      "• Head and feet both fully in frame; garment side silhouette clearly visible.",
      "• Pose: S-curve weight shift, one foot slightly forward, arms relaxed along sides.",
      "• Arms must not block the garment side seam.",
      "• Side design: show side seams and side silhouette from the GARMENT REFERENCE.",
      I_POSE ? `IMAGE ${I_POSE}: SIDE POSE REFERENCE — skeleton/joint angles ONLY. Block: face, hair, top garment, pants/bottom garment, shoes, accessories, background.` : "",
      "",
      "Avoid: front-facing pose, 3/4 turn toward camera, arms blocking side seam, copying full front design onto side.",
    ];
  } else if (opts.angle === "back") {
    if (isBackWithPhoto) {
      viewBlock = [
        "",
        "VIEW: BACK VIEW — model fully facing away from camera.",
        "• Camera sees ONLY the back of the model and the back of the garment.",
        "• Slight head turn 15–20° maximum (partial profile only); front face NOT visible.",
        "• Arms relaxed slightly away from body — back garment panel fully exposed.",
        "• Hair moved aside or tucked to reveal back neckline and back fabric.",
        "",
        "GARMENT BACK DESIGN (non-negotiable):",
        `• Reproduce the back design from IMAGE ${I_GARMENT} exactly: back neckline, back seams, rear hem, any back print or logo.`,
        "• Zero bleed from front design. Do not mirror the front. Do not fabricate back details.",
        "• If IMAGE 1 shows no back print, the back output must have no print.",
        I_POSE ? `IMAGE ${I_POSE}: BACK POSE REFERENCE — skeleton/joint angles ONLY. Block: face, hair, top garment, pants/bottom garment, shoes, accessories, background.` : "",
        "",
        "Avoid: front design on back output, mirrored front print, front neckline style on back, model facing forward.",
      ];
    } else {
      // No back photo — infer from front garment ref
      viewBlock = [
        "",
        "VIEW: BACK VIEW (no back garment photo — infer back from garment structure and fabric).",
        "• Model fully facing away from camera.",
        "• Infer back design from garment silhouette, fabric, and construction visible in GARMENT REFERENCE.",
        "• Show: back seams, rear neckline, back hem, fabric texture — consistent with the garment style.",
        "• Do NOT copy the front print or logo onto the back unless it is a back-print garment.",
        "• Slight head turn 15–20° (partial profile); front face NOT visible.",
        "• Arms relaxed slightly away from body to reveal back panel.",
        I_POSE ? `IMAGE ${I_POSE}: BACK POSE REFERENCE — skeleton/joint angles ONLY. Block: face, hair, top garment, pants/bottom garment, shoes, accessories, background.` : "",
        "",
        "Avoid: model facing forward, front design mirrored on back, hair covering back garment.",
      ];
    }
  } else {
    // ── Detail shot ────────────────────────────────────────────────────────
    const gType = (opts.garmentType || "").toLowerCase();

    let cropZone: string;
    let focusItems: string;
    if (["t-shirt", "shirt", "hoodie", "sweater"].some((g) => gType.includes(g))) {
      cropZone   = "chest to hem (shoulders → bottom hem)";
      focusItems = "chest print, neckline, sleeve cuff, fabric weave";
    } else if (["jacket", "blazer"].some((g) => gType.includes(g))) {
      cropZone   = "chest to below waist (lapels → hem)";
      focusItems = "lapels, buttons, pocket detail, lining edge, fabric structure";
    } else if (["pant", "jeans", "shorts"].some((g) => gType.includes(g))) {
      cropZone   = "waist to mid-thigh";
      focusItems = "waistband, fly, pocket stitching, inseam, leg fabric";
    } else if (gType.includes("saree")) {
      cropZone   = "pallu drape and waist pleats";
      focusItems = "border pattern, pallu embellishment, pleat folds, fabric sheen";
    } else {
      cropZone   = "garment-rich zone (torso for tops, waist-thigh for bottoms)";
      focusItems = "fabric texture, print, stitching, seam detail";
    }

    viewBlock = [
      "",
      "VIEW: MACRO CLOSE-UP GARMENT DETAIL SHOT — product photography, NOT a portrait or full-body.",
      "",
      "FRAMING (non-negotiable, 3:4 portrait):",
      `• Crop zone: ${cropZone}.`,
      "• Garment surface fills 85–95% of frame. Extreme close-up — macro product lens equivalent.",
      "• HEAD, FACE, and full body are FORBIDDEN in this shot.",
      "• No wide shot. No 3/4 body. No portrait.",
      "",
      "FOCUS & CAMERA (macro product photography):",
      `• Tack-sharp focus on ${focusItems} — every thread, stitch, and texture must be crisp.`,
      "• 90mm macro equivalent, f/8–f/11 for maximum fabric sharpness.",
      "• Background: pure studio neutral or softly out-of-focus continuation of MAIN RESULT scene.",
      "",
      "LIGHTING: even diffused studio light; no harsh shadows obscuring fabric detail; match MAIN RESULT tone.",
      "",
      "GARMENT ACCURACY (critical):",
      "• Color, print, logo, and texture MUST match GARMENT REFERENCE exactly — pixel-accurate fidelity.",
      "• No redesign, reinterpretation, or simplification of the garment surface.",
      "• Every graphic, text, and pattern element must appear at full resolution detail.",
      "",
      "OUTPUT: commercial-grade macro product shot — ultra-sharp fabric detail, no face, no full body.",
    ];
  }

  // ── Styling context (side/back only) ─────────────────────────────────────
  const stylingParts: string[] = [];
  if (!isDetail) {
    if (opts.config.bottomWear?.trim())    stylingParts.push(`Bottom wear: ${opts.config.bottomWear}`);
    if (opts.config.footwear?.trim())      stylingParts.push(`Footwear: ${opts.config.footwear}`);
    if (opts.config.accessories?.trim())   stylingParts.push(`Accessories: ${opts.config.accessories}`);
    if (opts.config.styleKeywords?.trim()) stylingParts.push(`Style: ${opts.config.styleKeywords}`);
  }

  // ── Output check ──────────────────────────────────────────────────────────
  const outputCheck: string[] = isDetail ? [
    "",
    "OUTPUT CHECK: macro garment detail — 85–95% garment fill, tack-sharp fabric surface, no face, no full body.",
  ] : isBackWithPhoto ? [
    "",
    "OUTPUT CHECK: model fully facing away. Back garment design matches IMAGE 1 exactly. No front design on back.",
  ] : [
    "",
    `OUTPUT CHECK: ${opts.angle === "side" ? "model rotated 70° sideways (true side angle)" : "model fully facing away, garment back visible"}.`,
    "Full body head-to-toe in frame. Garment matches GARMENT REFERENCE. One person only.",
  ];

  return [
    ...header,
    ...viewBlock,
    ...(stylingParts.length ? ["", stylingParts.join(" | ")] : []),
    ...outputCheck,
  ].filter(Boolean).join("\n").trim();
}

// ── Orchestrator functions ────────────────────────────────────────────────────

export type PrimaryGenerationOpts = {
  imageModel: string;
  garmentImages: GeminiInlineImage[];
  modelImage: GeminiInlineImage | null;
  /** Only first pose image is used. */
  poseImages: GeminiInlineImage[];
  backgroundImage: GeminiInlineImage | null;
  config: DirectCompositeConfig;
  onStep?: (step: "garment_ref" | "composite") => void;
};

export type PrimaryGenerationResult = {
  compositeDataUrl: string;
  compositeMimeType: string;
  garmentRefDataUrl: string;
  garmentRefMimeType: string;
  /** true when garment reference was served from cache (saved one image API call) */
  garmentRefCacheHit: boolean;
  timings: { garmentRefMs: number; compositeMs: number; totalMs: number };
};

/**
 * Cost-optimized primary image generation.
 *
 * Eliminates planLookFromGarment() and generateFinalPrompt() (2 text LLM calls).
 * Caches garment reference by SHA-256 hash so repeated runs with the same garment
 * skip the most expensive step.
 *
 * Image inputs to composite are limited to: garmentRef + model + pose + background
 * (original garment photos excluded — saves 1–4 image token blocks per call).
 */
export async function generatePrimaryImage(
  opts: PrimaryGenerationOpts,
): Promise<PrimaryGenerationResult> {
  const t0 = performance.now();
  let garmentRefDataUrl: string;
  let garmentRefMimeType: string;
  let garmentRefMs = 0;
  let cacheHit = false;

  // Step 1: garment reference — serve from cache or generate once
  const hash = await hashImages(opts.garmentImages);
  const cached = await getCachedGarmentRef(hash);

  if (cached) {
    garmentRefDataUrl = cached.dataUrl;
    garmentRefMimeType = cached.mimeType;
    cacheHit = true;
  } else {
    opts.onStep?.("garment_ref");
    const t1 = performance.now();
    const refResult = await generateImage({
      model: opts.imageModel,
      promptText: buildGarmentReferencePrompt(opts.garmentImages.length > 1, opts.imageModel),
      images: opts.garmentImages,
      aspectRatio: "3:4",
      width: 1080,
      height: 1440,
      timeoutMs: 180_000,
    });
    garmentRefMs = Math.round(performance.now() - t1);
    if (!refResult.imageBase64) throw new GeminiError("Garment reference returned no image.");
    garmentRefDataUrl = `data:${refResult.mimeType};base64,${refResult.imageBase64}`;
    garmentRefMimeType = refResult.mimeType;
    // Store in cache — fire-and-forget, failure is non-fatal
    storeCachedGarmentRef(hash, garmentRefDataUrl, garmentRefMimeType).catch(() => {});
  }

  // Step 2: composite — build prompt from config (no LLM call)
  opts.onStep?.("composite");
  const hasPoseReference = opts.poseImages.length > 0;
  const hasModelReference = Boolean(opts.modelImage);
  const hasBackgroundReference = Boolean(opts.backgroundImage);

  const compositePrompt = buildDirectCompositePrompt({
    hasModelReference,
    hasPoseReference,
    hasBackgroundReference,
    config: opts.config,
    model: opts.imageModel,
  });

  // Image order must match the IMAGE N labels in buildDirectCompositePrompt / buildFlashDirectCompositePrompt.
  // Flash image order: garment → pose → model → background
  //   Pose comes BEFORE model so the MODEL PHOTO is the last human face seen (recency = identity dominance).
  // Pro image order: garment → model → pose → background (unchanged)
  const compositeImages: GeminiInlineImage[] = isFlashModel(opts.imageModel)
    ? [
        dataUrlToInlineImage(garmentRefDataUrl),
        ...(hasPoseReference ? [opts.poseImages[0]!] : []),
        ...(opts.modelImage ? [opts.modelImage] : []),
        ...(opts.backgroundImage ? [opts.backgroundImage] : []),
      ]
    : [
        dataUrlToInlineImage(garmentRefDataUrl),
        ...(opts.modelImage ? [opts.modelImage] : []),
        ...(hasPoseReference ? [opts.poseImages[0]!] : []),
        ...(opts.backgroundImage ? [opts.backgroundImage] : []),
      ];

  const t2 = performance.now();
  const composite = await generateImage({
    model: opts.imageModel,
    promptText: compositePrompt,
    images: compositeImages,
    aspectRatio: "3:4",
    width: 1080,
    height: 1440,
    timeoutMs: 180_000,
    // Flash: low temperature reduces creative drift in garment/identity
    temperature: isFlashModel(opts.imageModel) ? 0.1 : undefined,
  });
  const compositeMs = Math.round(performance.now() - t2);

  if (!composite.imageBase64) throw new GeminiError("Composite generation returned no image.");

  return {
    compositeDataUrl: `data:${composite.mimeType};base64,${composite.imageBase64}`,
    compositeMimeType: composite.mimeType,
    garmentRefDataUrl,
    garmentRefMimeType,
    garmentRefCacheHit: cacheHit,
    timings: { garmentRefMs, compositeMs, totalMs: Math.round(performance.now() - t0) },
  };
}

export type MultiAngleGenerationOpts = {
  imageModel: string;
  /** Front garment reference (clean cutout) — used for side, detail, and back-without-photo. */
  garmentRefImage: GeminiInlineImage;
  /**
   * Original back garment photo (if user uploaded one).
   * When provided, the back view uses this as IMAGE 1 instead of the front garment ref,
   * enforcing strict back-design isolation.
   */
  garmentBackRawImage: GeminiInlineImage | null;
  mainResultImage: GeminiInlineImage;
  modelImage: GeminiInlineImage | null;
  backgroundImage: GeminiInlineImage | null;
  config: DirectCompositeConfig;
  garmentType?: string;
  /** Base URL for fetching /angle-poses/{folder}/{n}.jpg templates. */
  baseUrl?: string;
};

export type MultiAngleGenerationResult = {
  back: { dataUrl: string; mimeType: string; ms: number } | null;
  detail: { dataUrl: string; mimeType: string; ms: number } | null;
  totalMs: number;
};

/**
 * View-isolated multi-angle generation.
 *
 * Back view isolation:
 *   When garmentBackRawImage is provided, the back view receives the back photo
 *   as IMAGE 1 (not the front garment ref), with a prompt that explicitly blocks
 *   all front design from appearing on the back output.
 *
 * Side / detail use the front garment reference as IMAGE 1 (unchanged).
 * Per-angle errors are non-fatal and return null for that angle.
 */
export async function generateMultiAngleImages(
  opts: MultiAngleGenerationOpts,
): Promise<MultiAngleGenerationResult> {
  const t0 = performance.now();
  const hasModelReference     = Boolean(opts.modelImage);
  const hasBackgroundReference = Boolean(opts.backgroundImage);
  const hasBackGarmentPhoto   = Boolean(opts.garmentBackRawImage);

  const base = (opts.baseUrl || "/").replace(/\/$/, "");

  const isFlash = isFlashModel(opts.imageModel);

  // Flash image order (identity-optimised):
  //   garment → main_result → pose(added later) → background → model_photo(LAST for recency)
  // Pro image order (unchanged):
  //   garment → main_result → model_photo → background → pose(added later)

  // Standard references used by side and detail views
  const frontRefs: GeminiInlineImage[] = isFlash
    ? [
        opts.garmentRefImage,          // IMAGE 1: front garment reference (highest priority)
        opts.mainResultImage,          // IMAGE 2: main result (identity + scene anchor)
        // pose added later in genAngle (IMAGE 3 if any)
        ...(opts.backgroundImage ? [opts.backgroundImage] : []),  // IMAGE 4 if bg
        ...(opts.modelImage      ? [opts.modelImage]      : []),  // IMAGE 5 LAST — recency = identity dominance
      ]
    : [
        opts.garmentRefImage,          // IMAGE 1: front garment reference
        opts.mainResultImage,          // IMAGE 2: main result (identity/scene)
        ...(opts.modelImage      ? [opts.modelImage]      : []),
        ...(opts.backgroundImage ? [opts.backgroundImage] : []),
      ];

  // Back view references — back photo replaces front garment ref as IMAGE 1
  const backRefs: GeminiInlineImage[] = hasBackGarmentPhoto
    ? isFlash
      ? [
          opts.garmentBackRawImage!,   // IMAGE 1: back garment photo (SOLE design source)
          opts.mainResultImage,        // IMAGE 2: main result (identity/scene anchor)
          // pose added later in genAngle
          ...(opts.backgroundImage ? [opts.backgroundImage] : []),
          ...(opts.modelImage      ? [opts.modelImage]      : []),  // LAST for recency
        ]
      : [
          opts.garmentBackRawImage!,   // IMAGE 1: back garment photo
          opts.mainResultImage,        // IMAGE 2: main result
          ...(opts.modelImage      ? [opts.modelImage]      : []),
          ...(opts.backgroundImage ? [opts.backgroundImage] : []),
        ]
    : frontRefs;                       // fallback: same as front refs, model infers back

  const promptBase = {
    hasModelReference,
    hasBackgroundReference,
    config: opts.config,
    garmentType: opts.garmentType || "",
  };

  async function fetchPoseImage(folder: string, count: number): Promise<GeminiInlineImage | null> {
    const n = Math.floor(Math.random() * count) + 1;
    try {
      const res = await fetch(`${base}/angle-poses/${folder}/${n}.jpg`);
      if (!res.ok) return null;
      const blob = await res.blob();
      return await new Promise<GeminiInlineImage>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result as string;
          const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
          if (!match) { reject(new Error("Bad pose data URL")); return; }
          const data = Uint8Array.from(atob(match[2]), (c) => c.charCodeAt(0));
          resolve({ mimeType: match[1], data });
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch { return null; }
  }

  async function genAngle(
    angle: "back" | "detail",
    poseRef: GeminiInlineImage | null,
  ): Promise<{ dataUrl: string; mimeType: string; ms: number } | null> {
    try {
      const t = performance.now();

      const isBack = angle === "back";
      const refImages = isBack ? backRefs : frontRefs;

      // Flash: insert pose AFTER main_result (index 1) so bg and model follow, model stays last
      // Pro:   append pose at end (unchanged)
      let images: GeminiInlineImage[];
      if (isFlash && poseRef) {
        images = [refImages[0]!, refImages[1]!, poseRef, ...refImages.slice(2)];
      } else {
        images = [...refImages, ...(poseRef ? [poseRef] : [])];
      }

      // Use the caller-selected model for every angle — no silent upgrades.
      const effectiveModel = opts.imageModel;

      const prompt = buildOptimizedMultiAnglePrompt({
        ...promptBase,
        angle,
        hasPoseReference: Boolean(poseRef),
        hasBackGarmentPhoto: isBack && hasBackGarmentPhoto,
        model: effectiveModel,
      });

      const res = await generateImage({
        model: effectiveModel,
        promptText: prompt,
        images,
        aspectRatio: "3:4",
        width: 1080, height: 1440,
        timeoutMs: 180_000,
        // Flash: low temperature reduces drift across angles
        temperature: isFlashModel(effectiveModel) ? 0.1 : undefined,
      });
      if (!res.imageBase64) return null;
      return { dataUrl: `data:${res.mimeType};base64,${res.imageBase64}`, mimeType: res.mimeType, ms: Math.round(performance.now() - t) };
    } catch { return null; }
  }

  const backPose = await fetchPoseImage("back", 8);

  const [back, detail] = await Promise.all([
    genAngle("back", backPose),
    genAngle("detail", null),
  ]);

  return { back, detail, totalMs: Math.round(performance.now() - t0) };
}
