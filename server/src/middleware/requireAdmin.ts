import type { Request, Response, NextFunction } from "express";
import { ForbiddenError, UnauthorizedError } from "../utils/errors.js";

type Role = "SUPER_ADMIN" | "ADMIN" | "USER";

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user?.userId) return next(new UnauthorizedError("Not authenticated"));
    if (!roles.includes(req.user.role as Role)) {
      return next(new ForbiddenError("Insufficient role"));
    }
    next();
  };
}

export function requirePermission(permission: string) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user?.userId) return next(new UnauthorizedError("Not authenticated"));
    const role = req.user.role as Role;
    if (role === "SUPER_ADMIN") return next();
    if (role === "ADMIN") {
      const perms = req.user.permissions as Record<string, boolean> | null;
      if (perms?.[permission]) return next();
    }
    return next(new ForbiddenError(`Missing permission: ${permission}`));
  };
}
