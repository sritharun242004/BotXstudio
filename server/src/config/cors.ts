import cors from "cors";
import { env } from "./env.js";

const explicitOrigins = env.CORS_ORIGIN.split(",").map((o) => o.trim());

export const corsOptions: cors.CorsOptions = {
  origin(origin, callback) {
    // Non-browser / server-to-server requests have no Origin header — allow them.
    if (!origin) return callback(null, true);
    // Explicitly listed origins (from CORS_ORIGIN env).
    if (explicitOrigins.includes(origin)) return callback(null, true);
    // Any *.botzudio.com subdomain is trusted in production.
    if (
      env.NODE_ENV === "production" &&
      /^https:\/\/[\w-]+\.botzudio\.com$/.test(origin)
    ) {
      return callback(null, true);
    }
    callback(new Error(`CORS: origin not allowed — ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  // x-admin-secret is required for all admin API calls from the subdomain.
  allowedHeaders: ["Content-Type", "Authorization", "x-admin-secret"],
};
