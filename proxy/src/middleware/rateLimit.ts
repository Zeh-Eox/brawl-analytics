import rateLimit from "express-rate-limit";
import { config } from "../config/config.js";

export const globalLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  limit: config.RATE_LIMIT_MAX,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    error: {
      code: "rateLimited",
      message: "Too many requests, please slow down.",
    },
  },
});

/** Stricter limiter for routes that hit multiple upstream endpoints. */
export const analyticsLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  limit: Math.max(20, Math.floor(config.RATE_LIMIT_MAX / 3)),
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    error: {
      code: "rateLimited",
      message: "Analytics endpoints have a stricter quota.",
    },
  },
});
