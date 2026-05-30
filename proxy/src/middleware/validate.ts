import type { NextFunction, Request, Response } from "express";
import { z, ZodError, type ZodTypeAny } from "zod";
import { badRequest } from "../config/errors.js";

type Source = "params" | "query" | "body";

/**
 * Returns an Express middleware that validates and replaces `req[source]`
 * with the parsed value, so downstream handlers can rely on typed input.
 */
export const validate =
  <S extends ZodTypeAny>(source: Source, schema: S) =>
  (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req[source]);
      // `req.query` is a getter-only property in Express 5, so plain assignment
      // throws. Redefining the property is supported and works for `params`
      // and `body` too.
      Object.defineProperty(req, source, {
        value: parsed,
        writable: true,
        configurable: true,
        enumerable: true,
      });
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        next(badRequest("Invalid request", err.flatten()));
        return;
      }
      next(err);
    }
  };

export const PaginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional(),
  before: z.string().min(1).max(64).optional(),
  after: z.string().min(1).max(64).optional(),
});

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;
