import { PrismaClient } from "@prisma/client";
import { UnauthorizedError } from "../utils/errors.js";

const prisma = new PrismaClient();

export async function findOrCreateUser(cognitoSub: string, email: string, name: string) {
  const normalizedEmail = email.toLowerCase().trim();

  // Try to find by cognitoSub first
  let user = await prisma.user.findUnique({ where: { cognitoSub } });
  if (user) return { id: user.id, email: user.email, name: user.name };

  // Try to find by email (existing user who hasn't linked Cognito yet)
  user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (user) {
    // Link the Cognito sub to the existing user
    user = await prisma.user.update({
      where: { id: user.id },
      data: { cognitoSub },
    });
    return { id: user.id, email: user.email, name: user.name };
  }

  // Create new user
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
