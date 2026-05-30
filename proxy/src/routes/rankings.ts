import { Router } from "express";
import { z } from "zod";
import * as bs from "../services/brawlstars.js";
import { CountryCodeSchema } from "../config/countries.js";
import {
  PaginationQuerySchema,
  validate,
} from "../middleware/validate.js";

const router = Router();

const CountryParam = z.object({ countryCode: CountryCodeSchema });
const CountryBrawlerParam = z.object({
  countryCode: CountryCodeSchema,
  brawlerId: z.coerce.number().int().positive(),
});

router.get(
  "/:countryCode/players",
  validate("params", CountryParam),
  validate("query", PaginationQuerySchema),
  async (req, res, next) => {
    try {
      const { countryCode } = req.params as unknown as {
        countryCode: string;
      };
      const query = req.query as unknown as z.infer<
        typeof PaginationQuerySchema
      >;
      const data = await bs.getPlayerRankings(countryCode, query);
      res.json(data);
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  "/:countryCode/clubs",
  validate("params", CountryParam),
  validate("query", PaginationQuerySchema),
  async (req, res, next) => {
    try {
      const { countryCode } = req.params as unknown as {
        countryCode: string;
      };
      const query = req.query as unknown as z.infer<
        typeof PaginationQuerySchema
      >;
      const data = await bs.getClubRankings(countryCode, query);
      res.json(data);
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  "/:countryCode/brawlers/:brawlerId",
  validate("params", CountryBrawlerParam),
  validate("query", PaginationQuerySchema),
  async (req, res, next) => {
    try {
      const { countryCode, brawlerId } = req.params as unknown as {
        countryCode: string;
        brawlerId: number;
      };
      const query = req.query as unknown as z.infer<
        typeof PaginationQuerySchema
      >;
      const data = await bs.getBrawlerRankings(
        countryCode,
        brawlerId,
        query,
      );
      res.json(data);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
