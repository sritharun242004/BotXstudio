import { z } from "zod";
import { imageDataSchema } from "./_shared.js";

const inlineImageSchema = imageDataSchema;

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
