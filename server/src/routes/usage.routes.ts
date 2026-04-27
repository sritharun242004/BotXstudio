import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate } from "../middleware/authenticate.js";

const prisma = new PrismaClient();
export const usageRoutes = Router();

usageRoutes.get("/", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;

    const [
      totalStoryboards,
      totalImages,
      totalAssets,
      imageStorage,
      assetStorage,
      user,
      recentImages,
    ] = await Promise.all([
      prisma.storyboard.count({ where: { userId } }),
      prisma.image.count({ where: { userId } }),
      prisma.asset.count({ where: { userId } }),
      prisma.image.aggregate({ where: { userId }, _sum: { fileSizeBytes: true } }),
      prisma.asset.aggregate({ where: { userId }, _sum: { fileSizeBytes: true } }),
      prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true, createdAt: true } }),
      prisma.image.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 30,
        select: { createdAt: true },
      }),
    ]);

    // Count images generated per day (last 30 days)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const dailyCounts: Record<string, number> = {};
    for (const img of recentImages) {
      if (img.createdAt >= thirtyDaysAgo) {
        const day = img.createdAt.toISOString().slice(0, 10);
        dailyCounts[day] = (dailyCounts[day] || 0) + 1;
      }
    }

    res.json({
      user: user ? { email: user.email, name: user.name, memberSince: user.createdAt } : null,
      storyboards: totalStoryboards,
      images: totalImages,
      assets: totalAssets,
      storageBytes: (imageStorage._sum.fileSizeBytes || 0) + (assetStorage._sum.fileSizeBytes || 0),
      dailyImageCounts: dailyCounts,
    });
  } catch (err) {
    next(err);
  }
});
