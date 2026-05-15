import type { Request, Response, NextFunction } from "express";
import * as authService from "../services/auth.service.js";
import { env } from "../config/env.js";

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await authService.getMe(req.user!.userId);
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

// Fetch user email from Cognito userInfo endpoint (works for federated/Google users)
async function fetchCognitoUserInfo(accessToken: string): Promise<{ email?: string; name?: string }> {
  const url = `${env.COGNITO_DOMAIN}/oauth2/userInfo`;
  try {
    console.log("[Auth] Fetching userInfo from:", url);
    const resp = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const body = await resp.text();
    console.log("[Auth] userInfo response:", resp.status, body);
    if (resp.ok) return JSON.parse(body) as { email?: string; name?: string };
  } catch (err) {
    console.error("[Auth] userInfo fetch error:", err);
  }
  return {};
}

export async function syncMe(req: Request, res: Response, next: NextFunction) {
  try {
    const cognitoSub = req.cognitoSub;
    if (!cognitoSub) {
      res.status(400).json({ error: "Missing user identity" });
      return;
    }

    let { email, name } = req.body;
    console.log("[Auth] syncMe called — body email:", JSON.stringify(email), "name:", JSON.stringify(name), "cognitoSub:", cognitoSub, "userId:", req.user?.userId);

    // If client didn't provide email (common with Google SSO),
    // fetch it server-side from Cognito userInfo endpoint
    if (!email) {
      const rawToken = req.headers.authorization?.slice(7);
      if (rawToken) {
        const userInfo = await fetchCognitoUserInfo(rawToken);
        email = userInfo.email || "";
        name = name || userInfo.name || "";
      }
    }

    // findOrCreateUser handles: find by sub → update empty fields → or create new
    if (email) {
      const user = await authService.findOrCreateUser(cognitoSub, email, name || email);
      res.json({ user });
    } else if (req.user?.userId) {
      // No email from client but user exists — return current data
      const user = await authService.getMe(req.user.userId);
      res.json({ user });
    } else {
      // Google SSO users: Cognito attribute mapping may not include email.
      // Return a flag so the frontend can collect it from the user.
      res.json({ needsEmail: true });
    }
  } catch (err) {
    next(err);
  }
}

export async function logout(_req: Request, res: Response) {
  res.json({ ok: true });
}
