import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../config/errors.js";
import { logger } from "../config/logger.js";
import { config } from "../config/config.js";

export const notFoundHandler = (_req: Request, res: Response) => {
  res.status(404).json({
    error: { code: "notFound", message: "Route not found" },
  });
};

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Express signature
  _next: NextFunction,
) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details !== undefined ? { details: err.details } : {}),
      },
    });
    return;
  }

  // Unknown — log full detail server-side, return opaque message to client.
  logger.error({ err, path: req.path }, "unhandled error");
  res.status(500).json({
    error: {
      code: "internal",
      message: config.isProd
        ? "Internal server error"
        : err instanceof Error
          ? err.message
          : String(err),
    },
  });
};
