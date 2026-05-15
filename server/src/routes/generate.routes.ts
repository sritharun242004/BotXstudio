import { Router } from "express";
import * as controller from "../controllers/generate.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import { generateLimiter } from "../middleware/rateLimiter.js";
import { generatePlanSchema, generateImageSchema } from "../validators/generate.validators.js";

export const generateRoutes = Router();

generateRoutes.use(authenticate);
generateRoutes.use(generateLimiter);

generateRoutes.post("/plan", validate(generatePlanSchema), controller.plan);
generateRoutes.post("/image", validate(generateImageSchema), controller.image);
