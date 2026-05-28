import { z } from "zod";

// Base64-encoded image cap. ~8 MB encoded ≈ 6 MB raw — comfortably above
// real-world product photos and well under the global express.json 25 MB cap.
// This stops a single request from exhausting memory or hosting attacker
// payloads under our S3 bucket disguised as images.
const MAX_IMAGE_B64_BYTES = 8 * 1024 * 1024;

const ALLOWED_IMAGE_MIME = /^image\/(png|jpeg|jpg|webp|gif)$/;

// Validator for an `{ mimeType, data }` payload (base64 image-in-JSON).
// Use this everywhere a request body carries inline image bytes.
export const imageDataSchema = z.object({
  mimeType: z.string().regex(ALLOWED_IMAGE_MIME, "Unsupported image type"),
  data: z.string().min(1).max(MAX_IMAGE_B64_BYTES, "Image too large"),
});
