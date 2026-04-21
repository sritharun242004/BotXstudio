import type { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import * as s3Service from "../services/s3.service.js";
import { NotFoundError, ForbiddenError } from "../utils/errors.js";
import { env } from "../config/env.js";
import type { RequestUploadUrlInput, RegisterAssetInput } from "../validators/asset.validators.js";
import crypto from "crypto";

const prisma = new PrismaClient();

/** POST /api/assets/upload — get a presigned upload URL */
export async function requestUploadUrl(req: Request, res: Response, next: NextFunction) {
  try {
    const { fileName, mimeType, kind } = req.body as RequestUploadUrlInput;
    const ext = fileName.split(".").pop() || "png";
    const assetId = crypto.randomUUID();
    const s3Key = `users/${req.user!.userId}/assets/${kind}/${assetId}.${ext}`;

    const uploadUrl = await s3Service.getPresignedUploadUrl(s3Key, mimeType);

    res.json({
      uploadUrl,
      s3Key,
      s3Bucket: env.S3_BUCKET,
    });
  } catch (err) {
    next(err);
  }
}

/** POST /api/assets — register an uploaded asset */
export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const input = req.body as RegisterAssetInput;
    const asset = await prisma.asset.create({
      data: {
        userId: req.user!.userId,
        kind: input.kind,
        title: input.title,
        mimeType: input.mimeType,
        s3Key: input.s3Key,
        s3Bucket: env.S3_BUCKET,
        fileSizeBytes: input.fileSizeBytes || null,
      },
    });
    res.status(201).json(asset);
  } catch (err) {
    next(err);
  }
}

/** GET /api/assets — list assets (optionally filter by kind) */
export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const kind = req.query.kind as string | undefined;
    const where: Record<string, unknown> = { userId: req.user!.userId };
    if (kind) where.kind = kind;

    const assets = await prisma.asset.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    // Attach presigned download URLs
    const assetsWithUrls = await Promise.all(
      assets.map(async (asset) => ({
        ...asset,
        downloadUrl: await s3Service.getPresignedDownloadUrl(asset.s3Key),
      })),
    );

    res.json({ assets: assetsWithUrls });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/assets/:id — delete asset from S3 + DB */
export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const asset = await prisma.asset.findUnique({ where: { id: req.params.id as string } });
    if (!asset) throw new NotFoundError("Asset not found");
    if (asset.userId !== req.user!.userId) throw new ForbiddenError();

    await s3Service.deleteObject(asset.s3Key);
    await prisma.asset.delete({ where: { id: asset.id } });

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}
