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

// ─── Authenticated user: attribute self to affiliate ─────────────────────────
affiliateRoutes.post("/attribute", authenticate, attributeUser);

// ─── Authenticated user: redeem promo/affiliate code ─────────────────────────
affiliateRoutes.post("/redeem", authenticate, redeemCoupon);

// ─── Admin: overview ──────────────────────────────────────────────────────────
affiliateRoutes.get("/admin/overview", adminAuth, adminGetOverview);

// ─── Admin: CRUD ──────────────────────────────────────────────────────────────
affiliateRoutes.get("/admin",                       adminAuth, adminListAffiliates);
affiliateRoutes.post("/admin",                      adminAuth, adminCreateAffiliate);
affiliateRoutes.get("/admin/:id",                   adminAuth, adminGetAffiliate);
affiliateRoutes.put("/admin/:id",                   adminAuth, adminUpdateAffiliate);
affiliateRoutes.delete("/admin/:id",                adminAuth, adminDeleteAffiliate);
affiliateRoutes.post("/admin/:id/suspend",          adminAuth, adminSuspendAffiliate);
affiliateRoutes.get("/admin/:id/activity",          adminAuth, adminGetAffiliateActivity);
affiliateRoutes.get("/admin/:id/users",             adminAuth, adminGetAffiliateUsers);
affiliateRoutes.post("/admin/:id/profile-upload-url", adminAuth, adminGetProfileUploadUrl);
