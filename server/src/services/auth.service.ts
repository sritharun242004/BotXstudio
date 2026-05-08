import { UnauthorizedError } from "../utils/errors.js";
import { prisma } from "../lib/prisma.js";

// Free trial: 108 credits = 2 Flash mood boards (2 × 3 images × 18 credits)
const FREE_TRIAL_CREDITS = 108;

// Minimal select shared across all auth queries — never selects removed columns
const AUTH_SELECT = {
  id: true, email: true, name: true, cognitoSub: true, role: true, permissions: true,
} as const;

export async function findByCognitoSub(cognitoSub: string) {
  return prisma.user.findUnique({
    where: { cognitoSub },
    select: AUTH_SELECT,
  });
}

export async function findOrCreateUser(cognitoSub: string, email: string, name: string) {
  const normalizedEmail = email.toLowerCase().trim();

  // Try to find by cognitoSub first
  let found = await prisma.user.findUnique({ where: { cognitoSub }, select: AUTH_SELECT });
  if (found) {
    const updates: Record<string, string> = {};
    if ((!found.name || found.name === found.email) && name.trim()) updates.name = name.trim();
    if (!found.email && normalizedEmail) updates.email = normalizedEmail;
    if (Object.keys(updates).length > 0) {
      found = await prisma.user.update({ where: { id: found.id }, data: updates, select: AUTH_SELECT });
    }
    return { id: found.id, email: found.email, name: found.name, role: found.role };
  }

  // Try to find by email (existing user who hasn't linked Cognito yet)
  const byEmail = await prisma.user.findUnique({ where: { email: normalizedEmail }, select: AUTH_SELECT });
  if (byEmail) {
    const linked = await prisma.user.update({
      where: { id: byEmail.id },
      data: { cognitoSub },
      select: AUTH_SELECT,
    });
    return { id: linked.id, email: linked.email, name: linked.name, role: linked.role };
  }

  // Create new user with free trial credits
  const created = await prisma.user.create({
    data: {
      email: normalizedEmail,
      name: name.trim() || normalizedEmail,
      cognitoSub,
      credits: FREE_TRIAL_CREDITS,
      totalCreditsPurchased: FREE_TRIAL_CREDITS,
    },
    select: AUTH_SELECT,
  });

  prisma.creditTransaction.create({
    data: { userId: created.id, type: "grant", amount: FREE_TRIAL_CREDITS, note: "Free trial" },
  }).catch((err) => console.error("[Credits] Failed to log free trial grant:", err));

  return { id: created.id, email: created.email, name: created.name, role: created.role };
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });
  if (!user) throw new UnauthorizedError("User not found");
  return user;
}
