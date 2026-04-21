import type { Request, Response, NextFunction } from "express";
import * as authService from "../services/auth.service.js";
import { env } from "../config/env.js";
import { parseDuration } from "../utils/jwt.js";
import type { RegisterInput, LoginInput } from "../validators/auth.validators.js";

const REFRESH_COOKIE = "refresh_token";

function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: env.NODE_ENV === "production" ? "strict" : "lax",
    maxAge: parseDuration(env.JWT_REFRESH_EXPIRY),
    path: "/api/auth",
  });
}

function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE, { path: "/api/auth" });
}

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, email, password } = req.body as RegisterInput;
    const result = await authService.register(name, email, password);
    setRefreshCookie(res, result.tokens.refreshToken);
    res.status(201).json({
      user: result.user,
      accessToken: result.tokens.accessToken,
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body as LoginInput;
    const result = await authService.login(email, password);
    setRefreshCookie(res, result.tokens.refreshToken);
    res.json({
      user: result.user,
      accessToken: result.tokens.accessToken,
    });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[REFRESH_COOKIE];
    if (!token) {
      res.status(401).json({ error: "No refresh token" });
      return;
    }
    const result = await authService.refresh(token);
    setRefreshCookie(res, result.tokens.refreshToken);
    res.json({
      user: result.user,
      accessToken: result.tokens.accessToken,
    });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[REFRESH_COOKIE];
    if (token) {
      await authService.logout(token);
    }
    clearRefreshCookie(res);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await authService.getMe(req.user!.userId);
    res.json({ user });
  } catch (err) {
    next(err);
  }
}
