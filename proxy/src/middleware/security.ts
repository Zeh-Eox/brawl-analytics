import cors from "cors";
import helmet from "helmet";
import type { CorsOptions } from "cors";
import { config } from "../config/config.js";

const corsOptions: CorsOptions =
  config.corsOrigins === "*"
    ? { origin: true }
    : {
        origin: (origin, cb) => {
          // Allow same-origin / curl (no Origin header)
          if (!origin) return cb(null, true);
          const allowed = (config.corsOrigins as readonly string[]).includes(
            origin,
          );
          cb(allowed ? null : new Error("Origin not allowed by CORS"), allowed);
        },
        credentials: false,
        methods: ["GET", "OPTIONS"],
        maxAge: 600,
      };

export const corsMiddleware = cors(corsOptions);

export const helmetMiddleware = helmet({
  // This API serves only JSON, so we lock down content-type sniffing and
  // disable cross-origin embedding by default.
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
});
