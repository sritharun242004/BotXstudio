import type { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";

export async function getSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const configs = await prisma.systemConfig.findMany({ orderBy: { key: "asc" } });
    const settings: Record<string, string> = {};
    for (const c of configs) {
      if (c.key !== "gemini_api_key") settings[c.key] = c.value;
    }
    res.json({ settings });
  } catch (err) {
    next(err);
  }
}

export async function updateSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const updates = req.body as Record<string, string>;
    const forbidden = ["gemini_api_key"];

    for (const [key, value] of Object.entries(updates)) {
      if (forbidden.includes(key)) continue;
      await prisma.systemConfig.upsert({
        where: { key },
        create: { key, value: String(value) },
        update: { value: String(value) },
      });
    }

    await prisma.adminLog.create({
      data: { adminId: req.user!.userId, action: "update_settings", details: updates },
    }).catch(() => {});

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

export async function getImageControl(req: Request, res: Response, next: NextFunction) {
  try {
    const keys = ["default_model", "flash_enabled", "pro_enabled", "max_generations_per_day", "rate_limit_per_minute", "feature_prints", "feature_multiangle", "feature_saree"];
    const configs = await prisma.systemConfig.findMany({ where: { key: { in: keys } } });
    const settings: Record<string, string> = {};
    for (const c of configs) settings[c.key] = c.value;
    res.json({ settings });
  } catch (err) {
    next(err);
  }
}

export async function updateImageControl(req: Request, res: Response, next: NextFunction) {
  try {
    const updates = req.body as Record<string, string>;
    for (const [key, value] of Object.entries(updates)) {
      await prisma.systemConfig.upsert({
        where: { key },
        create: { key, value: String(value) },
        update: { value: String(value) },
      });
    }
    await prisma.adminLog.create({
      data: { adminId: req.user!.userId, action: "update_image_control", details: updates },
    }).catch(() => {});
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}
