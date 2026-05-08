import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import * as controller from "../controllers/images.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import { uploadImageSchema, batchDeleteSchema } from "../validators/image.validators.js";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import { env } from "../config/env.js";
import { UnauthorizedError } from "../utils/errors.js";
import { findByCognitoSub } from "../services/auth.service.js";

export const imageRoutes = Router();

const verifier = CognitoJwtVerifier.create({
  userPoolId: env.COGNITO_USER_POOL_ID,
  tokenUse: "access",
  clientId: env.COGNITO_CLIENT_ID,
});

// In-memory JWT → userId cache with 4-minute TTL (Cognito tokens last 1h)
const jwtCache = new Map<string, { userId: string; email: string; role: string; expiresAt: number }>();
const JWT_CACHE_TTL_MS = 4 * 60 * 1000;

function pruneJwtCache() {
  const now = Date.now();
  for (const [k, v] of jwtCache) if (v.expiresAt < now) jwtCache.delete(k);
}
setInterval(pruneJwtCache, 60_000).unref();

// Raw image proxy — supports Bearer token OR ?token= query param (for <img> tags)
async function authenticateFlexible(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const header = req.headers.authorization;
    const queryToken = req.query.token as string | undefined;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : queryToken;
    if (!token) return next(new UnauthorizedError("Missing authorization"));

    const cached = jwtCache.get(token);
    if (cached && cached.expiresAt > Date.now()) {
      req.user = { userId: cached.userId, email: cached.email, role: cached.role as any, permissions: null };
      return next();
    }

    const payload = await verifier.verify(token);
    const dbUser = await findByCognitoSub(payload.sub);
    if (!dbUser) return next(new UnauthorizedError("User not found"));

    jwtCache.set(token, { userId: dbUser.id, email: dbUser.email, role: dbUser.role, expiresAt: Date.now() + JWT_CACHE_TTL_MS });

    req.user = {
      userId: dbUser.id,
      email: dbUser.email,
      role: (dbUser.role as any) ?? "USER",
      permissions: null,
    };
    next();
  } catch {
    next(new UnauthorizedError("Invalid or expired token"));
  }
}

imageRoutes.get("/:id/raw", authenticateFlexible, controller.getRaw);

// All other routes use standard Bearer auth
imageRoutes.use(authenticate);

imageRoutes.post("/", validate(uploadImageSchema), controller.upload);
imageRoutes.get("/", controller.list);
imageRoutes.get("/:id", controller.getById);
imageRoutes.delete("/:id", controller.remove);
imageRoutes.post("/batch-delete", validate(batchDeleteSchema), controller.batchDelete);
