import { Router } from "express";
import * as controller from "../controllers/assets.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import { requestUploadUrlSchema, registerAssetSchema } from "../validators/asset.validators.js";

export const assetRoutes = Router();

assetRoutes.use(authenticate);

assetRoutes.post("/upload", validate(requestUploadUrlSchema), controller.requestUploadUrl);
assetRoutes.post("/", validate(registerAssetSchema), controller.register);
assetRoutes.get("/", controller.list);
assetRoutes.delete("/:id", controller.remove);
