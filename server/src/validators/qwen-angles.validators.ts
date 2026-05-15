import { z } from "zod";

const inlineImageSchema = z.object({
  mimeType: z.string().min(1),
  data:     z.string().min(1), // base64
});

export const generateQwenAnglesSchema = z.object({
  /** The rendered primary image (Gemini Flash output) as base64 */
  image:            inlineImageSchema,
  horizontalAngle:  z.number().min(0).max(360),
  verticalAngle:    z.number().min(-30).max(90),
  zoom:             z.number().min(0).max(10).optional(),
  additionalPrompt: z.string().optional(),
  outputFormat:     z.enum(["jpeg", "png"]).optional(),
  seed:             z.number().int().optional(),
});

export type GenerateQwenAnglesInput = z.infer<typeof generateQwenAnglesSchema>;
