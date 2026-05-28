import type { Request, Response, NextFunction, CookieOptions } from "express";
import * as authService from "../services/auth.service.js";
import { env } from "../config/env.js";

// ─── HttpOnly refresh-token cookie ───────────────────────────────────────────
// The Cognito refresh token used to live in localStorage (XSS-exfiltratable
// for ~30 days). It now lives in this server-set cookie: HttpOnly so JS
// cannot read it, scoped to /api/auth/cognito so it's only sent when needed.

const REFRESH_COOKIE = "bsx_refresh";
const REFRESH_COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

function refreshCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth/cognito",
    maxAge: REFRESH_COOKIE_MAX_AGE_MS,
  };
}

interface CognitoTokenResponse {
  access_token: string;
  id_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type?: string;
}

async function callCognitoToken(body: URLSearchParams): Promise<CognitoTokenResponse | null> {
  const resp = await fetch(`${env.COGNITO_DOMAIN}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!resp.ok) return null;
  return (await resp.json()) as CognitoTokenResponse;
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await authService.getMe(req.user!.userId);
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

// Fetch user email from Cognito userInfo endpoint (works for federated/Google users).
// Intentionally avoids logging the response body since it contains PII (email, sub).
async function fetchCognitoUserInfo(accessToken: string): Promise<{ email?: string; name?: string }> {
  const url = `${env.COGNITO_DOMAIN}/oauth2/userInfo`;
  try {
    const resp = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (resp.ok) return (await resp.json()) as { email?: string; name?: string };
  } catch {
    // ignore — caller treats missing email as needsEmail
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

// ─── Cognito proxy endpoints ─────────────────────────────────────────────────

/**
 * POST /api/auth/cognito/exchange
 * Body: { code: string, codeVerifier: string, redirectUri: string }
 *
 * Exchanges a Cognito authorization code for tokens. Sets the refresh token
 * as an HttpOnly cookie (so JS / XSS can't read it) and returns the
 * short-lived access + id tokens to the client.
 */
export async function cognitoExchange(req: Request, res: Response, next: NextFunction) {
  try {
    const { code, codeVerifier, redirectUri } = req.body as { code?: string; codeVerifier?: string; redirectUri?: string };
    if (!code || !codeVerifier || !redirectUri) {
      res.status(400).json({ error: "Missing code, codeVerifier, or redirectUri" });
      return;
    }
    const tokens = await callCognitoToken(new URLSearchParams({
      grant_type: "authorization_code",
      client_id: env.COGNITO_CLIENT_ID,
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }));
    if (!tokens || !tokens.refresh_token) {
      res.status(401).json({ error: "Token exchange failed" });
      return;
    }
    res.cookie(REFRESH_COOKIE, tokens.refresh_token, refreshCookieOptions());
    res.json({
      accessToken: tokens.access_token,
      idToken: tokens.id_token,
      expiresIn: tokens.expires_in,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/cognito/refresh
 *
 * Reads the bsx_refresh cookie, calls Cognito's refresh grant, and returns
 * a new access + id token. If Cognito rotates the refresh token (depends on
 * pool config), updates the cookie.
 */
export async function cognitoRefresh(req: Request, res: Response, next: NextFunction) {
  try {
    const refreshToken = (req.cookies as Record<string, string> | undefined)?.[REFRESH_COOKIE];
    if (!refreshToken) {
      res.status(401).json({ error: "No refresh token" });
      return;
    }
    const tokens = await callCognitoToken(new URLSearchParams({
      grant_type: "refresh_token",
      client_id: env.COGNITO_CLIENT_ID,
      refresh_token: refreshToken,
    }));
    if (!tokens) {
      res.clearCookie(REFRESH_COOKIE, { path: "/api/auth/cognito" });
      res.status(401).json({ error: "Refresh failed" });
      return;
    }
    if (tokens.refresh_token && tokens.refresh_token !== refreshToken) {
      res.cookie(REFRESH_COOKIE, tokens.refresh_token, refreshCookieOptions());
    }
    res.json({
      accessToken: tokens.access_token,
      idToken: tokens.id_token,
      expiresIn: tokens.expires_in,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/cognito/logout
 * Clears the refresh cookie. Frontend still calls the Cognito Hosted UI
 * logout URL after this to terminate the SSO session.
 */
export async function cognitoLogout(_req: Request, res: Response) {
  res.clearCookie(REFRESH_COOKIE, { path: "/api/auth/cognito" });
  res.json({ ok: true });
}
