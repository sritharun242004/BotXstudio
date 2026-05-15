import type { Request, Response, NextFunction } from "express";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import { env } from "../config/env.js";
import { UnauthorizedError } from "../utils/errors.js";
import { findByCognitoSub, findOrCreateUser } from "../services/auth.service.js";

export type AccessTokenPayload = {
  userId: string;
  email: string;
};

declare global {
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
      cognitoSub?: string;
    }
  }
}

const verifier = CognitoJwtVerifier.create({
  userPoolId: env.COGNITO_USER_POOL_ID,
  tokenUse: "access",
  clientId: env.COGNITO_CLIENT_ID,
});

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      return next(new UnauthorizedError("Missing or invalid authorization header"));
    }

    const token = header.slice(7);
    const payload = await verifier.verify(token);
    const cognitoSub = payload.sub;

    // Always store cognitoSub for controllers that need it
    req.cognitoSub = cognitoSub;

    // Try to find existing user by Cognito sub
    const dbUser = await findByCognitoSub(cognitoSub);
    if (dbUser) {
      req.user = { userId: dbUser.id, email: dbUser.email };
      return next();
    }

    // New user — try email from access token (may be empty)
    const email = (payload as any).email ?? "";
    const name = (payload as any).name ?? "";

    if (email) {
      const newUser = await findOrCreateUser(cognitoSub, email, name);
      req.user = { userId: newUser.id, email: newUser.email };
    } else {
      // No email in access token and user not in DB yet —
      // controller (POST /me) will handle creation with body data
      req.user = { userId: "", email: "" };
    }
    next();
  } catch (err) {
    next(new UnauthorizedError("Invalid or expired access token"));
  }
}
