import type { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";

// Gemini pricing (USD per 1k tokens — approximate)
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  default: { input: 0.000075, output: 0.0003 },
};

function getPrice(model: string) {
  if (model.includes("flash")) return { input: 0.000075, output: 0.0003 };
  if (model.includes("pro")) return { input: 0.00125, output: 0.005 };
  return MODEL_PRICING.default;
}

function calcCost(promptTokens: number, outputTokens: number, model: string) {
  const p = getPrice(model);
  return (promptTokens / 1000) * p.input + (outputTokens / 1000) * p.output;
}

export async function getCosts(req: Request, res: Response, next: NextFunction) {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const allLogs = await prisma.apiLog.findMany({
      select: {
        model: true,
        promptTokens: true,
        outputTokens: true,
        userId: true,
        createdAt: true,
        user: { select: { email: true } },
      },
    });

    // Total cost
    const totalCost = allLogs.reduce(
      (sum, l) => sum + calcCost(l.promptTokens, l.outputTokens, l.model),
      0
    );

    // Cost per model
    const byModel: Record<string, number> = {};
    for (const l of allLogs) {
      const key = l.model.includes("flash") ? "Flash" : "Pro";
      byModel[key] = (byModel[key] ?? 0) + calcCost(l.promptTokens, l.outputTokens, l.model);
    }

    // Cost per user (top 20)
    const byUser: Record<string, { email: string; cost: number }> = {};
    for (const l of allLogs) {
      if (!byUser[l.userId]) byUser[l.userId] = { email: l.user.email, cost: 0 };
      byUser[l.userId].cost += calcCost(l.promptTokens, l.outputTokens, l.model);
    }
    const topUsers = Object.entries(byUser)
      .map(([id, v]) => ({ userId: id, email: v.email, cost: Math.round(v.cost * 10000) / 10000 }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 20);

    // Daily cost (last 30 days)
    const recentLogs = allLogs.filter((l) => l.createdAt >= thirtyDaysAgo);
    const dailyCost: Record<string, number> = {};
    for (const l of recentLogs) {
      const day = l.createdAt.toISOString().split("T")[0];
      dailyCost[day] = (dailyCost[day] ?? 0) + calcCost(l.promptTokens, l.outputTokens, l.model);
    }
    const dailyData = Object.entries(dailyCost)
      .map(([date, cost]) => ({ date, cost: Math.round(cost * 10000) / 10000 }))
      .sort((a, b) => a.date.localeCompare(b.date));

    res.json({
      totalCost: Math.round(totalCost * 10000) / 10000,
      byModel: Object.entries(byModel).map(([model, cost]) => ({
        model,
        cost: Math.round(cost * 10000) / 10000,
      })),
      topUsers,
      dailyData,
    });
  } catch (err) {
    next(err);
  }
}
