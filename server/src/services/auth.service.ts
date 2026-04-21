import { PrismaClient } from "@prisma/client";
import { hashPassword, verifyPassword } from "../utils/password.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  parseDuration,
} from "../utils/jwt.js";
import { ConflictError, UnauthorizedError } from "../utils/errors.js";
import { env } from "../config/env.js";
import crypto from "crypto";

const prisma = new PrismaClient();

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export async function register(name: string, email: string, password: string) {
  const normalizedEmail = email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    throw new ConflictError("Email already registered");
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { name: name.trim(), email: normalizedEmail, passwordHash },
  });

  const tokens = await createTokenPair(user.id, user.email);
  return { user: { id: user.id, email: user.email, name: user.name }, tokens };
}

export async function login(email: string, password: string) {
  const normalizedEmail = email.toLowerCase().trim();

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const tokens = await createTokenPair(user.id, user.email);
  return { user: { id: user.id, email: user.email, name: user.name }, tokens };
}

export async function refresh(refreshTokenValue: string) {
  let payload: { userId: string; tokenId: string };
  try {
    payload = verifyRefreshToken(refreshTokenValue);
  } catch {
    throw new UnauthorizedError("Invalid refresh token");
  }

  const storedToken = await prisma.refreshToken.findUnique({
    where: { id: payload.tokenId },
  });

  if (!storedToken || storedToken.revoked || storedToken.expiresAt < new Date()) {
    // If token exists but was already used, revoke all tokens for this user (token reuse detection)
    if (storedToken?.revoked) {
      await prisma.refreshToken.updateMany({
        where: { userId: storedToken.userId },
        data: { revoked: true },
      });
    }
    throw new UnauthorizedError("Invalid refresh token");
  }

  // Revoke old token
  await prisma.refreshToken.update({
    where: { id: storedToken.id },
    data: { revoked: true },
  });

  const user = await prisma.user.findUnique({ where: { id: storedToken.userId } });
  if (!user) {
    throw new UnauthorizedError("User not found");
  }

  const tokens = await createTokenPair(user.id, user.email);
  return { user: { id: user.id, email: user.email, name: user.name }, tokens };
}

export async function logout(refreshTokenValue: string) {
  try {
    const payload = verifyRefreshToken(refreshTokenValue);
    await prisma.refreshToken.update({
      where: { id: payload.tokenId },
      data: { revoked: true },
    });
  } catch {
    // Silently ignore invalid tokens on logout
  }
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, createdAt: true },
  });
  if (!user) {
    throw new UnauthorizedError("User not found");
  }
  return user;
}

async function createTokenPair(userId: string, email: string): Promise<AuthTokens> {
  const tokenId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + parseDuration(env.JWT_REFRESH_EXPIRY));

  const refreshToken = signRefreshToken({ userId, tokenId });

  await prisma.refreshToken.create({
    data: {
      id: tokenId,
      token: refreshToken,
      userId,
      expiresAt,
    },
  });

  const accessToken = signAccessToken({ userId, email });
  return { accessToken, refreshToken };
}
