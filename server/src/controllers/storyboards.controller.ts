import type { Request, Response, NextFunction } from "express";
import * as storyboardService from "../services/storyboard.service.js";

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const sb = await storyboardService.create(req.user!.userId, req.body);
    res.status(201).json(sb);
  } catch (err) {
    next(err);
  }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const storyboards = await storyboardService.list(req.user!.userId);
    res.json({ storyboards });
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const sb = await storyboardService.getById(req.user!.userId, req.params.id as string);
    res.json(sb);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const sb = await storyboardService.update(req.user!.userId, req.params.id as string, req.body);
    res.json(sb);
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await storyboardService.remove(req.user!.userId, req.params.id as string);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

export async function duplicate(req: Request, res: Response, next: NextFunction) {
  try {
    const sb = await storyboardService.duplicate(req.user!.userId, req.params.id as string);
    res.status(201).json(sb);
  } catch (err) {
    next(err);
  }
}

export async function setActive(req: Request, res: Response, next: NextFunction) {
  try {
    const sb = await storyboardService.setActive(req.user!.userId, req.params.id as string);
    res.json(sb);
  } catch (err) {
    next(err);
  }
}
