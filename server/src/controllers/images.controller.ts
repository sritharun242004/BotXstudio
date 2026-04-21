import type { Request, Response, NextFunction } from "express";
import * as imageService from "../services/image.service.js";

export async function upload(req: Request, res: Response, next: NextFunction) {
  try {
    const image = await imageService.upload(req.user!.userId, req.body);
    res.status(201).json(image);
  } catch (err) {
    next(err);
  }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const kind = req.query.kind as string | undefined;
    const storyboardId = req.query.storyboardId as string | undefined;
    const images = await imageService.list(req.user!.userId, { kind, storyboardId });
    res.json({ images });
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const image = await imageService.getById(req.user!.userId, req.params.id as string);
    res.json(image);
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await imageService.remove(req.user!.userId, req.params.id as string);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

export async function batchDelete(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await imageService.batchDelete(req.user!.userId, req.body.ids);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
