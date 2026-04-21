import cors from "cors";
import { env } from "./env.js";

export const corsOptions: cors.CorsOptions = {
  origin: env.CORS_ORIGIN.split(",").map((o) => o.trim()),
  credentials: true,
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
