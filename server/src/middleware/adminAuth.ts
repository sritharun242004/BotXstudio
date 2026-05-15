import type { Request, Response, NextFunction } from "express";
import { env } from "../config/env.js";
import { UnauthorizedError } from "../utils/errors.js";

export function adminAuth(req: Request, _res: Response, next: NextFunction): void {
  const secret = req.headers["x-admin-secret"];
  if (!secret || secret !== env.ADMIN_SECRET) {
    return next(new UnauthorizedError("Admin access required"));
  }
  next();
}
