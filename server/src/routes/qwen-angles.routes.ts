import { Router } from "express";
import * as controller from "../controllers/qwen-angles.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import { generateLimiter } from "../middleware/rateLimiter.js";
import { generateQwenAnglesSchema } from "../validators/qwen-angles.validators.js";

export const qwenAnglesRoutes = Router();

qwenAnglesRoutes.use(authenticate);
qwenAnglesRoutes.use(generateLimiter);

qwenAnglesRoutes.post("/angles", validate(generateQwenAnglesSchema), controller.angles);
