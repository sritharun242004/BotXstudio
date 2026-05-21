import { Router } from "express";
import * as controller from "../controllers/tryon.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import { generateLimiter } from "../middleware/rateLimiter.js";
import { tryOnSchema } from "../validators/tryon.validators.js";

export const tryOnRoutes = Router();

tryOnRoutes.use(authenticate);
tryOnRoutes.use(generateLimiter);

tryOnRoutes.post("/", validate(tryOnSchema), controller.tryOn);
