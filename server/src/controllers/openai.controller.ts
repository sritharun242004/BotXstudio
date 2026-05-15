import type { Request, Response, NextFunction } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import * as gptImageService from "../services/openai/gpt-image.service.js";
import type { GenerateGptImageInput } from "../validators/openai.validators.js";
import { env } from "../config/env.js";
import { getCreditsForModel } from "../services/pricing.service.js";

const prisma = new PrismaClient();

const MODEL_ID = "gpt-image-2";

export async function image(req: Request, res: Response, next: NextFunction) {
  const userId = req.user?.userId;
  const input  = req.body as GenerateGptImageInput;
  const startMs = Date.now();

  try {
    let isDeveloper = false;

    // ── Credit check ──────────────────────────────────────────────────────────
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { creditsBalance: true, email: true },
      });

      const userEmail = (user?.email || "").toLowerCase();
      isDeveloper = Boolean(env.DEVELOPER_EMAIL && userEmail === env.DEVELOPER_EMAIL.toLowerCase());

      if (!isDeveloper) {
        const creditCost = await getCreditsForModel(MODEL_ID, input.quality, input.size);
        const balance = user ? Number(user.creditsBalance) : 0;
        if (balance < creditCost) {
          res.status(402).json({ error: "Insufficient credits", balance, required: creditCost });
          return;
        }
      }
    }

    const result = await gptImageService.generateImage({
      promptText: input.promptText,
      images:     input.images,
      quality:    input.quality,
      size:       input.size as gptImageService.GptImageSize | undefined,
    });

    const latencyMs = Date.now() - startMs;

    // ── Deduct credits and log ────────────────────────────────────────────────
    if (userId) {
      if (isDeveloper) {
        prisma.apiLog.create({
          data: {
            userId,
            type:         "image",
            model:        MODEL_ID,
            promptTokens: result.tokens.promptTokens,
            outputTokens: result.tokens.outputTokens,
            totalTokens:  result.tokens.totalTokens,
            latencyMs,
            status:       "success",
          },
        }).catch((err) => console.error("[ApiLog] GPT Image: failed to save:", err));
        return res.json({ ...result, latencyMs, balanceAfter: null });
      }

      const creditCost     = await getCreditsForModel(MODEL_ID, input.quality, input.size);
      const user           = await prisma.user.findUnique({ where: { id: userId }, select: { creditsBalance: true } });
      const currentBalance = user ? Number(user.creditsBalance) : 0;
      const newBalance     = Math.max(0, currentBalance - creditCost);

      await prisma.$transaction([
        prisma.user.update({
          where: { id: userId },
          data:  { creditsBalance: new Prisma.Decimal(newBalance) },
        }),
        prisma.creditTransaction.create({
          data: {
            userId,
            amountInr:   new Prisma.Decimal(-creditCost),
            type:        "image_gen",
            description: `Image generated (${MODEL_ID} ${input.quality ?? "medium"} ${input.size ?? "1024x1024"})`,
            balanceAfter: new Prisma.Decimal(newBalance),
          },
        }),
        prisma.apiLog.create({
          data: {
            userId,
            type:         "image",
            model:        MODEL_ID,
            promptTokens: result.tokens.promptTokens,
            outputTokens: result.tokens.outputTokens,
            totalTokens:  result.tokens.totalTokens,
            latencyMs,
            status:       "success",
          },
        }),
      ]).catch((err) => console.error("[Credits] GPT Image: failed to deduct:", err));

      return res.json({ ...result, latencyMs, balanceAfter: newBalance });
    }

    res.json({ ...result, latencyMs });
  } catch (err: any) {
    const latencyMs = Date.now() - startMs;

    if (userId) {
      prisma.apiLog.create({
        data: {
          userId,
          type:         "image",
          model:        MODEL_ID,
          latencyMs,
          status:       "error",
          errorMessage: String(err?.message || err).slice(0, 500),
        },
      }).catch((logErr) => console.error("[ApiLog] GPT Image: failed to save error log:", logErr));
    }

    next(err);
  }
}
