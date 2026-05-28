import { Router } from "express";
import * as controller from "../controllers/images.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import { uploadImageSchema, batchDeleteSchema } from "../validators/image.validators.js";

export const imageRoutes = Router();

// All image routes require a Bearer token in the Authorization header. The
// /raw endpoint previously also accepted ?token=<accessToken> in the URL so
// it could be used as an <img src>; that leaked the access token into
// browser history, Performance API, Referer headers and access logs. The
// frontend now fetch()es with the bearer header and creates blob: URLs.
imageRoutes.use(authenticate);

imageRoutes.get("/:id/raw", controller.getRaw);

imageRoutes.post("/", validate(uploadImageSchema), controller.upload);
imageRoutes.get("/", controller.list);
imageRoutes.get("/:id", controller.getById);
imageRoutes.delete("/:id", controller.remove);
imageRoutes.post("/batch-delete", validate(batchDeleteSchema), controller.batchDelete);
