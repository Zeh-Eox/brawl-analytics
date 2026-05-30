import express, { type Request, type Response } from "express";
import compression from "compression";
import { pinoHttp } from "pino-http";
import { config } from "./config/config.js";
import { logger } from "./config/logger.js";
import { corsMiddleware, helmetMiddleware } from "./middleware/security.js";
import { globalLimiter } from "./middleware/rateLimit.js";
import {
  errorHandler,
  notFoundHandler,
} from "./middleware/errorHandler.js";
import router from "./routes/index.js";

const app = express();

// Trust X-Forwarded-* when behind a proxy/load-balancer so rate-limit
// sees the real client IP. The exact hop count should be tuned per deploy.
app.set("trust proxy", 1);
app.disable("x-powered-by");

app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use(compression());
app.use(express.json({ limit: "16kb" }));
app.use(
  pinoHttp({
    logger,
    customLogLevel: (_req: Request, res: Response, err?: Error) => {
      if (err || res.statusCode >= 500) return "error";
      if (res.statusCode >= 400) return "warn";
      return "info";
    },
  }),
);
app.use(globalLimiter);

app.use("/", router);

app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(config.PORT, () => {
  logger.info(
    { port: config.PORT, env: config.NODE_ENV },
    "brawl-analytics proxy listening",
  );
});

// Graceful shutdown so in-flight requests get a chance to drain.
const shutdown = (signal: string) => {
  logger.info({ signal }, "shutting down");
  server.close((err) => {
    if (err) {
      logger.error({ err }, "error during shutdown");
      process.exit(1);
    }
    process.exit(0);
  });
  // Hard exit if shutdown hangs.
  setTimeout(() => process.exit(1), 10_000).unref();
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
