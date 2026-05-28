import { Router } from "express";
import { adminAuth } from "../middleware/adminAuth.js";
import { authenticate } from "../middleware/authenticate.js";
import { rateLimit } from "express-rate-limit";
import {
  adminListAffiliates,
  adminGetAffiliate,
  adminCreateAffiliate,
  adminUpdateAffiliate,
  adminDeleteAffiliate,
  adminSuspendAffiliate,
  adminGetOverview,
  adminGetAffiliateActivity,
  adminGetAffiliateUsers,
  adminGetProfileUploadUrl,
  publicTrackReferral,
  attributeUser,
  redeemCoupon,
} from "../controllers/affiliate.controller.js";

export const affiliateRoutes = Router();

// ─── Public: referral click (rate-limited) ────────────────────────────────────
const referralLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests" },
});

affiliateRoutes.get("/r/:code", referralLimiter, publicTrackReferral);

// Tight limit on /attribute and /redeem: these are once-per-account operations
// and the only reason to call them rapidly is a race-condition exploit attempt.
// 5 requests per minute per IP is plenty for legitimate retries.
const claimLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests" },
});

// ─── Authenticated user: attribute self to affiliate ─────────────────────────
affiliateRoutes.post("/attribute", claimLimiter, authenticate, attributeUser);

// ─── Authenticated user: redeem promo/affiliate code ─────────────────────────
affiliateRoutes.post("/redeem", claimLimiter, authenticate, redeemCoupon);

// ─── Admin: overview ──────────────────────────────────────────────────────────
affiliateRoutes.get("/admin/overview", authenticate, adminAuth, adminGetOverview);

// ─── Admin: CRUD ──────────────────────────────────────────────────────────────
affiliateRoutes.get("/admin",                       authenticate, adminAuth, adminListAffiliates);
affiliateRoutes.post("/admin",                      authenticate, adminAuth, adminCreateAffiliate);
affiliateRoutes.get("/admin/:id",                   authenticate, adminAuth, adminGetAffiliate);
affiliateRoutes.put("/admin/:id",                   authenticate, adminAuth, adminUpdateAffiliate);
affiliateRoutes.delete("/admin/:id",                authenticate, adminAuth, adminDeleteAffiliate);
affiliateRoutes.post("/admin/:id/suspend",          authenticate, adminAuth, adminSuspendAffiliate);
affiliateRoutes.get("/admin/:id/activity",          authenticate, adminAuth, adminGetAffiliateActivity);
affiliateRoutes.get("/admin/:id/users",             authenticate, adminAuth, adminGetAffiliateUsers);
affiliateRoutes.post("/admin/:id/profile-upload-url", authenticate, adminAuth, adminGetProfileUploadUrl);
