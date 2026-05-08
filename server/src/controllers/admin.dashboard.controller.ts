import type { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";

export async function getDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalImages,
      apiCallsToday,
      activeUsersResult,
      tokensToday,
      modelUsage,
      dailyCalls,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.image.count(),
      prisma.apiLog.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.apiLog.groupBy({
        by: ["userId"],
        where: { createdAt: { gte: thirtyDaysAgo } },
        _count: true,
      }),
      prisma.apiLog.aggregate({
        where: { createdAt: { gte: todayStart } },
        _sum: { totalTokens: true, promptTokens: true, outputTokens: true },
      }),
      prisma.apiLog.groupBy({
        by: ["model"],
        _count: { id: true },
        _sum: { totalTokens: true },
        orderBy: { _count: { id: "desc" } },
      }),
      prisma.$queryRaw<{ date: string; calls: bigint; tokens: bigint }[]>`
        SELECT DATE("created_at")::text as date,
               COUNT(*)::bigint as calls,
               COALESCE(SUM("total_tokens"), 0)::bigint as tokens
        FROM api_logs
        WHERE "created_at" >= ${thirtyDaysAgo}
        GROUP BY DATE("created_at")
        ORDER BY date DESC
        LIMIT 30
      `,
    ]);

    // Rough cost estimate: $0.0001 per 1k input tokens, $0.0004 per 1k output tokens
    const totalCostUsd = await prisma.apiLog.aggregate({
      _sum: { promptTokens: true, outputTokens: true },
    });
    const estimatedCost =
      ((totalCostUsd._sum.promptTokens ?? 0) / 1000) * 0.0001 +
      ((totalCostUsd._sum.outputTokens ?? 0) / 1000) * 0.0004;

    res.json({
      stats: {
        totalUsers,
        activeUsers: activeUsersResult.length,
        totalImages,
        apiCallsToday,
        tokensToday: {
          prompt: tokensToday._sum.promptTokens ?? 0,
          output: tokensToday._sum.outputTokens ?? 0,
          total: tokensToday._sum.totalTokens ?? 0,
        },
        estimatedCostUsd: Math.round(estimatedCost * 100) / 100,
      },
      modelUsage: modelUsage.map((m) => ({
        model: m.model,
        calls: m._count.id,
        tokens: m._sum.totalTokens ?? 0,
      })),
      dailyCalls: dailyCalls.map((d) => ({
        date: d.date,
        calls: Number(d.calls),
        tokens: Number(d.tokens),
      })),
    });
  } catch (err) {
    next(err);
  }
}
