import { z } from "zod";

const inlineImageSchema = z.object({
  mimeType: z.string().min(1),
  data: z.string().min(1), // base64
});

export const tryOnSchema = z.object({
  garmentImage: inlineImageSchema,
  humanImage: inlineImageSchema,
  category: z.enum(["upper_body", "lower_body", "full_body"]).default("upper_body"),
});

export type TryOnInput = z.infer<typeof tryOnSchema>;
