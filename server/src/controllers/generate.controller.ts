import type { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import * as geminiService from "../services/gemini.service.js";
import type { GeneratePlanInput, GenerateImageInput } from "../validators/generate.validators.js";

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

    res.json({
      ...result,
      latencyMs,
    });
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

    if (userId) {
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
      }).catch((err) => console.error("[ApiLog] Failed to save:", err));
    }

    res.json({
      ...result,
      latencyMs,
    });
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
