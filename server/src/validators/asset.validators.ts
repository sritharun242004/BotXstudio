import { z } from "zod";

export const requestUploadUrlSchema = z.object({
  fileName: z.string().min(1).max(255),
  mimeType: z.string().regex(/^image\/(png|jpeg|webp|gif)$/),
  kind: z.string().min(1).max(50),
});

export const registerAssetSchema = z.object({
  kind: z.string().min(1).max(50),
  title: z.string().min(1).max(200),
  mimeType: z.string().regex(/^image\/(png|jpeg|webp|gif)$/),
  s3Key: z.string().min(1),
  fileSizeBytes: z.number().int().nonnegative().optional(),
});

export type RequestUploadUrlInput = z.infer<typeof requestUploadUrlSchema>;
export type RegisterAssetInput = z.infer<typeof registerAssetSchema>;
