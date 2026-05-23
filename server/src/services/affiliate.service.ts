import { PrismaClient } from "@prisma/client";
import QRCode from "qrcode";
import { uploadBuffer } from "./s3.service.js";
import { env } from "../config/env.js";

const prisma = new PrismaClient();

// ─── Code generation ──────────────────────────────────────────────────────────

function slugify(name: string): string {
  return name
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 5)
    .padEnd(3, "X");
}

export async function generateAffiliateCode(name: string): Promise<string> {
  const prefix = slugify(name);
  // Find highest existing sequence for this prefix
  const existing = await prisma.affiliate.findMany({
    where: { affiliateCode: { startsWith: prefix } },
    select: { affiliateCode: true },
  });
  let max = 0;
  for (const { affiliateCode } of existing) {
    const num = parseInt(affiliateCode.slice(prefix.length), 10);
    if (!isNaN(num) && num > max) max = num;
  }
  const seq = String(max + 1).padStart(3, "0");
  return `${prefix}${seq}`;
}

// ─── QR code ──────────────────────────────────────────────────────────────────

async function generateAndUploadQR(affiliateId: string, referralLink: string): Promise<string> {
  const pngBuffer = await QRCode.toBuffer(referralLink, {
    type: "png",
    width: 400,
    margin: 2,
    color: { dark: "#0F172A", light: "#FFFFFF" },
  });
  const key = `affiliates/${affiliateId}/qr-code.png`;
  await uploadBuffer(key, pngBuffer, "image/png");
  return `https://${env.S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export interface CreateAffiliateInput {
  name: string;
  email: string;
  phone?: string;
  instagram?: string;
  youtube?: string;
  linkedin?: string;
  location?: string;
  bio?: string;
  commissionPercentage?: number;
  bonusCredits?: number;
  bankName?: string;
  accountNumber?: string;
  upiId?: string;
  profileImageUrl?: string;
}

export async function createAffiliate(input: CreateAffiliateInput) {
  const affiliateCode = await generateAffiliateCode(input.name);
  const referralLink = `${env.APP_URL}/r/${affiliateCode}`;

  const affiliate = await prisma.affiliate.create({
    data: {
      name: input.name,
      email: input.email,
      phone: input.phone,
      instagram: input.instagram,
      youtube: input.youtube,
      linkedin: input.linkedin,
      location: input.location,
      bio: input.bio,
      commissionPercentage: input.commissionPercentage ?? 10,
      bonusCredits: input.bonusCredits ?? 0,
      bankName: input.bankName,
      accountNumber: input.accountNumber,
      upiId: input.upiId,
      profileImageUrl: input.profileImageUrl,
      affiliateCode,
      referralLink,
    },
  });

  // Generate and upload QR code asynchronously
  try {
    const qrCodeUrl = await generateAndUploadQR(affiliate.id, referralLink);
    return prisma.affiliate.update({
      where: { id: affiliate.id },
      data: { qrCodeUrl },
    });
  } catch {
    return affiliate;
  }
}

export async function updateAffiliate(id: string, input: Partial<CreateAffiliateInput> & { status?: string }) {
  return prisma.affiliate.update({
    where: { id },
    data: {
      ...(input.name           !== undefined && { name: input.name }),
      ...(input.email          !== undefined && { email: input.email }),
      ...(input.phone          !== undefined && { phone: input.phone }),
      ...(input.instagram      !== undefined && { instagram: input.instagram }),
      ...(input.youtube        !== undefined && { youtube: input.youtube }),
      ...(input.linkedin       !== undefined && { linkedin: input.linkedin }),
      ...(input.location       !== undefined && { location: input.location }),
      ...(input.bio            !== undefined && { bio: input.bio }),
      ...(input.commissionPercentage !== undefined && { commissionPercentage: input.commissionPercentage }),
      ...(input.bonusCredits   !== undefined && { bonusCredits: input.bonusCredits }),
      ...(input.bankName       !== undefined && { bankName: input.bankName }),
      ...(input.accountNumber  !== undefined && { accountNumber: input.accountNumber }),
      ...(input.upiId          !== undefined && { upiId: input.upiId }),
      ...(input.profileImageUrl !== undefined && { profileImageUrl: input.profileImageUrl }),
      ...(input.status         !== undefined && { status: input.status }),
    },
  });
}

export async function deleteAffiliate(id: string) {
  return prisma.affiliate.delete({ where: { id } });
}

export async function getAffiliateById(id: string) {
  return prisma.affiliate.findUnique({
    where: { id },
    include: {
      affiliations: {
        include: { affiliate: false },
        orderBy: { signupDate: "desc" },
        take: 50,
      },
    },
  });
}

export async function getAffiliateByCode(code: string) {
  return prisma.affiliate.findUnique({ where: { affiliateCode: code } });
}

export async function listAffiliates(opts: {
  search?: string;
  status?: string;
  limit?: number;
  offset?: number;
}) {
  const where: Record<string, unknown> = {};
  if (opts.status) where.status = opts.status;
  if (opts.search) {
    where.OR = [
      { name: { contains: opts.search, mode: "insensitive" } },
      { email: { contains: opts.search, mode: "insensitive" } },
      { affiliateCode: { contains: opts.search, mode: "insensitive" } },
    ];
  }

  const [affiliates, total] = await Promise.all([
    prisma.affiliate.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: opts.limit ?? 50,
      skip: opts.offset ?? 0,
    }),
    prisma.affiliate.count({ where }),
  ]);

  return { affiliates, total };
}

// ─── Click tracking ───────────────────────────────────────────────────────────

export interface TrackClickInput {
  affiliateId: string;
  sessionId?: string;
  ipAddress?: string;
  device?: string;
  browser?: string;
  utmSource?: string;
  utmMedium?: string;
}

export async function trackClick(input: TrackClickInput) {
  const [click] = await Promise.all([
    prisma.affiliateClick.create({
      data: {
        affiliateId: input.affiliateId,
        sessionId: input.sessionId,
        ipAddress: input.ipAddress,
        device: input.device,
        browser: input.browser,
        utmSource: input.utmSource,
        utmMedium: input.utmMedium,
      },
    }),
    prisma.affiliate.update({
      where: { id: input.affiliateId },
      data: { totalClicks: { increment: 1 } },
    }),
  ]);
  return click;
}

// ─── User attribution ─────────────────────────────────────────────────────────

export async function attributeUserToAffiliate(userId: string, affiliateId: string): Promise<boolean> {
  const affiliate = await prisma.affiliate.findUnique({
    where: { id: affiliateId, status: "active" },
  });
  if (!affiliate) return false;

  const existing = await prisma.userAffiliation.findUnique({
    where: { userId_affiliateId: { userId, affiliateId } },
  });
  if (existing) return false;

  // Create affiliation + increment affiliate user count
  await Promise.all([
    prisma.userAffiliation.create({ data: { userId, affiliateId } }),
    prisma.affiliate.update({ where: { id: affiliateId }, data: { totalUsers: { increment: 1 } } }),
  ]);

  // Give the new user their signup bonus credits
  const bonus = affiliate.bonusCredits ?? 0;
  if (bonus > 0) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { creditsBalance: true } });
    if (user) {
      const newBalance = Number(user.creditsBalance) + bonus;
      await prisma.user.update({
        where: { id: userId },
        data: {
          creditsBalance: newBalance,
          creditTransactions: {
            create: {
              amountInr: bonus,
              type: "affiliate_bonus",
              description: `Signup bonus from affiliate ${affiliate.affiliateCode} (${affiliate.name})`,
              balanceAfter: newBalance,
            },
          },
        },
      });
    }
  }

  return true;
}

// ─── Commission ───────────────────────────────────────────────────────────────

export async function recordCommission(userId: string, purchaseAmountInr: number) {
  const affiliation = await prisma.userAffiliation.findFirst({
    where: { userId },
    include: { affiliate: true },
  });
  if (!affiliation) return;

  const pct = Number(affiliation.affiliate.commissionPercentage);
  const commission = (purchaseAmountInr * pct) / 100;

  await Promise.all([
    prisma.userAffiliation.update({
      where: { id: affiliation.id },
      data: {
        purchaseAmount: { increment: purchaseAmountInr },
        commissionGenerated: { increment: commission },
      },
    }),
    prisma.affiliate.update({
      where: { id: affiliation.affiliateId },
      data: {
        totalRevenue: { increment: purchaseAmountInr },
        totalCommission: { increment: commission },
      },
    }),
  ]);
}

// ─── Overview stats ───────────────────────────────────────────────────────────

export async function getOverviewStats() {
  const [
    totalAffiliates,
    clicksAgg,
    affiliatesAgg,
    pendingCommission,
  ] = await Promise.all([
    prisma.affiliate.count(),
    prisma.affiliateClick.count(),
    prisma.affiliate.aggregate({
      _sum: { totalUsers: true, totalRevenue: true, totalCommission: true },
    }),
    prisma.affiliate.aggregate({
      _sum: { totalCommission: true },
      where: { status: "active" },
    }),
  ]);

  return {
    totalAffiliates,
    totalClicks: clicksAgg,
    totalSignups: affiliatesAgg._sum.totalUsers ?? 0,
    totalRevenue: Number(affiliatesAgg._sum.totalRevenue ?? 0),
    totalCommission: Number(affiliatesAgg._sum.totalCommission ?? 0),
    pendingPayouts: Number(pendingCommission._sum.totalCommission ?? 0),
  };
}

export async function getDailySignups(days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const affiliations = await prisma.userAffiliation.findMany({
    where: { signupDate: { gte: since } },
    select: { signupDate: true },
    orderBy: { signupDate: "asc" },
  });

  const map = new Map<string, number>();
  for (const { signupDate } of affiliations) {
    const key = signupDate.toISOString().slice(0, 10);
    map.set(key, (map.get(key) ?? 0) + 1);
  }

  const result: { date: string; signups: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    result.push({ date: key, signups: map.get(key) ?? 0 });
  }
  return result;
}

// ─── Profile image presigned upload URL ──────────────────────────────────────

export async function getProfileImageUploadUrl(affiliateId: string, contentType: string) {
  const { getPresignedUploadUrl } = await import("./s3.service.js");
  const ext = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
  const key = `affiliates/${affiliateId}/profile.${ext}`;
  const url = await getPresignedUploadUrl(key, contentType, 900);
  const publicUrl = `https://${env.S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;
  return { uploadUrl: url, publicUrl, key };
}

// ─── Affiliate activity (recent clicks) ──────────────────────────────────────

export async function getAffiliateActivity(affiliateId: string, limit = 20) {
  return prisma.affiliateClick.findMany({
    where: { affiliateId },
    orderBy: { timestamp: "desc" },
    take: limit,
  });
}

export async function getAffiliateUsers(affiliateId: string) {
  const affiliations = await prisma.userAffiliation.findMany({
    where: { affiliateId },
    orderBy: { signupDate: "desc" },
  });

  const userIds = affiliations.map((a) => a.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true, createdAt: true },
  });

  const userMap = new Map(users.map((u) => [u.id, u]));

  return affiliations.map((a) => ({
    userId: a.userId,
    name: userMap.get(a.userId)?.name ?? "Unknown",
    email: userMap.get(a.userId)?.email ?? "",
    signupDate: a.signupDate,
    purchaseAmount: Number(a.purchaseAmount),
    commissionGenerated: Number(a.commissionGenerated),
  }));
}
