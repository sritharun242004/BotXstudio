import type { Request, Response, NextFunction } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import * as geminiService from "../services/gemini.service.js";
import type { GeneratePlanInput, GenerateImageInput } from "../validators/generate.validators.js";
import { env } from "../config/env.js";
import {
  getCreditsForModel,
  FREE_ELIGIBLE_MODELS,
  FREE_IMAGE_QUOTA,
} from "../services/pricing.service.js";

const prisma = new PrismaClient();

export async function plan(req: Request, res: Response, next: NextFunction) {
  const userId = req.user?.userId;
  const input = req.body as GeneratePlanInput;
  const model = input.model || "gemini-2.5-flash";
  const startMs = Date.now();

  try {
    const result = await geminiService.generateText({
      model: input.model,
      promptText: input.promptText,
      images: input.images,
      temperature: input.temperature,
      maxOutputTokens: input.maxOutputTokens,
    });

    const latencyMs = Date.now() - startMs;

    if (userId) {
      prisma.apiLog.create({
        data: {
          userId,
          type: "text",
          model,
          promptTokens: result.tokens.promptTokens,
          outputTokens: result.tokens.outputTokens,
          totalTokens: result.tokens.totalTokens,
          latencyMs,
          status: "success",
        },
      }).catch((err) => console.error("[ApiLog] Failed to save:", err));
    }

    res.json({ ...result, latencyMs });
  } catch (err: any) {
    const latencyMs = Date.now() - startMs;

    if (userId) {
      prisma.apiLog.create({
        data: {
          userId,
          type: "text",
          model,
          latencyMs,
          status: "error",
          errorMessage: String(err?.message || err).slice(0, 500),
        },
      }).catch((logErr) => console.error("[ApiLog] Failed to save error log:", logErr));
    }

    next(err);
  }
}

export async function image(req: Request, res: Response, next: NextFunction) {
  const userId = req.user?.userId;
  const input = req.body as GenerateImageInput;
  const model = input.model || "gemini-2.5-flash-image";
  const startMs = Date.now();

  try {
    let isDeveloper = false;
    let useFreeQuota = false;

    // ── Credit check ────────────────────────────────────────────────────────
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { creditsBalance: true, email: true, freeImagesUsed: true },
      });

      const userEmail = (user?.email || "").toLowerCase();
      isDeveloper = Boolean(env.DEVELOPER_EMAIL && userEmail === env.DEVELOPER_EMAIL.toLowerCase());

      if (!isDeveloper) {
        const isFreeEligible = FREE_ELIGIBLE_MODELS.has(model);
        const freeUsed = user?.freeImagesUsed ?? 0;

        if (isFreeEligible && freeUsed < FREE_IMAGE_QUOTA) {
          useFreeQuota = true;
        } else {
          const creditCost = await getCreditsForModel(model);
          const balance = user ? Number(user.creditsBalance) : 0;
          if (balance < creditCost) {
            res.status(402).json({ error: "Insufficient credits", balance, required: creditCost });
            return;
          }
        }
      }
    }

    const result = await geminiService.generateImage({
      model: input.model,
      promptText: input.promptText,
      images: input.images,
      temperature: input.temperature,
      aspectRatio: input.aspectRatio,
      width: input.width,
      height: input.height,
    });

    const latencyMs = Date.now() - startMs;

    // ── Deduct credits (or consume free quota) and log ───────────────────────
    if (userId) {
      if (isDeveloper) {
        prisma.apiLog.create({
          data: {
            userId, type: "image", model,
            promptTokens: result.tokens.promptTokens,
            outputTokens: result.tokens.outputTokens,
            totalTokens: result.tokens.totalTokens,
            latencyMs, status: "success",
          },
        }).catch((err) => console.error("[ApiLog] Failed to save:", err));
        return res.json({ ...result, latencyMs, balanceAfter: null, freeImagesRemaining: null });
      }

      if (useFreeQuota) {
        // Consume one free image slot — no credit deduction
        const updated = await prisma.user.update({
          where: { id: userId },
          data: { freeImagesUsed: { increment: 1 } },
          select: { freeImagesUsed: true, creditsBalance: true },
        });
        prisma.apiLog.create({
          data: {
            userId, type: "image", model,
            promptTokens: result.tokens.promptTokens,
            outputTokens: result.tokens.outputTokens,
            totalTokens: result.tokens.totalTokens,
            latencyMs, status: "success",
          },
        }).catch((err) => console.error("[ApiLog] Failed to save:", err));
        const freeRemaining = Math.max(0, FREE_IMAGE_QUOTA - updated.freeImagesUsed);
        return res.json({ ...result, latencyMs, balanceAfter: Number(updated.creditsBalance), freeImagesRemaining: freeRemaining });
      }

      const creditCost = getCreditsForModel(model);
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
            userId, type: "image", model,
            promptTokens: result.tokens.promptTokens,
            outputTokens: result.tokens.outputTokens,
            totalTokens: result.tokens.totalTokens,
            latencyMs, status: "success",
          },
        }),
      ]).catch((err) => console.error("[Credits] Failed to deduct:", err));

      return res.json({ ...result, latencyMs, balanceAfter: newBalance, freeImagesRemaining: 0 });
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
      }).catch((logErr) => console.error("[ApiLog] Failed to save error log:", logErr));
    }

    next(err);
  }
}
