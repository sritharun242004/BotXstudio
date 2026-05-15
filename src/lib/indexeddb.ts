import { apiGet, apiPost, apiDelete } from "./api";

export type SavedImageRecord = {
  id: string;
  title: string;
  kind: string;
  mimeType: string;
  createdAt: number;
  storyboardId?: string;
  storyboardTitle?: string;
  fileName?: string;
  blob: Blob;
};

type SaveInput = Omit<SavedImageRecord, "id" | "createdAt"> & {
  id?: string;
  createdAt?: number;
};

type ApiImage = {
  id: string;
  title: string;
  kind: string;
  mimeType: string;
  fileName?: string;
  fileSizeBytes?: number;
  storyboardId?: string;
  storyboardTitle?: string;
  createdAt: string;
  s3Key?: string;
  s3Bucket?: string;
  downloadUrl?: string;
};

/** Convert a Blob to a base64 string (no data URL prefix) */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(",")[1] || "";
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Failed to read blob"));
    reader.readAsDataURL(blob);
  });
}

/** Convert API image record to client-side SavedImageRecord (with empty blob placeholder) */
function apiToRecord(img: ApiImage): SavedImageRecord {
  return {
    id: img.id,
    title: img.title,
    kind: img.kind,
    mimeType: img.mimeType,
    createdAt: new Date(img.createdAt).getTime(),
    storyboardId: img.storyboardId || undefined,
    storyboardTitle: img.storyboardTitle || undefined,
    fileName: img.fileName || undefined,
    blob: new Blob(), // placeholder — use downloadUrl for display
  };
}

/** Save an image to S3 via backend */
export async function saveImageRecord(input: SaveInput): Promise<SavedImageRecord> {
  const base64 = await blobToBase64(input.blob);

  // Only send storyboardId if it's a valid UUID (old localStorage IDs are timestamps)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const sbId = input.storyboardId && uuidRegex.test(input.storyboardId) ? input.storyboardId : undefined;

  const payload = {
    title: input.title,
    kind: input.kind,
    mimeType: input.mimeType,
    fileName: input.fileName,
    storyboardId: sbId,
    storyboardTitle: input.storyboardTitle,
    data: base64,
  };

  const img = await apiPost<ApiImage>("/api/images", payload);
  return {
    ...apiToRecord(img),
    blob: input.blob, // keep the original blob for immediate display
  };
}

/** List all saved images from backend */
export async function listSavedImages(): Promise<SavedImageRecord[]> {
  const data = await apiGet<{ images: ApiImage[] }>("/api/images");
  return data.images.map(apiToRecord);
}

/** Delete a single image */
export async function deleteSavedImage(id: string): Promise<void> {
  await apiDelete(`/api/images/${id}`);
}

/** Batch delete specific images by IDs */
export async function batchDeleteImages(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await apiPost("/api/images/batch-delete", { ids });
}

/** Batch delete all images */
export async function clearSavedImages(): Promise<void> {
  const data = await apiGet<{ images: ApiImage[] }>("/api/images");
  if (data.images.length === 0) return;
  const ids = data.images.map((img) => img.id);
  await apiPost("/api/images/batch-delete", { ids });
}

/** Get a presigned download URL for an image */
export async function getImageDownloadUrl(id: string): Promise<string> {
  const data = await apiGet<ApiImage & { downloadUrl: string }>(`/api/images/${id}`);
  return data.downloadUrl;
}
