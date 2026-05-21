import type { Request, Response, NextFunction } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import * as tryOnService from "../services/flux/tryon.service.js";
import type { TryOnInput } from "../validators/tryon.validators.js";
import { env } from "../config/env.js";

const prisma = new PrismaClient();

const MODEL_KEY = "gemini-2.5-flash-image";
const CREDIT_COST = 5;

export async function tryOn(req: Request, res: Response, next: NextFunction) {
  const userId = req.user?.userId;
  const input = req.body as TryOnInput;
  const startMs = Date.now();

  try {
    let isDeveloper = false;

    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { creditsBalance: true, email: true },
      });

      const userEmail = (user?.email || "").toLowerCase();
      isDeveloper = Boolean(env.DEVELOPER_EMAIL && userEmail === env.DEVELOPER_EMAIL.toLowerCase());

      if (!isDeveloper) {
        const balance = user ? Number(user.creditsBalance) : 0;
        if (balance < CREDIT_COST) {
          res.status(402).json({ error: "Insufficient credits", balance, required: CREDIT_COST });
          return;
        }
      }
    }

    const result = await tryOnService.generateTryOn({
      garmentImage: input.garmentImage,
      humanImage: input.humanImage,
      category: input.category,
    });

    const latencyMs = Date.now() - startMs;

    if (userId && !isDeveloper) {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { creditsBalance: true } });
      const currentBalance = user ? Number(user.creditsBalance) : 0;
      const newBalance = Math.max(0, currentBalance - CREDIT_COST);

      await prisma.$transaction([
        prisma.user.update({
          where: { id: userId },
          data: { creditsBalance: new Prisma.Decimal(newBalance) },
        }),
        prisma.creditTransaction.create({
          data: {
            userId,
            amountInr: new Prisma.Decimal(-CREDIT_COST),
            type: "image_gen",
            description: `Virtual try-on (Gemini Flash)`,
            balanceAfter: new Prisma.Decimal(newBalance),
          },
        }),
        prisma.apiLog.create({
          data: { userId, type: "image", model: MODEL_KEY, latencyMs, status: "success" },
        }),
      ]).catch((err) => console.error("[Credits] TryOn: failed to deduct:", err));

      return res.json({ ...result, latencyMs, balanceAfter: newBalance });
    }

    if (userId && isDeveloper) {
      prisma.apiLog.create({
        data: { userId, type: "image", model: MODEL_KEY, latencyMs, status: "success" },
      }).catch(() => {});
    }

    res.json({ ...result, latencyMs });
  } catch (err: any) {
    const latencyMs = Date.now() - startMs;
    if (userId) {
      prisma.apiLog.create({
        data: {
          userId, type: "image", model: MODEL_KEY, latencyMs, status: "error",
          errorMessage: String(err?.message || err).slice(0, 500),
        },
      }).catch(() => {});
    }
    next(err);
  }
}
