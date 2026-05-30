import { Router } from "express";
import { z } from "zod";
import * as bs from "../services/brawlstars.js";
import * as analytics from "../services/analytics.js";
import { TagSchema } from "../config/tags.js";
import { validate } from "../middleware/validate.js";
import { analyticsLimiter } from "../middleware/rateLimit.js";
import type { PlayerProfileAnalytics } from "../types/analytics.js";

const router = Router();

router.use(analyticsLimiter);

const TagParam = z.object({ tag: TagSchema });
const TwoTagsParam = z.object({ tag: TagSchema, otherTag: TagSchema });

/** Aggregated player stats (no battlelog fetch). Cheap, single upstream call. */
router.get(
  "/players/:tag/summary",
  validate("params", TagParam),
  async (req, res, next) => {
    try {
      const { tag } = req.params as unknown as { tag: string };
      const player = await bs.getPlayer(tag);
      res.json(analytics.summarisePlayer(player));
    } catch (err) {
      next(err);
    }
  },
);

/** Enriched per-brawler view (unlocked slots, maxed flag, …). */
router.get(
  "/players/:tag/brawlers",
  validate("params", TagParam),
  async (req, res, next) => {
    try {
      const { tag } = req.params as unknown as { tag: string };
      const player = await bs.getPlayer(tag);
      res.json({
        tag: player.tag,
        name: player.name,
        items: analytics.enrichBrawlers(player),
      });
    } catch (err) {
      next(err);
    }
  },
);

/** Win-rate, streaks, per-mode/-brawler/-map aggregates from the last 25 battles. */
router.get(
  "/players/:tag/battlelog",
  validate("params", TagParam),
  async (req, res, next) => {
    try {
      const { tag } = req.params as unknown as { tag: string };
      const log = await bs.getPlayerBattlelog(tag, undefined);
      // Normalize the player tag the upstream uses (with leading #) for matching.
      res.json(analytics.analyseBattlelog(log, `#${tag}`));
    } catch (err) {
      next(err);
    }
  },
);

/**
 * One-shot profile: player + summary + battlelog analytics in a single
 * response. Two upstream calls are issued in parallel.
 */
router.get(
  "/players/:tag/profile",
  validate("params", TagParam),
  async (req, res, next) => {
    try {
      const { tag } = req.params as unknown as { tag: string };
      const [player, log] = await Promise.all([
        bs.getPlayer(tag),
        bs
          .getPlayerBattlelog(tag, undefined)
          .catch(() => null),
      ]);
      const payload: PlayerProfileAnalytics = {
        player,
        summary: analytics.summarisePlayer(player),
        battlelog: log
          ? analytics.analyseBattlelog(log, `#${tag}`)
          : null,
        computedAt: new Date().toISOString(),
      };
      res.json(payload);
    } catch (err) {
      next(err);
    }
  },
);

/** Compare two players side by side. */
router.get(
  "/players/:tag/compare/:otherTag",
  validate("params", TwoTagsParam),
  async (req, res, next) => {
    try {
      const { tag, otherTag } = req.params as unknown as {
        tag: string;
        otherTag: string;
      };
      const [a, b] = await Promise.all([
        bs.getPlayer(tag),
        bs.getPlayer(otherTag),
      ]);
      res.json(analytics.comparePlayers(a, b));
    } catch (err) {
      next(err);
    }
  },
);

/** Club aggregates (avg/median/spread/role distribution). */
router.get(
  "/clubs/:tag/summary",
  validate("params", TagParam),
  async (req, res, next) => {
    try {
      const { tag } = req.params as unknown as { tag: string };
      const club = await bs.getClub(tag);
      res.json(analytics.summariseClub(club));
    } catch (err) {
      next(err);
    }
  },
);

export default router;
