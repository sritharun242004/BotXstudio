import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import * as dashboard from "../controllers/admin.dashboard.controller.js";
import * as users from "../controllers/admin.users.controller.js";
import * as logs from "../controllers/admin.logs.controller.js";
import * as costs from "../controllers/admin.costs.controller.js";
import * as apikey from "../controllers/admin.apikey.controller.js";
import * as templates from "../controllers/admin.templates.controller.js";
import * as settings from "../controllers/admin.settings.controller.js";
import * as moderation from "../controllers/admin.moderation.controller.js";

const prisma = new PrismaClient();

// Cache the real super-admin DB id so FK constraints work
let _adminId: string | null = null;
async function getAdminId(): Promise<string> {
  if (_adminId) return _adminId;
  const user = await prisma.user.findFirst({
    where: { role: "SUPER_ADMIN" },
    select: { id: true },
  });
  _adminId = user?.id ?? null;
  return _adminId ?? "system";
}

export const adminRoutes = Router();

// No auth required — inject super-admin context using real DB user id
adminRoutes.use(async (req: Request, _res: Response, next: NextFunction) => {
  const userId = await getAdminId();
  req.user = { userId, email: "admin@local", role: "SUPER_ADMIN", permissions: null };
  next();
});

// Dashboard
adminRoutes.get("/dashboard", dashboard.getDashboard);

// Users
adminRoutes.get("/users", users.listUsers);
adminRoutes.post("/users/add-admin", users.addAdmin);
adminRoutes.patch("/users/update-permissions", users.updatePermissions);
adminRoutes.delete("/users/:id", users.deleteUser);

// API logs
adminRoutes.get("/api-logs", logs.getApiLogs);

// System logs
adminRoutes.get("/system-logs", logs.getSystemLogs);

// Costs
adminRoutes.get("/costs", costs.getCosts);

// API Key
adminRoutes.get("/api-key", apikey.getApiKey);
adminRoutes.post("/api-key", apikey.setApiKey);
adminRoutes.post("/api-key/test", apikey.testApiKey);

// Templates (uploaded)
adminRoutes.get("/templates", templates.listTemplates);
adminRoutes.post("/templates", templates.createTemplate);
adminRoutes.delete("/templates/:id", templates.deleteTemplate);

// Static template soft-delete bucket (must be before /:id routes)
adminRoutes.get("/templates/static/disabled", templates.listDisabledTemplates);
adminRoutes.post("/templates/static/disable", templates.disableStaticTemplate);
adminRoutes.delete("/templates/static/disable/:templateId", templates.enableStaticTemplate);

// Image Control
adminRoutes.get("/image-control", settings.getImageControl);
adminRoutes.patch("/image-control", settings.updateImageControl);

// Moderation
adminRoutes.get("/moderation/images", moderation.listAllImages);
adminRoutes.delete("/moderation/images/:id", moderation.removeImage);

// Settings
adminRoutes.get("/settings", settings.getSettings);
adminRoutes.patch("/settings", settings.updateSettings);
