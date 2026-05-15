import { Router } from "express";
import * as controller from "../controllers/flux.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import { generateLimiter } from "../middleware/rateLimiter.js";
import { generateFluxImageSchema } from "../validators/flux.validators.js";

export const fluxRoutes = Router();

fluxRoutes.use(authenticate);
fluxRoutes.use(generateLimiter);

fluxRoutes.post("/image", validate(generateFluxImageSchema), controller.image);
