import { Router } from "express";
import { z } from "zod";
import * as tracker from "../services/tracker.js";
import { TagSchema } from "../config/tags.js";
import { PaginationQuerySchema, validate } from "../middleware/validate.js";

const router = Router();

const TagParam = z.object({ tag: TagSchema });

/** Activate / refresh background capture for a tag (called on profile view). */
router.post("/:tag", validate("params", TagParam), (req, res) => {
  const { tag } = req.params as unknown as { tag: string };
  res.json(tracker.touch(tag));
});

/** Capture status & counters for a tag. */
router.get("/:tag", validate("params", TagParam), (req, res) => {
  const { tag } = req.params as unknown as { tag: string };
  const status = tracker.getStatus(tag);
  res.json(status ?? { tag, tracked: false, battleCount: 0, timelinePoints: 0 });
});

/** Full captured battle archive (grows past the 25-battle API window). */
router.get(
  "/:tag/battles",
  validate("params", TagParam),
  validate("query", PaginationQuerySchema),
  (req, res) => {
    const { tag } = req.params as unknown as { tag: string };
    const { limit } = req.query as unknown as z.infer<
      typeof PaginationQuerySchema
    >;
    res.json({ tag, items: tracker.getBattles(tag, limit) });
  },
);

/** Captured trophy timeline. */
router.get("/:tag/timeline", validate("params", TagParam), (req, res) => {
  const { tag } = req.params as unknown as { tag: string };
  res.json({ tag, points: tracker.getTimeline(tag) });
});

export default router;
