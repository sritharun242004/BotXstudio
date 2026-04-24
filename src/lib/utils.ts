export function parseTags(raw: string): string[] {
  return (raw || "")
    .split(/[;,]/g)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function nowIso(): string {
  return new Date().toISOString();
}

/** MIME types the backend/Gemini API accepts natively */
const NATIVE_IMAGE_TYPES = new Set([
  "image/jpeg", "image/png", "image/webp", "image/gif",
]);

/** Check if a MIME type needs conversion */
export function isNativeImageType(mime: string): boolean {
  return NATIVE_IMAGE_TYPES.has((mime || "").split(";")[0].trim().toLowerCase());
}

/**
 * Read a File as a data URL, converting non-native image formats
 * (HEIC, HEIF, BMP, TIFF, AVIF, etc.) to JPEG via Canvas so the
 * backend accepts them.
 */
export async function fileToDataUrl(file: File): Promise<string> {
  const mime = (file.type || "").split(";")[0].trim().toLowerCase();

  // Native format — read directly
  if (NATIVE_IMAGE_TYPES.has(mime)) {
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error);
      reader.onload = () => resolve(String(reader.result || ""));
      reader.readAsDataURL(file);
    });
  }

  // Non-native format (HEIC, HEIF, BMP, TIFF, AVIF, etc.) — convert via Canvas
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error(
        `"${file.name}" could not be loaded. Your browser may not support this format. `
        + `Try converting to JPEG or PNG first, or use Safari for HEIC files.`
      ));
      el.src = objectUrl;
    });
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.92);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/** Return the effective MIME type for a file (after potential conversion) */
export function effectiveMimeType(file: File): string {
  const mime = (file.type || "").split(";")[0].trim().toLowerCase();
  return NATIVE_IMAGE_TYPES.has(mime) ? mime : "image/jpeg";
}

export async function blobToDataUrl(blob: Blob): Promise<string> {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(String(reader.result || ""));
    reader.readAsDataURL(blob);
  });
}

export function dataUrlToBlob(dataUrl: string): { blob: Blob; mimeType: string } {
  const trimmed = (dataUrl || "").trim();
  const match = trimmed.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error("Invalid data URL.");
  const mimeType = match[1].trim().toLowerCase() || "application/octet-stream";
  const bin = atob(match[2]);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
  return { blob: new Blob([bytes], { type: mimeType }), mimeType };
}

export function randomId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `id_${Math.random().toString(16).slice(2)}_${Date.now()}`;
  }
}

export function normalizeHexColor(value: string): string | null {
  const raw = (value || "").trim();
  if (!raw) return null;

  const hex = raw.startsWith("#") ? raw.slice(1) : raw;
  if (/^[0-9a-fA-F]{6}$/.test(hex)) return `#${hex.toUpperCase()}`;
  if (/^[0-9a-fA-F]{3}$/.test(hex)) {
    const expanded = hex
      .split("")
      .map((ch) => ch + ch)
      .join("");
    return `#${expanded.toUpperCase()}`;
  }
  return null;
}
