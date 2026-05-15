import type { Request, Response, NextFunction } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import * as kontextService from "../services/flux/kontext.service.js";
import type { GenerateFluxImageInput } from "../validators/flux.validators.js";
import { env } from "../config/env.js";
import { getCreditsForModel } from "../services/pricing.service.js";

const prisma = new PrismaClient();

export async function image(req: Request, res: Response, next: NextFunction) {
  const userId = req.user?.userId;
  const input = req.body as GenerateFluxImageInput;
  const model = "fal-ai/flux-pro/kontext/multi";
  const startMs = Date.now();

  try {
    let isDeveloper = false;

    const creditCost = await getCreditsForModel(model);

    // ── Credit check ──────────────────────────────────────────────────────────
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { creditsBalance: true, email: true },
      });

      const userEmail = (user?.email || "").toLowerCase();
      isDeveloper = Boolean(env.DEVELOPER_EMAIL && userEmail === env.DEVELOPER_EMAIL.toLowerCase());

      if (!isDeveloper) {
        const balance = user ? Number(user.creditsBalance) : 0;
        if (balance < creditCost) {
          res.status(402).json({ error: "Insufficient credits", balance, required: creditCost });
          return;
        }
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

      const user = await prisma.user.findUnique({ where: { id: userId }, select: { creditsBalance: true } });
      const currentBalance = user ? Number(user.creditsBalance) : 0;
      const newBalance = Math.max(0, currentBalance - creditCost);

      await prisma.$transaction([
        prisma.user.update({
          where: { id: userId },
          data: { creditsBalance: new Prisma.Decimal(newBalance) },
        }),
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
      ]).catch((err) => console.error("[Credits] Flux: failed to deduct:", err));

      return res.json({ ...result, latencyMs, balanceAfter: newBalance });
    }

    res.json({ ...result, latencyMs });
  } catch (err: any) {
    const latencyMs = Date.now() - startMs;

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
