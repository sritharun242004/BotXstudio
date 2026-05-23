import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import {
  createAffiliate,
  updateAffiliate,
  deleteAffiliate,
  getAffiliateById,
  getAffiliateByCode,
  listAffiliates,
  trackClick,
  attributeUserToAffiliate,
  getOverviewStats,
  getDailySignups,
  getProfileImageUploadUrl,
  getAffiliateActivity,
  getAffiliateUsers,
} from "../services/affiliate.service.js";
import { BadRequestError, NotFoundError } from "../utils/errors.js";

// ─── Validation schemas ───────────────────────────────────────────────────────

const createSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  phone: z.string().optional(),
  instagram: z.string().optional(),
  youtube: z.string().optional(),
  linkedin: z.string().optional(),
  location: z.string().optional(),
  bio: z.string().max(500).optional(),
  commissionPercentage: z.number().min(0).max(100).optional(),
  bonusCredits: z.number().int().min(0).max(10000).optional(),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  upiId: z.string().optional(),
  profileImageUrl: z.string().url().optional(),
});

const updateSchema = createSchema.partial().extend({
  status: z.enum(["active", "suspended", "inactive"]).optional(),
});

// ─── Admin: CRUD ──────────────────────────────────────────────────────────────

export async function adminListAffiliates(req: Request, res: Response, next: NextFunction) {
  try {
    const { search, status, limit, offset } = req.query as Record<string, string>;
    const result = await listAffiliates({
      search,
      status,
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0,
    });
    res.json(result);
  } catch (err) { next(err); }
}

export async function adminGetAffiliate(req: Request, res: Response, next: NextFunction) {
  try {
    const aff = await getAffiliateById(String(req.params.id));
    if (!aff) throw new NotFoundError("Affiliate not found");
    res.json(aff);
  } catch (err) { next(err); }
}

export async function adminCreateAffiliate(req: Request, res: Response, next: NextFunction) {
  try {
    const body = createSchema.parse(req.body);
    const aff = await createAffiliate(body);
    res.status(201).json(aff);
  } catch (err) {
    if (err instanceof z.ZodError) return next(new BadRequestError(err.errors[0]?.message ?? "Validation failed"));
    next(err);
  }
}

export async function adminUpdateAffiliate(req: Request, res: Response, next: NextFunction) {
  try {
    const body = updateSchema.parse(req.body);
    const aff = await updateAffiliate(String(req.params.id), body);
    res.json(aff);
  } catch (err) {
    if (err instanceof z.ZodError) return next(new BadRequestError(err.errors[0]?.message ?? "Validation failed"));
    next(err);
  }
}

export async function adminDeleteAffiliate(req: Request, res: Response, next: NextFunction) {
  try {
    await deleteAffiliate(String(req.params.id));
    res.json({ success: true });
  } catch (err) { next(err); }
}

export async function adminSuspendAffiliate(req: Request, res: Response, next: NextFunction) {
  try {
    const aff = await updateAffiliate(String(req.params.id), { status: "suspended" });
    res.json(aff);
  } catch (err) { next(err); }
}

// ─── Admin: overview + analytics ─────────────────────────────────────────────

export async function adminGetOverview(req: Request, res: Response, next: NextFunction) {
  try {
    const [stats, daily] = await Promise.all([
      getOverviewStats(),
      getDailySignups(30),
    ]);
    res.json({ stats, daily });
  } catch (err) { next(err); }
}

export async function adminGetAffiliateActivity(req: Request, res: Response, next: NextFunction) {
  try {
    const activity = await getAffiliateActivity(String(req.params.id));
    res.json(activity);
  } catch (err) { next(err); }
}

export async function adminGetAffiliateUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const users = await getAffiliateUsers(String(req.params.id));
    res.json(users);
  } catch (err) { next(err); }
}

// ─── Admin: profile image upload URL ─────────────────────────────────────────

export async function adminGetProfileUploadUrl(req: Request, res: Response, next: NextFunction) {
  try {
    const { contentType } = req.body as { contentType?: string };
    if (!contentType?.startsWith("image/")) throw new BadRequestError("contentType must be an image MIME type");
    const id = String(req.params.id);
    const result = await getProfileImageUploadUrl(id || "temp-" + Date.now(), contentType);
    res.json(result);
  } catch (err) { next(err); }
}

// ─── Public: referral click tracking ─────────────────────────────────────────

function parseDevice(ua: string): string {
  if (/mobile/i.test(ua)) return "mobile";
  if (/tablet|ipad/i.test(ua)) return "tablet";
  return "desktop";
}

function parseBrowser(ua: string): string {
  if (/chrome/i.test(ua) && !/edg/i.test(ua)) return "Chrome";
  if (/firefox/i.test(ua)) return "Firefox";
  if (/safari/i.test(ua) && !/chrome/i.test(ua)) return "Safari";
  if (/edg/i.test(ua)) return "Edge";
  return "Other";
}

async function doTrackClick(req: Request, affiliateId: string) {
  const ua = req.headers["user-agent"] ?? "";
  const ip = (req.ip ?? "").replace("::ffff:", "");
  const utmSource = req.query.utm_source as string | undefined;
  const utmMedium  = req.query.utm_medium  as string | undefined;
  await trackClick({
    affiliateId,
    ipAddress: ip,
    device: parseDevice(ua),
    browser: parseBrowser(ua),
    utmSource,
    utmMedium,
  });
}

// JSON API used by ReferralPage component
export async function publicTrackReferral(req: Request, res: Response, next: NextFunction) {
  try {
    const code = String(req.params.code);
    const aff = await getAffiliateByCode(code);
    if (!aff || aff.status !== "active") {
      return res.status(404).json({ error: "Invalid referral code" });
    }
    await doTrackClick(req, aff.id);
    res.json({ affiliateId: aff.id, affiliateCode: aff.affiliateCode, name: aff.name, bonusCredits: aff.bonusCredits ?? 0 });
  } catch (err) { next(err); }
}

// Server-side redirect — handles /r/:code directly so no JS bundle needed
export async function publicReferralRedirect(req: Request, res: Response, _next: NextFunction) {
  const code = String(req.params.code);
  try {
    const aff = await getAffiliateByCode(code);
    if (aff && aff.status === "active") {
      await doTrackClick(req, aff.id).catch(() => {});
    }
  } catch { /* ignore — always redirect */ }

  // Cookie survives the Cognito round-trip; JS can also read it
  res.cookie("bsx_affiliate_ref", code, {
    maxAge: 24 * 60 * 60 * 1000, // 24 h
    httpOnly: false,
    sameSite: "lax",
    path: "/",
  });

  // Redirect to landing page with ref param so the promo banner shows
  res.redirect(302, `/?ref=${encodeURIComponent(code)}`);
}

// ─── Authenticated: attribute user to affiliate after signup ──────────────────

export async function attributeUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { affiliateCode } = req.body as { affiliateCode?: string };
    if (!affiliateCode) throw new BadRequestError("affiliateCode is required");

    const aff = await getAffiliateByCode(affiliateCode);
    if (!aff) return res.json({ attributed: false });

    const userId = req.user?.userId;
    if (!userId) throw new BadRequestError("User not authenticated");

    const attributed = await attributeUserToAffiliate(userId, aff.id);
    res.json({ attributed });
  } catch (err) { next(err); }
}
