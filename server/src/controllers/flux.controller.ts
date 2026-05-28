import type { Request, Response, NextFunction } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import * as kontextService from "../services/flux/kontext.service.js";
import type { GenerateFluxImageInput } from "../validators/flux.validators.js";
import { env } from "../config/env.js";
import { getCreditsForModel } from "../services/pricing.service.js";
import { reserveCredits, refundCredits, getCurrentBalance } from "../services/credits.service.js";

const prisma = new PrismaClient();

export async function image(req: Request, res: Response, next: NextFunction) {
  const userId = req.user?.userId;
  const input = req.body as GenerateFluxImageInput;
  const model = "fal-ai/flux-pro/kontext/multi";
  const startMs = Date.now();

  let reservedCost = 0;
  let isDeveloper = false;
  const creditCost = await getCreditsForModel(model);

  try {
    // ── Credit reservation (atomic) ──────────────────────────────────────────
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });

      const userEmail = (user?.email || "").toLowerCase();
      isDeveloper = Boolean(env.DEVELOPER_EMAIL && userEmail === env.DEVELOPER_EMAIL.toLowerCase());

      if (!isDeveloper) {
        const ok = await reserveCredits(userId, creditCost);
        if (!ok) {
          const balance = await getCurrentBalance(userId);
          res.status(402).json({ error: "Insufficient credits", balance, required: creditCost });
          return;
        }
        reservedCost = creditCost;
      }
    }

    const result = await kontextService.generateImage({
      promptText: input.promptText,
      images: input.images,
      aspectRatio: input.aspectRatio,
      width: input.width,
      height: input.height,
      seed: input.seed,
    });

    const latencyMs = Date.now() - startMs;

    // ── Deduct credits and log ────────────────────────────────────────────────
    if (userId) {
      if (isDeveloper) {
        prisma.apiLog.create({
          data: {
            userId,
            type: "image",
            model,
            promptTokens: result.tokens.promptTokens,
            outputTokens: result.tokens.outputTokens,
            totalTokens: result.tokens.totalTokens,
            latencyMs,
            status: "success",
          },
        }).catch((err) => console.error("[ApiLog] Flux: failed to save:", err));
        return res.json({ ...result, latencyMs, balanceAfter: null });
      }

      // Credits already deducted by reserveCredits() above.
      const newBalance = await getCurrentBalance(userId);

      await prisma.$transaction([
        prisma.creditTransaction.create({
          data: {
            userId,
            amountInr: new Prisma.Decimal(-creditCost),
            type: "image_gen",
            description: `Image generated (${model})`,
            balanceAfter: new Prisma.Decimal(newBalance),
          },
        }),
        prisma.apiLog.create({
          data: {
            userId,
            type: "image",
            model,
            promptTokens: result.tokens.promptTokens,
            outputTokens: result.tokens.outputTokens,
            totalTokens: result.tokens.totalTokens,
            latencyMs,
            status: "success",
          },
        }),
      ]).catch((err) => console.error("[Credits] Flux: failed to record transaction:", err));

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
        data: {
          userId,
          type: "image",
          model,
          latencyMs,
          status: "error",
          errorMessage: String(err?.message || err).slice(0, 500),
        },
      }).catch((logErr) => console.error("[ApiLog] Flux: failed to save error log:", logErr));
    }

    next(err);
  }
}
