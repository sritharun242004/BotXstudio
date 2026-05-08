import type { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";
import { BadRequestError } from "../utils/errors.js";

const API_KEY_CONFIG = "gemini_api_key";

function maskKey(key: string): string {
  if (key.length <= 8) return "••••••••";
  return key.slice(0, 4) + "••••••••••••" + key.slice(-4);
}

export async function getApiKey(req: Request, res: Response, next: NextFunction) {
  try {
    const config = await prisma.systemConfig.findUnique({ where: { key: API_KEY_CONFIG } });
    if (!config) return res.json({ hasKey: false, maskedKey: null });
    res.json({ hasKey: true, maskedKey: maskKey(config.value) });
  } catch (err) {
    next(err);
  }
}

export async function setApiKey(req: Request, res: Response, next: NextFunction) {
  try {
    const { apiKey } = req.body as { apiKey: string };
    if (!apiKey?.trim()) throw new BadRequestError("API key is required");

    await prisma.systemConfig.upsert({
      where: { key: API_KEY_CONFIG },
      create: { key: API_KEY_CONFIG, value: apiKey.trim() },
      update: { value: apiKey.trim() },
    });

    await prisma.adminLog.create({
      data: { adminId: req.user!.userId, action: "update_api_key" },
    }).catch(() => {});

    res.json({ ok: true, maskedKey: maskKey(apiKey.trim()) });
  } catch (err) {
    next(err);
  }
}

export async function testApiKey(req: Request, res: Response, next: NextFunction) {
  try {
    const config = await prisma.systemConfig.findUnique({ where: { key: API_KEY_CONFIG } });
    if (!config) return res.json({ ok: false, error: "No API key configured" });

    // Simple test: just validate format (starts with "AI")
    const valid = config.value.startsWith("AI") && config.value.length > 20;
    res.json({ ok: valid, error: valid ? null : "Key format appears invalid" });
  } catch (err) {
    next(err);
  }
}
