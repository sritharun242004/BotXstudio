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

// Raw image proxy — supports Bearer token OR ?token= query param (for <img> tags)
async function authenticateFlexible(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const header = req.headers.authorization;
    const queryToken = req.query.token as string | undefined;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : queryToken;
    if (!token) return next(new UnauthorizedError("Missing authorization"));

    const payload = await verifier.verify(token);
    const dbUser = await findByCognitoSub(payload.sub);
    if (!dbUser) return next(new UnauthorizedError("User not found"));
    req.user = { userId: dbUser.id, email: dbUser.email };
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
