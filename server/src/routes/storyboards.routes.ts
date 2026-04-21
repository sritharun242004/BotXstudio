import { Router } from "express";
import * as controller from "../controllers/storyboards.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import {
  createStoryboardSchema,
  updateStoryboardSchema,
} from "../validators/storyboard.validators.js";

export const storyboardRoutes = Router();

storyboardRoutes.use(authenticate);

storyboardRoutes.post("/", validate(createStoryboardSchema), controller.create);
storyboardRoutes.get("/", controller.list);
storyboardRoutes.get("/:id", controller.getById);
storyboardRoutes.patch("/:id", validate(updateStoryboardSchema), controller.update);
storyboardRoutes.delete("/:id", controller.remove);
storyboardRoutes.post("/:id/duplicate", controller.duplicate);
storyboardRoutes.patch("/:id/set-active", controller.setActive);
