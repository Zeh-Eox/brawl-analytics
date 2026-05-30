import { Router } from "express";
import { z } from "zod";
import * as bs from "../services/brawlstars.js";
import { TagSchema } from "../config/tags.js";
import {
  PaginationQuerySchema,
  validate,
} from "../middleware/validate.js";

const router = Router();

const TagParam = z.object({ tag: TagSchema });

router.get(
  "/:tag",
  validate("params", TagParam),
  async (req, res, next) => {
    try {
      const { tag } = req.params as unknown as { tag: string };
      const data = await bs.getClub(tag);
      res.json(data);
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  "/:tag/members",
  validate("params", TagParam),
  validate("query", PaginationQuerySchema),
  async (req, res, next) => {
    try {
      const { tag } = req.params as unknown as { tag: string };
      const query = req.query as unknown as z.infer<
        typeof PaginationQuerySchema
      >;
      const data = await bs.getClubMembers(tag, query);
      res.json(data);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
