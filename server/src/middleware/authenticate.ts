import type { Request, Response, NextFunction } from "express";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import { env } from "../config/env.js";
import { UnauthorizedError } from "../utils/errors.js";
import { findOrCreateUser } from "../services/auth.service.js";

export type AccessTokenPayload = {
  userId: string;
  email: string;
};

declare global {
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
    }
  }
}

const verifier = CognitoJwtVerifier.create({
  userPoolId: env.COGNITO_USER_POOL_ID,
  tokenUse: "access",
  clientId: env.COGNITO_CLIENT_ID,
});

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw new UnauthorizedError("Missing or invalid authorization header");
  }

  const token = header.slice(7);
  try {
    const payload = await verifier.verify(token);
    const cognitoSub = payload.sub;
    const email = (payload as any).email ?? "";
    const name = (payload as any).name ?? "";

    // Resolve Cognito sub → DB user ID so all downstream controllers work
    const dbUser = await findOrCreateUser(cognitoSub, email, name);
    req.user = { userId: dbUser.id, email: dbUser.email };
    next();
  } catch {
    throw new UnauthorizedError("Invalid or expired access token");
  }
}
