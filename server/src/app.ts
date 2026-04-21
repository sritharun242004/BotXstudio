import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import { env } from "./config/env.js";
import { corsOptions } from "./config/cors.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { authRoutes } from "./routes/auth.routes.js";
import { storyboardRoutes } from "./routes/storyboards.routes.js";
import { imageRoutes } from "./routes/images.routes.js";
import { generateRoutes } from "./routes/generate.routes.js";
import { assetRoutes } from "./routes/assets.routes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();

  // Global middleware
  app.use(helmet({
    contentSecurityPolicy: env.NODE_ENV === "production" ? undefined : false,
  }));
  app.use(cors(corsOptions));
  app.use(cookieParser());
  app.use(express.json({ limit: "25mb" }));

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // API Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/storyboards", storyboardRoutes);
  app.use("/api/images", imageRoutes);
  app.use("/api/generate", generateRoutes);
  app.use("/api/assets", assetRoutes);

  // In production, serve the frontend static build
  if (env.NODE_ENV === "production") {
    const clientDist = path.resolve(__dirname, "../../client");
    app.use("/ecommerce-scene-generator", express.static(clientDist));
    // SPA fallback — serve index.html for all non-API routes
    app.get(/^\/ecommerce-scene-generator(?:\/.*)?$/, (_req, res) => {
      res.sendFile(path.join(clientDist, "index.html"));
    });
  }

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}
