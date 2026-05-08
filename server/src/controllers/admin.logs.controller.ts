import type { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";

export async function getApiLogs(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, model, status, dateFrom, dateTo, page = "1", limit = "50" } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where: any = {};
    if (userId) where.userId = userId;
    if (model) where.model = { contains: model, mode: "insensitive" };
    if (status) where.status = status;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const [logs, total] = await Promise.all([
      prisma.apiLog.findMany({
        where,
        include: { user: { select: { email: true, name: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take: parseInt(limit),
      }),
      prisma.apiLog.count({ where }),
    ]);

    res.json({ logs, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    next(err);
  }
}

export async function getSystemLogs(req: Request, res: Response, next: NextFunction) {
  try {
    const { page = "1", limit = "50" } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [logs, total] = await Promise.all([
      prisma.apiLog.findMany({
        where: { status: "error" },
        include: { user: { select: { email: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take: parseInt(limit),
      }),
      prisma.apiLog.count({ where: { status: "error" } }),
    ]);

    const adminLogs = await prisma.adminLog.findMany({
      include: { admin: { select: { email: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    res.json({ errorLogs: logs, adminLogs, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    next(err);
  }
}
