import { z } from "zod";
import { imageDataSchema } from "./_shared.js";

const inlineImageSchema = imageDataSchema;

export const generateGptImageSchema = z.object({
  promptText: z.string().min(1, "Prompt is required"),
  images:     z.array(inlineImageSchema).default([]),
  quality:    z.enum(["low", "medium", "high", "auto"]).optional(),
  size:       z.string().optional(),
});

export type GenerateGptImageInput = z.infer<typeof generateGptImageSchema>;
