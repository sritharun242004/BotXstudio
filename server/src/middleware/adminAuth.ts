import type { Request, Response, NextFunction } from "express";
import { ADMIN_EMAILS } from "../config/env.js";
import { UnauthorizedError, ForbiddenError } from "../utils/errors.js";

// Expects the `authenticate` middleware to have populated req.user. The admin
// allowlist (ADMIN_EMAILS env var) is the source of truth — there is no
// shared static secret anywhere.
export function adminAuth(req: Request, _res: Response, next: NextFunction): void {
  const email = (req.user?.email || "").toLowerCase();
  if (!email) {
    return next(new UnauthorizedError("Authentication required"));
  }
  if (!ADMIN_EMAILS.has(email)) {
    return next(new ForbiddenError("Admin access required"));
  }
  next();
}
