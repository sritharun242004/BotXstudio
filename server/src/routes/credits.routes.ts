import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { adminAuth } from "../middleware/adminAuth.js";
import {
  getConfig,
  getBalance,
  getTransactions,
  selfTopUp,
  adminGetConfig,
  adminUpdateConfig,
  adminGetUsers,
  adminTopUpUser,
  adminDeleteUser,
  adminGetModelPricing,
  adminUpdateModelPricing,
  getModelPricing,
} from "../controllers/credits.controller.js";

export const creditsRoutes = Router();

// ─── User routes (require Cognito JWT) ────────────────────────────────────────
creditsRoutes.get("/config", authenticate, getConfig);
creditsRoutes.get("/balance", authenticate, getBalance);
creditsRoutes.get("/transactions", authenticate, getTransactions);
creditsRoutes.post("/self-topup", authenticate, selfTopUp);

// ─── Admin routes (require Cognito JWT + email in ADMIN_EMAILS allowlist) ────
creditsRoutes.get("/admin/config", authenticate, adminAuth, adminGetConfig);
creditsRoutes.put("/admin/config", authenticate, adminAuth, adminUpdateConfig);
creditsRoutes.get("/admin/users", authenticate, adminAuth, adminGetUsers);
creditsRoutes.post("/admin/users/:id/topup", authenticate, adminAuth, adminTopUpUser);
creditsRoutes.delete("/admin/users/:id", authenticate, adminAuth, adminDeleteUser);
creditsRoutes.get("/admin/model-pricing", authenticate, adminAuth, adminGetModelPricing);
creditsRoutes.put("/admin/model-pricing", authenticate, adminAuth, adminUpdateModelPricing);

// ─── Public model pricing (no auth — used by frontend for display) ─────────
creditsRoutes.get("/model-pricing", getModelPricing);
