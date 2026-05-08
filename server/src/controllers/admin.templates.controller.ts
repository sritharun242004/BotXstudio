import type { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Prisma } from "@prisma/client";
import { BadRequestError, NotFoundError } from "../utils/errors.js";
import { env } from "../config/env.js";
import { randomUUID } from "crypto";
const s3 = new S3Client({ region: env.AWS_REGION });
const BUCKET = env.S3_BUCKET;

export async function listTemplates(req: Request, res: Response, next: NextFunction) {
  try {
    const { category } = req.query as { category?: string };
    const where: any = {};
    if (category) where.category = category;

    const rows = await prisma.template.findMany({
      where,
      include: { createdByUser: { select: { email: true } } },
      orderBy: { createdAt: "desc" },
    });

    const templates = await Promise.all(
      rows.map(async (t) => {
        try {
          const cmd = new GetObjectCommand({ Bucket: t.s3Bucket, Key: t.s3Key });
          const signedUrl = await getSignedUrl(s3, cmd, { expiresIn: 3600 });
          return { ...t, signedUrl };
        } catch {
          return { ...t, signedUrl: null };
        }
      })
    );

    res.json({ templates });
  } catch (err) {
    next(err);
  }
}

export async function createTemplate(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      title,
      category,
      base64Data,
      filename,
      mimeType,
      metadata,
    } = req.body as {
      title: string;
      category: string;
      base64Data?: string;
      filename?: string;
      mimeType?: string;
      metadata?: Record<string, string>;
    };

    if (!title || !category) {
      throw new BadRequestError("title and category required");
    }
    if (!["model", "pose", "background"].includes(category)) {
      throw new BadRequestError("category must be model, pose, or background");
    }
    if (!base64Data || !filename || !mimeType) {
      throw new BadRequestError("base64Data, filename, and mimeType required");
    }

    // Strip data URL prefix and decode
    const base64String = base64Data.replace(/^data:[^;]+;base64,/, "");
    const buffer = Buffer.from(base64String, "base64");

    const s3Key = `templates/${category}/${randomUUID()}-${filename}`;
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: s3Key,
        Body: buffer,
        ContentType: mimeType,
      })
    );

    const template = await prisma.template.create({
      data: {
        title,
        category,
        s3Key,
        s3Bucket: BUCKET,
        previewUrl: null,
        metadata: metadata ? (metadata as Prisma.InputJsonValue) : Prisma.DbNull,
        createdBy: req.user!.userId,
      },
    });

    await prisma.adminLog
      .create({
        data: { adminId: req.user!.userId, action: "create_template", targetId: template.id },
      })
      .catch(() => {});

    res.status(201).json({ template });
  } catch (err) {
    next(err);
  }
}

export async function deleteTemplate(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params["id"] as string;
    const template = await prisma.template.findUnique({ where: { id } });
    if (!template) throw new NotFoundError("Template not found");

    await s3
      .send(new DeleteObjectCommand({ Bucket: template.s3Bucket, Key: template.s3Key }))
      .catch(() => {});
    await prisma.template.delete({ where: { id } });

    await prisma.adminLog
      .create({
        data: { adminId: req.user!.userId, action: "delete_template", targetId: id },
      })
      .catch(() => {});

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

// ── Static template soft-delete (hide from UI) ────────────────────────────────

export async function listDisabledTemplates(_req: Request, res: Response, next: NextFunction) {
  try {
    const rows = await (prisma as any).disabledTemplate.findMany({
      select: { templateId: true, category: true, disabledAt: true },
    });
    res.json({ disabledIds: rows.map((r: any) => r.templateId as string) });
  } catch (err) {
    next(err);
  }
}

export async function disableStaticTemplate(req: Request, res: Response, next: NextFunction) {
  try {
    const { templateId, category } = req.body as { templateId: string; category: string };
    if (!templateId || !category) throw new BadRequestError("templateId and category required");

    await (prisma as any).disabledTemplate.upsert({
      where: { templateId },
      update: {},
      create: { templateId, category, disabledBy: req.user!.userId },
    });

    await prisma.adminLog
      .create({ data: { adminId: req.user!.userId, action: "disable_static_template", targetId: templateId } })
      .catch(() => {});

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

export async function enableStaticTemplate(req: Request, res: Response, next: NextFunction) {
  try {
    const templateId = req.params["templateId"] as string;

    await (prisma as any).disabledTemplate.deleteMany({ where: { templateId } });

    await prisma.adminLog
      .create({ data: { adminId: req.user!.userId, action: "enable_static_template", targetId: templateId } })
      .catch(() => {});

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}
