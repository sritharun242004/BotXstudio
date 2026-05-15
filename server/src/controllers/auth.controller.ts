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
  try {
    const resp = await fetch(`${env.COGNITO_DOMAIN}/oauth2/userInfo`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (resp.ok) return (await resp.json()) as { email?: string; name?: string };
  } catch { /* ignore */ }
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
      res.status(400).json({ error: "Email is required for new users" });
    }
  } catch (err) {
    next(err);
  }
}

export async function logout(_req: Request, res: Response) {
  res.json({ ok: true });
}
