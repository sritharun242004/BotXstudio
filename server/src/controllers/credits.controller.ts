import type { Request, Response, NextFunction } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import { env, DEVELOPER_EMAILS } from "../config/env.js";
import {
  FREE_IMAGE_QUOTA,
  getAllModelPricing,
  setModelCredits,
  API_COSTS_INR,
  CREDIT_PRICES_DEFAULT,
} from "../services/pricing.service.js";

const prisma = new PrismaClient();

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getOrCreateConfig() {
  return prisma.creditConfig.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton", perImageCostInr: new Prisma.Decimal(10.00) },
  });
}

// ─── Public / user endpoints ──────────────────────────────────────────────────

export async function getConfig(_req: Request, res: Response, next: NextFunction) {
  try {
    const config = await getOrCreateConfig();
    res.json({ perImageCostInr: Number(config.perImageCostInr) });
  } catch (err) {
    next(err);
  }
}

export async function getBalance(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    const [user, spentAgg] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { creditsBalance: true, freeImagesUsed: true, email: true },
      }),
      prisma.creditTransaction.aggregate({
        where: { userId, amountInr: { lt: 0 } },
        _sum: { amountInr: true },
      }),
    ]);
    const freeUsed = user?.freeImagesUsed ?? 0;
    const isDeveloper = DEVELOPER_EMAILS.has((user?.email || "").toLowerCase());
    const creditsSpent = Math.floor(Math.abs(Number(spentAgg._sum.amountInr ?? 0)));
    res.json({
      balance: user ? Number(user.creditsBalance) : 0,
      freeImagesUsed: freeUsed,
      freeImagesRemaining: Math.max(0, FREE_IMAGE_QUOTA - freeUsed),
      creditsSpent,
      isDeveloper,
    });
  } catch (err) {
    next(err);
  }
}

export async function getTransactions(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    const transactions = await prisma.creditTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    res.json(transactions.map(t => ({
      id: t.id,
      amountInr: Number(t.amountInr),
      type: t.type,
      description: t.description,
      balanceAfter: Number(t.balanceAfter),
      createdAt: t.createdAt,
    })));
  } catch (err) {
    next(err);
  }
}

// ─── Admin endpoints ──────────────────────────────────────────────────────────

export async function adminGetConfig(_req: Request, res: Response, next: NextFunction) {
  try {
    const config = await getOrCreateConfig();
    res.json({ perImageCostInr: Number(config.perImageCostInr) });
  } catch (err) {
    next(err);
  }
}

export async function adminUpdateConfig(req: Request, res: Response, next: NextFunction) {
  try {
    const { perImageCostInr } = req.body as { perImageCostInr: number };
    if (typeof perImageCostInr !== "number" || perImageCostInr < 0) {
      res.status(400).json({ error: "perImageCostInr must be a non-negative number" });
      return;
    }
    const config = await prisma.creditConfig.upsert({
      where: { id: "singleton" },
      update: { perImageCostInr: new Prisma.Decimal(perImageCostInr) },
      create: { id: "singleton", perImageCostInr: new Prisma.Decimal(perImageCostInr) },
    });
    res.json({ perImageCostInr: Number(config.perImageCostInr) });
  } catch (err) {
    next(err);
  }
}

export async function adminGetUsers(_req: Request, res: Response, next: NextFunction) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        creditsBalance: true,
        createdAt: true,
        _count: { select: { images: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      creditsBalance: Number(u.creditsBalance),
      imagesGenerated: u._count.images,
      joinedAt: u.createdAt,
      isDeveloper: DEVELOPER_EMAILS.has((u.email || "").toLowerCase()),
    })));
  } catch (err) {
    next(err);
  }
}

// ─── Self-service refill (any authenticated user, only when balance is 0) ──────

const SELF_TOPUP_AMOUNT = 10_000;

