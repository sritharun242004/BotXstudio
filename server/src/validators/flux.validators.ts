import { z } from "zod";

const inlineImageSchema = z.object({
  mimeType: z.string().min(1),
  data:     z.string().min(1), // base64
});

export const generateFluxImageSchema = z.object({
  promptText:  z.string().min(1, "Prompt is required"),
  images:      z.array(inlineImageSchema).default([]),
  aspectRatio: z.string().optional(),
  width:       z.number().int().positive().optional(),
  height:      z.number().int().positive().optional(),
  seed:        z.number().int().optional(),
  // negativePrompt, numInferenceSteps, guidanceScale removed — not supported by Kontext
});

export type GenerateFluxImageInput = z.infer<typeof generateFluxImageSchema>;
