import { Router } from "express";
import * as controller from "../controllers/openai.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import { generateLimiter } from "../middleware/rateLimiter.js";
import { generateGptImageSchema } from "../validators/openai.validators.js";

export const openaiRoutes = Router();

openaiRoutes.use(authenticate);
openaiRoutes.use(generateLimiter);

openaiRoutes.post("/image", validate(generateGptImageSchema), controller.image);
