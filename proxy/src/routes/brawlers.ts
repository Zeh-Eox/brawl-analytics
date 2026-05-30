import { Router } from "express";
import { z } from "zod";
import * as bs from "../services/brawlstars.js";
import {
  PaginationQuerySchema,
  validate,
} from "../middleware/validate.js";

const router = Router();

const BrawlerIdParam = z.object({
  brawlerId: z.coerce.number().int().positive(),
});

router.get(
  "/",
  validate("query", PaginationQuerySchema),
  async (req, res, next) => {
    try {
      const query = req.query as unknown as z.infer<
        typeof PaginationQuerySchema
      >;
      const data = await bs.getBrawlers(query);
      res.json(data);
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  "/:brawlerId",
  validate("params", BrawlerIdParam),
  async (req, res, next) => {
    try {
      const { brawlerId } = req.params as unknown as { brawlerId: number };
      const data = await bs.getBrawler(brawlerId);
      res.json(data);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
