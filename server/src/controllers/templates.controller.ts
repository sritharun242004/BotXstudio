import type { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { NotFoundError } from "../utils/errors.js";
import { env } from "../config/env.js";
import type { Readable } from "stream";
const s3 = new S3Client({ region: env.AWS_REGION });

export async function getTemplates(req: Request, res: Response, next: NextFunction) {
  try {
    const { category } = req.query as { category?: string };
    const where: any = {};
    if (category) where.category = category;

    const rows = await prisma.template.findMany({
      where,
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        title: true,
        category: true,
        s3Key: true,
        s3Bucket: true,
        metadata: true,
      },
    });

    // Return proxy URLs instead of signed URLs — avoids S3 CORS when JS fetch() reads the body
    const templates = rows.map((t) => ({
      ...t,
      imageProxyUrl: `/api/templates/${t.id}/image`,
    }));

    // Include soft-disabled static template IDs so the frontend can filter them out
    const disabledRows = await (prisma as any).disabledTemplate.findMany({
      select: { templateId: true },
    });
    const disabledIds: string[] = disabledRows.map((r: any) => r.templateId as string);

    res.json({ templates, disabledIds });
  } catch (err) {
    next(err);
  }
}

// Streams the S3 object through the backend — no CORS restriction on the client side
export async function proxyTemplateImage(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params["id"] as string;
    const template = await prisma.template.findUnique({
      where: { id },
      select: { s3Bucket: true, s3Key: true },
    });
    if (!template) throw new NotFoundError("Template not found");

    const command = new GetObjectCommand({ Bucket: template.s3Bucket, Key: template.s3Key });
    const s3Res = await s3.send(command);

    if (s3Res.ContentType) res.setHeader("Content-Type", s3Res.ContentType);
    if (s3Res.ContentLength) res.setHeader("Content-Length", String(s3Res.ContentLength));
    res.setHeader("Cache-Control", "public, max-age=3600");

    (s3Res.Body as Readable).pipe(res);
  } catch (err) {
    next(err);
  }
}
