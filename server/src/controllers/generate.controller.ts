import type { Request, Response, NextFunction } from "express";
import * as geminiService from "../services/gemini.service.js";
import type { GeneratePlanInput, GenerateImageInput } from "../validators/generate.validators.js";

export async function plan(req: Request, res: Response, next: NextFunction) {
  try {
    const input = req.body as GeneratePlanInput;
    const result = await geminiService.generateText({
      model: input.model,
      promptText: input.promptText,
      images: input.images,
      temperature: input.temperature,
      maxOutputTokens: input.maxOutputTokens,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function image(req: Request, res: Response, next: NextFunction) {
  try {
    const input = req.body as GenerateImageInput;
    const result = await geminiService.generateImage({
      model: input.model,
      promptText: input.promptText,
      images: input.images,
      temperature: input.temperature,
      aspectRatio: input.aspectRatio,
      width: input.width,
      height: input.height,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}
