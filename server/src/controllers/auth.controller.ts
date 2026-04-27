import type { Request, Response, NextFunction } from "express";
import * as authService from "../services/auth.service.js";

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await authService.getMe(req.user!.userId);
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

export async function syncMe(req: Request, res: Response, next: NextFunction) {
  try {
    const cognitoSub = req.cognitoSub;
    if (!cognitoSub) {
      res.status(400).json({ error: "Missing user identity" });
      return;
    }

    const { email, name } = req.body;

    // findOrCreateUser handles: find by sub → update empty fields → or create new
    if (email) {
      const user = await authService.findOrCreateUser(cognitoSub, email, name || email);
      res.json({ user });
    } else if (req.user?.userId) {
      // No email from client but user exists — return current data
      const user = await authService.getMe(req.user.userId);
      res.json({ user });
    } else {
      res.status(400).json({ error: "Email is required for new users" });
    }
  } catch (err) {
    next(err);
  }
}

export async function logout(_req: Request, res: Response) {
  res.json({ ok: true });
}
