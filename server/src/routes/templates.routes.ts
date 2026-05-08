import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { getTemplates, proxyTemplateImage } from "../controllers/templates.controller.js";

export const templatesRoutes = Router();

templatesRoutes.get("/", authenticate, getTemplates);
templatesRoutes.get("/:id/image", proxyTemplateImage);
