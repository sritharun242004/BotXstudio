import { z } from "zod";

const inlineImageSchema = z.object({
  mimeType: z.string().min(1),
  data:     z.string().min(1), // base64
});

export const generateGptImageSchema = z.object({
  promptText: z.string().min(1, "Prompt is required"),
  images:     z.array(inlineImageSchema).default([]),
  quality:    z.enum(["low", "medium", "high", "auto"]).optional(),
  size:       z.string().optional(),
});

export type GenerateGptImageInput = z.infer<typeof generateGptImageSchema>;
