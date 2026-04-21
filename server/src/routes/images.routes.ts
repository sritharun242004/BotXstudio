import { Router } from "express";
import * as controller from "../controllers/images.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import { uploadImageSchema, batchDeleteSchema } from "../validators/image.validators.js";

export const imageRoutes = Router();

imageRoutes.use(authenticate);

imageRoutes.post("/", validate(uploadImageSchema), controller.upload);
imageRoutes.get("/", controller.list);
imageRoutes.get("/:id", controller.getById);
imageRoutes.delete("/:id", controller.remove);
imageRoutes.post("/batch-delete", validate(batchDeleteSchema), controller.batchDelete);
