import { PrismaClient } from "@prisma/client";
import { UnauthorizedError } from "../utils/errors.js";

const prisma = new PrismaClient();

export async function findByCognitoSub(cognitoSub: string) {
  return prisma.user.findUnique({
    where: { cognitoSub },
    select: { id: true, email: true, name: true },
  });
}

export async function findOrCreateUser(cognitoSub: string, email: string, name: string) {
  const normalizedEmail = email.toLowerCase().trim();

  // Try to find by cognitoSub first
  let user = await prisma.user.findUnique({ where: { cognitoSub } });
  if (user) {
    // Update name/email if they were previously empty
    const updates: Record<string, string> = {};
    if ((!user.name || user.name === user.email) && name.trim()) updates.name = name.trim();
    if (!user.email && normalizedEmail) updates.email = normalizedEmail;
    if (Object.keys(updates).length > 0) {
      user = await prisma.user.update({ where: { id: user.id }, data: updates });
    }
    return { id: user.id, email: user.email, name: user.name };
  }

  // Existing user with this email but a DIFFERENT cognitoSub?
  // Previously we silently overwrote cognitoSub, which made the existing
  // account claimable by any Cognito identity that can present a token with
  // that email (e.g. an SSO IdP that does not enforce email verification).
  // Refuse to auto-link — the user must reconcile manually.
  const existingByEmail = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existingByEmail) {
    if (existingByEmail.cognitoSub && existingByEmail.cognitoSub !== cognitoSub) {
      throw new UnauthorizedError(
        "This email is already linked to a different sign-in method. Please sign in the way you originally signed up, or contact support.",
      );
    }
    // No cognitoSub yet — first link for a legacy/imported user is safe.
    const linked = await prisma.user.update({
      where: { id: existingByEmail.id },
      data: { cognitoSub },
    });
    return { id: linked.id, email: linked.email, name: linked.name };
  }

  // Create new user — starts with zero credits
  user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      name: name.trim() || normalizedEmail,
      cognitoSub,
    },
  });

  return { id: user.id, email: user.email, name: user.name };
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
