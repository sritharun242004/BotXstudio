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

// Fetch email from Cognito userInfo (reliable for Google/federated users)
async function fetchEmailFromCognito(accessToken: string): Promise<{ email: string; name: string }> {
  try {
    const url = `${env.COGNITO_DOMAIN}/oauth2/userInfo`;
    console.log("[Auth] Fetching email from Cognito userInfo:", url);
    const resp = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (resp.ok) {
      const data = (await resp.json()) as Record<string, string>;
      console.log("[Auth] userInfo returned:", JSON.stringify(data));
      return { email: data.email || "", name: data.name || "" };
    }
    const errBody = await resp.text();
    console.error("[Auth] userInfo failed:", resp.status, errBody);
  } catch (err) {
    console.error("[Auth] userInfo fetch error:", err);
  }
  return { email: "", name: "" };
}

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

    // 1. Try to find existing user by Cognito sub
    const dbUser = await findByCognitoSub(cognitoSub);
    if (dbUser) {
      req.user = { userId: dbUser.id, email: dbUser.email };
      return next();
    }

    // 2. New user — try email from access token
    let email = (payload as any).email ?? "";
    let name = (payload as any).name ?? "";

    // 3. If no email in access token, fetch from Cognito userInfo
    //    (this is the reliable path for Google/federated SSO users)
    if (!email) {
      console.log("[Auth] No email in access token for sub:", cognitoSub, "— fetching from userInfo");
      const userInfo = await fetchEmailFromCognito(token);
      email = userInfo.email;
      name = name || userInfo.name;
    }

    // 4. Create user if we have email
    if (email) {
      const newUser = await findOrCreateUser(cognitoSub, email, name || email);
      req.user = { userId: newUser.id, email: newUser.email };
    } else {
      // Still no email — let controller handle it with body data
      req.user = { userId: "", email: "" };
    }
    next();
  } catch (err) {
    console.error("[Auth] authenticate error:", err);
    next(new UnauthorizedError("Invalid or expired access token"));
  }
}
