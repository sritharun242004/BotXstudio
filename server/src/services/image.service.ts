import { PrismaClient } from "@prisma/client";
import * as s3Service from "./s3.service.js";
import { NotFoundError, ForbiddenError } from "../utils/errors.js";
import type { UploadImageInput } from "../validators/image.validators.js";
import crypto from "crypto";

const prisma = new PrismaClient();

export async function upload(userId: string, input: UploadImageInput) {
  const imageId = crypto.randomUUID();
  const ext = input.mimeType.split("/")[1] || "png";
  const s3Key = `users/${userId}/images/${imageId}.${ext}`;

  const buffer = Buffer.from(input.data, "base64");

  const { bucket, size } = await s3Service.uploadBuffer(s3Key, buffer, input.mimeType);

  // Validate storyboardId exists AND belongs to the same user before linking.
  // Without the userId check, a user could attach images to anyone's
  // storyboard (FK is valid since the row exists) — polluting the other
  // user's gallery via storyboardId/storyboardTitle columns.
  let validStoryboardId: string | null = null;
  if (input.storyboardId) {
    const sb = await prisma.storyboard.findUnique({
      where: { id: input.storyboardId },
      select: { id: true, userId: true },
    });
    if (sb && sb.userId === userId) validStoryboardId = sb.id;
  }

  const image = await prisma.image.create({
    data: {
      id: imageId,
      userId,
      storyboardId: validStoryboardId,
      title: input.title,
      kind: input.kind,
      mimeType: input.mimeType,
      fileName: input.fileName || null,
      s3Key,
      s3Bucket: bucket,
      fileSizeBytes: size,
      storyboardTitle: input.storyboardTitle || null,
    },
  });

  return image;
}

export async function list(
  userId: string,
  filters?: { kind?: string; storyboardId?: string },
) {
  const where: Record<string, unknown> = { userId };
  if (filters?.kind) where.kind = filters.kind;
  if (filters?.storyboardId) where.storyboardId = filters.storyboardId;

  // s3Key is selected so we can sign a download URL per image, but it is
  // stripped before returning (the bucket/key layout is internal detail).
  const rows = await prisma.image.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      kind: true,
      mimeType: true,
      fileName: true,
      fileSizeBytes: true,
      storyboardId: true,
      storyboardTitle: true,
      createdAt: true,
      s3Key: true,
    },
  });

  // Sign each download URL in parallel. Signing is local HMAC, no network
  // call, so this scales linearly with image count and stays cheap.
  // Browsers can then load images straight from S3 instead of being
  // proxied through the Node process, which was loading entire buffers
  // into memory per request.
  return Promise.all(
    rows.map(async ({ s3Key, ...image }) => ({
      ...image,
      downloadUrl: await s3Service.getPresignedDownloadUrl(s3Key),
    })),
  );
}

export async function getById(userId: string, id: string) {
  const image = await prisma.image.findUnique({ where: { id } });
  if (!image) throw new NotFoundError("Image not found");
  if (image.userId !== userId) throw new ForbiddenError();

  const downloadUrl = await s3Service.getPresignedDownloadUrl(image.s3Key);

  return { ...image, downloadUrl };
}

export async function getRaw(userId: string, id: string) {
  const image = await prisma.image.findUnique({ where: { id } });
  if (!image) throw new NotFoundError("Image not found");
  if (image.userId !== userId) throw new ForbiddenError();

  const buffer = await s3Service.getObjectBuffer(image.s3Key);
  return { buffer, mimeType: image.mimeType, fileName: image.fileName };
}

export async function remove(userId: string, id: string) {
  const image = await prisma.image.findUnique({ where: { id } });
  if (!image) throw new NotFoundError("Image not found");
  if (image.userId !== userId) throw new ForbiddenError();

  await s3Service.deleteObject(image.s3Key);
  await prisma.image.delete({ where: { id } });
}

export async function batchDelete(userId: string, ids: string[]) {
  const images = await prisma.image.findMany({
    where: { id: { in: ids }, userId },
  });

  if (images.length === 0) return { deleted: 0 };

  const s3Keys = images.map((img) => img.s3Key);
  await s3Service.deleteObjects(s3Keys);

  await prisma.image.deleteMany({
    where: { id: { in: images.map((img) => img.id) } },
  });

  return { deleted: images.length };
}
