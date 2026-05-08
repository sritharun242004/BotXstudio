import type { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { NotFoundError } from "../utils/errors.js";
import { env } from "../config/env.js";
const s3 = new S3Client({ region: env.AWS_REGION });

export async function listAllImages(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, page = "1", limit = "30" } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where: any = {};
    if (userId) where.userId = userId;

    const [images, total] = await Promise.all([
      prisma.image.findMany({
        where,
        include: { user: { select: { email: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take: parseInt(limit),
      }),
      prisma.image.count({ where }),
    ]);

    res.json({ images, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    next(err);
  }
}

export async function removeImage(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params["id"] as string;
    const image = await prisma.image.findUnique({ where: { id } });
    if (!image) throw new NotFoundError("Image not found");

    await s3.send(new DeleteObjectCommand({ Bucket: image.s3Bucket, Key: image.s3Key })).catch(() => {});
    await prisma.image.delete({ where: { id } });

    await prisma.adminLog.create({
      data: { adminId: req.user!.userId, action: "delete_image", targetId: id },
    }).catch(() => {});

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}
