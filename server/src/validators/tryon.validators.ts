import { z } from "zod";
import { imageDataSchema } from "./_shared.js";

const inlineImageSchema = imageDataSchema;

export const tryOnSchema = z.object({
  garmentImage: inlineImageSchema,
  humanImage: inlineImageSchema,
  category: z.enum(["upper_body", "lower_body", "full_body"]).default("upper_body"),
});

export type TryOnInput = z.infer<typeof tryOnSchema>;
