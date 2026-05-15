import type { ErrorRequestHandler } from "express";
import { AppError } from "../utils/errors.js";
import { env } from "../config/env.js";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  console.error("Unhandled error:", err);

  const message = env.NODE_ENV === "production" ? "Internal server error" : (err as Error).message;
  res.status(500).json({ error: message });
};
