import { z } from "zod";

const inlineImageSchema = z.object({
  mimeType: z.string().min(1),
  data: z.string().min(1), // base64
});

export const generatePlanSchema = z.object({
  model: z.string().optional(),
  promptText: z.string().min(1, "Prompt is required"),
  images: z.array(inlineImageSchema).optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxOutputTokens: z.number().int().positive().optional(),
});

export const generateImageSchema = z.object({
  model: z.string().optional(),
  promptText: z.string().min(1, "Prompt is required"),
  images: z.array(inlineImageSchema).default([]),
  temperature: z.number().min(0).max(2).optional(),
  aspectRatio: z.string().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

export type GeneratePlanInput = z.infer<typeof generatePlanSchema>;
export type GenerateImageInput = z.infer<typeof generateImageSchema>;
