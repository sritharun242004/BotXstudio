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

  // Validate storyboardId exists before linking (avoid FK constraint violation)
  let validStoryboardId: string | null = null;
  if (input.storyboardId) {
    const sb = await prisma.storyboard.findUnique({ where: { id: input.storyboardId }, select: { id: true } });
    if (sb) validStoryboardId = sb.id;
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

  return prisma.image.findMany({
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
    },
  });
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
  return { buffer, mimeType: image.mimeType };
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
