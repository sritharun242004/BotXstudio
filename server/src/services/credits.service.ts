import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Atomically deducts `cost` credits from the user's balance IFF the balance
// is sufficient. Returns true on success, false if balance was insufficient
// (or a concurrent request won the race for the last credits).
//
// This replaces the unsafe check-then-decrement pattern: two concurrent
// requests with balance=5 and cost=5 could previously both pass the check,
// both call paid AI APIs, and both clamp the balance to 0. With this helper,
// only one of them succeeds — the second sees an updateMany count of 0.
export async function reserveCredits(userId: string, cost: number): Promise<boolean> {
  if (cost <= 0) return true;
  const result = await prisma.user.updateMany({
    where: { id: userId, creditsBalance: { gte: cost } },
    data: { creditsBalance: { decrement: cost } },
  });
  return result.count > 0;
}

// Atomically credits `cost` back to the user. Use this if the paid AI call
// fails after credits were reserved so the user is not charged for nothing.
export async function refundCredits(userId: string, cost: number): Promise<void> {
  if (cost <= 0) return;
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { creditsBalance: { increment: cost } },
    });
  } catch (err) {
    console.error("[Credits] refund failed:", { userId, cost, err });
  }
}

export async function getCurrentBalance(userId: string): Promise<number> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { creditsBalance: true },
  });
  return u ? Number(u.creditsBalance) : 0;
}
