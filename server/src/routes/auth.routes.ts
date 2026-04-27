import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authLimiter } from "../middleware/rateLimiter.js";

export const authRoutes = Router();

authRoutes.use(authLimiter);

authRoutes.get("/me", authenticate, authController.me);
authRoutes.post("/me", authenticate, authController.syncMe);
authRoutes.post("/logout", authController.logout);
