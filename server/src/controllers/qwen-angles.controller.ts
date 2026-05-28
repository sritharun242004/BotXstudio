import type { Request, Response, NextFunction } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import * as qwenService from "../services/flux/qwen-angles.service.js";
import type { GenerateQwenAnglesInput } from "../validators/qwen-angles.validators.js";
import { env } from "../config/env.js";
import { reserveCredits, refundCredits, getCurrentBalance } from "../services/credits.service.js";

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

  let reservedCost = 0;
  let isDeveloper = false;
  const costPerImage = await getCostPerImage();

  try {
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });

      const userEmail = (user?.email || "").toLowerCase();
      isDeveloper = Boolean(env.DEVELOPER_EMAIL && userEmail === env.DEVELOPER_EMAIL.toLowerCase());

      if (!isDeveloper) {
        const ok = await reserveCredits(userId, costPerImage);
        if (!ok) {
          const balance = await getCurrentBalance(userId);
          res.status(402).json({ error: "Insufficient credits", balance, required: costPerImage });
          return;
        }
        reservedCost = costPerImage;
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

      // Credits already deducted by reserveCredits() above.
      const newBalance = await getCurrentBalance(userId);

      await prisma.$transaction([
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
      ]).catch((err) => console.error("[Credits] QwenAngles: failed to record transaction:", err));

      return res.json({ ...result, latencyMs, balanceAfter: newBalance });
    }

    res.json({ ...result, latencyMs });
  } catch (err: any) {
    const latencyMs = Date.now() - startMs;

    if (userId && reservedCost > 0) {
      await refundCredits(userId, reservedCost);
    }

    if (userId) {
      prisma.apiLog.create({
        data: { userId, type: "image", model: MODEL, latencyMs, status: "error", errorMessage: String(err?.message || err).slice(0, 500) },
      }).catch((logErr) => console.error("[ApiLog] QwenAngles: failed to save error log:", logErr));
    }

    next(err);
  }
}
