import * as geminiService from "../gemini.service.js";

const MODEL = "gemini-2.5-flash-image";

function buildTryOnPrompt(category: string): string {
  const garmentArea =
    category === "lower_body" ? "bottom/lower body (pants, skirt, etc.)"
    : category === "full_body" ? "entire outfit (top and bottom)"
    : "upper body (shirt, jacket, top, etc.)";

  return `You are a virtual try-on system. Your task:

1. Study IMAGE 1 (the model/person photo) carefully — note the exact pose, body position, facial expression, hair, skin tone, background scene, and lighting.
2. Study IMAGE 2 (the garment) — note the exact garment design, color, pattern, texture, cut, and fit.
3. Generate a new photorealistic image of the same person from IMAGE 1, wearing the garment from IMAGE 2 on their ${garmentArea}.

CRITICAL rules:
- The model's face, hairstyle, skin tone, and body proportions must be IDENTICAL to IMAGE 1.
- The pose and body position must be IDENTICAL to IMAGE 1 — do not change angle, stance, or posture.
- The background, lighting, and environment must be IDENTICAL to IMAGE 1.
- The garment must look exactly as shown in IMAGE 2 — same color, same print/pattern, same cut and silhouette.
- The garment must appear naturally worn: correct drape, wrinkles from the pose, realistic fabric interaction with the body.
- Do NOT invent any extra clothing, accessories, or scene elements not present in either image.
- Output must be a single photorealistic fashion photo — studio quality, sharp focus, natural colors.`;
}

export async function generateTryOn(opts: {
  garmentImage: { mimeType: string; data: string };
  humanImage:   { mimeType: string; data: string };
  category?:    "upper_body" | "lower_body" | "full_body";
  timeoutMs?:   number;
}): Promise<{ mimeType: string; imageBase64: string }> {
  const category = opts.category ?? "upper_body";
  const prompt   = buildTryOnPrompt(category);

  console.log("[TryOn] Submitting to", MODEL, "| category:", category);

  const result = await geminiService.generateImage({
    model:      MODEL,
    promptText: prompt,
    images: [
      { mimeType: opts.humanImage.mimeType,   data: opts.humanImage.data },
      { mimeType: opts.garmentImage.mimeType, data: opts.garmentImage.data },
    ],
    aspectRatio: "3:4",
    timeoutMs:   opts.timeoutMs ?? 180_000,
  });

  return { mimeType: result.mimeType, imageBase64: result.imageBase64 };
}
