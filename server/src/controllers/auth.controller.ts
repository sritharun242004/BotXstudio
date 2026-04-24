import type { Request, Response, NextFunction } from "express";
import * as authService from "../services/auth.service.js";

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    // req.user.userId is the DB user id (resolved by authenticate middleware)
    const user = await authService.getMe(req.user!.userId);
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

export async function logout(_req: Request, res: Response) {
  res.json({ ok: true });
}
