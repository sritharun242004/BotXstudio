import type { Request, Response, NextFunction } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import * as qwenService from "../services/flux/qwen-angles.service.js";
import type { GenerateQwenAnglesInput } from "../validators/qwen-angles.validators.js";
import { env } from "../config/env.js";

const prisma = new PrismaClient();
const MODEL  = "fal-ai/qwen-image-edit-2511-multiple-angles";

async function getCostPerImage(): Promise<number> {
  const config = await prisma.creditConfig.findUnique({ where: { id: "singleton" } });
  return config ? Number(config.perImageCostInr) : 10;
}

export async function angles(req: Request, res: Response, next: NextFunction) {
  const userId  = req.user?.userId;
  const input   = req.body as GenerateQwenAnglesInput;
  const startMs = Date.now();

  try {
    let isDeveloper = false;

    if (userId) {
      const [user, costPerImage] = await Promise.all([
        prisma.user.findUnique({ where: { id: userId }, select: { creditsBalance: true, email: true } }),
        getCostPerImage(),
      ]);

      const userEmail = (user?.email || "").toLowerCase();
      isDeveloper = Boolean(env.DEVELOPER_EMAIL && userEmail === env.DEVELOPER_EMAIL.toLowerCase());

      if (!isDeveloper) {
        const balance = user ? Number(user.creditsBalance) : 0;
        if (balance < costPerImage) {
          res.status(402).json({ error: "Insufficient credits", balance, required: costPerImage });
          return;
        }
      }
    }

    const result = await qwenService.generateAngle({
      imageBase64:     input.image.data,
      mimeType:        input.image.mimeType,
      horizontalAngle: input.horizontalAngle,
      verticalAngle:   input.verticalAngle,
      zoom:            input.zoom,
      additionalPrompt: input.additionalPrompt,
      outputFormat:    input.outputFormat,
      seed:            input.seed,
    });

    const latencyMs = Date.now() - startMs;

    if (userId) {
      if (isDeveloper) {
        prisma.apiLog.create({
          data: { userId, type: "image", model: MODEL, promptTokens: 0, outputTokens: 0, totalTokens: 0, latencyMs, status: "success" },
        }).catch((err) => console.error("[ApiLog] QwenAngles: failed to save:", err));
        return res.json({ ...result, latencyMs, balanceAfter: null });
      }

      const costPerImage = await getCostPerImage();
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { creditsBalance: true } });
      const currentBalance = user ? Number(user.creditsBalance) : 0;
      const newBalance     = Math.max(0, currentBalance - costPerImage);

      await prisma.$transaction([
        prisma.user.update({
          where: { id: userId },
          data:  { creditsBalance: new Prisma.Decimal(newBalance) },
        }),
        prisma.creditTransaction.create({
          data: {
            userId,
            amountInr:   new Prisma.Decimal(-costPerImage),
            type:        "image_gen",
            description: `Image generated (${MODEL})`,
            balanceAfter: new Prisma.Decimal(newBalance),
          },
        }),
        prisma.apiLog.create({
          data: { userId, type: "image", model: MODEL, promptTokens: 0, outputTokens: 0, totalTokens: 0, latencyMs, status: "success" },
        }),
      ]).catch((err) => console.error("[Credits] QwenAngles: failed to deduct:", err));

      return res.json({ ...result, latencyMs, balanceAfter: newBalance });
    }

    res.json({ ...result, latencyMs });
  } catch (err: any) {
    const latencyMs = Date.now() - startMs;

    if (userId) {
      prisma.apiLog.create({
        data: { userId, type: "image", model: MODEL, latencyMs, status: "error", errorMessage: String(err?.message || err).slice(0, 500) },
      }).catch((logErr) => console.error("[ApiLog] QwenAngles: failed to save error log:", logErr));
    }

    next(err);
  }
}