export async function selfTopUp(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { creditsBalance: true, email: true },
    });

    if (!user || !DEVELOPER_EMAILS.has((user.email || "").toLowerCase())) {
      res.status(403).json({ error: "Self-refill is not available. Contact admin to top up your balance." });
      return;
    }

    const currentBalance = Number(user.creditsBalance);

    if (currentBalance > 0) {
      res.status(400).json({ error: "Balance is not zero. Refill is only available when your credits are depleted." });
      return;
    }

    const newBalance = SELF_TOPUP_AMOUNT;

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { creditsBalance: new Prisma.Decimal(newBalance) },
      }),
      prisma.creditTransaction.create({
        data: {
          userId,
          amountInr: new Prisma.Decimal(SELF_TOPUP_AMOUNT),
          type: "self_refill",
          description: `Self-service credit refill (₹${SELF_TOPUP_AMOUNT})`,
          balanceAfter: new Prisma.Decimal(newBalance),
        },
      }),
    ]);

    res.json({ balance: newBalance, message: `₹${SELF_TOPUP_AMOUNT} credits added to your account.` });
  } catch (err) {
    next(err);
  }
}

export async function adminTopUpUser(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const { amountInr, description } = req.body as { amountInr: number; description?: string };
    // adminEmail is guaranteed present by the new adminAuth middleware
    // (authenticate → adminAuth check req.user.email in ADMIN_EMAILS).
    const adminEmail = req.user?.email || "unknown-admin";

    if (typeof amountInr !== "number" || amountInr === 0) {
      res.status(400).json({ error: "amountInr must be a non-zero number" });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id }, select: { creditsBalance: true } });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const currentBalance = Number(user.creditsBalance);
    const newBalance = Math.max(0, currentBalance + amountInr);

    const action = amountInr > 0 ? "top-up" : "deduction";
    const auditDescription = description
      ? `${description} (by ${adminEmail})`
      : `Admin credit ${action} by ${adminEmail}`;

    const [updatedUser] = await prisma.$transaction([
      prisma.user.update({
        where: { id },
        data: { creditsBalance: new Prisma.Decimal(newBalance) },
        select: { id: true, name: true, email: true, creditsBalance: true },
      }),
      prisma.creditTransaction.create({
        data: {
          userId: id,
          amountInr: new Prisma.Decimal(amountInr),
          type: "admin_top_up",
          description: auditDescription,
          balanceAfter: new Prisma.Decimal(newBalance),
        },
      }),
    ]);

    res.json({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      creditsBalance: Number(updatedUser.creditsBalance),
    });
  } catch (err) {
    next(err);
  }
}

export async function adminDeleteUser(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const user = await prisma.user.findUnique({ where: { id }, select: { id: true, email: true } });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    // Cascade deletes storyboards, images, assets, apiLogs, creditTransactions, userAffiliations
    await prisma.user.delete({ where: { id } });
    res.json({ success: true, deletedEmail: user.email });
  } catch (err) {
    next(err);
  }
}

// ─── Model pricing endpoints ──────────────────────────────────────────────────

export async function adminGetModelPricing(_req: Request, res: Response, next: NextFunction) {
  try {
    const pricing = await getAllModelPricing();
    // Return as array with API costs for the admin table
    const rows = Object.entries(pricing).map(([modelKey, credits]) => ({
      modelKey,
      credits,
      apiCostInr: API_COSTS_INR[modelKey] ?? 0,
      defaultCredits: CREDIT_PRICES_DEFAULT[modelKey] ?? credits,
    }));
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

export async function adminUpdateModelPricing(req: Request, res: Response, next: NextFunction) {
  try {
    const updates = req.body as { modelKey: string; credits: number }[];
    if (!Array.isArray(updates) || updates.some(u => typeof u.modelKey !== "string" || typeof u.credits !== "number" || u.credits < 1)) {
      res.status(400).json({ error: "Body must be an array of { modelKey, credits } with credits >= 1" });
      return;
    }
    await Promise.all(updates.map(u => setModelCredits(u.modelKey, Math.round(u.credits))));
    const pricing = await getAllModelPricing();
    res.json(Object.entries(pricing).map(([modelKey, credits]) => ({
      modelKey,
      credits,
      apiCostInr: API_COSTS_INR[modelKey] ?? 0,
      defaultCredits: CREDIT_PRICES_DEFAULT[modelKey] ?? credits,
    })));
  } catch (err) {
    next(err);
  }
}

// Public endpoint — frontend reads live credit prices for display
export async function getModelPricing(_req: Request, res: Response, next: NextFunction) {
  try {
    const pricing = await getAllModelPricing();
    // Pricing changes are rare (admin-driven). Allow 60 s of browser/CDN
    // caching to soak up the per-mount fetch the frontend does on every
    // CreditsProvider load.
    res.set("Cache-Control", "public, max-age=60");
    res.json(pricing);
  } catch (err) {
    next(err);
  }
}
