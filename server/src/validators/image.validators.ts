import { z } from "zod";

export const uploadImageSchema = z.object({
  title: z.string().min(1).max(200),
  kind: z.string().min(1).max(50),
  mimeType: z.string().regex(/^image\/(png|jpeg|webp|gif)$/),
  fileName: z.string().max(255).optional(),
  storyboardId: z.string().uuid().optional(),
  storyboardTitle: z.string().max(200).optional(),
  /** Base64-encoded image data (no data URL prefix) */
  data: z.string().min(1),
});

export const batchDeleteSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(100),
});

export type UploadImageInput = z.infer<typeof uploadImageSchema>;
export type BatchDeleteInput = z.infer<typeof batchDeleteSchema>;
