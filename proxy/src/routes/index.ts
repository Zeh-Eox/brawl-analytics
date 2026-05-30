import { Router } from "express";
import players from "./players.js";
import clubs from "./clubs.js";
import brawlers from "./brawlers.js";
import rankings from "./rankings.js";
import events from "./events.js";
import analytics from "./analytics.js";

const router = Router();

// Health probe — does not hit upstream.
router.get("/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

router.get("/", (_req, res) => {
  res.json({
    name: "brawl-analytics-proxy",
    endpoints: {
      health: "/health",
      players: "/players/:tag, /players/:tag/battlelog",
      clubs: "/clubs/:tag, /clubs/:tag/members",
      brawlers: "/brawlers, /brawlers/:brawlerId",
      rankings:
        "/rankings/:countryCode/players, /rankings/:countryCode/clubs, /rankings/:countryCode/brawlers/:brawlerId",
      events: "/events/rotation",
      analytics: [
        "/analytics/players/:tag/summary",
        "/analytics/players/:tag/brawlers",
        "/analytics/players/:tag/battlelog",
        "/analytics/players/:tag/profile",
        "/analytics/players/:tag/compare/:otherTag",
        "/analytics/clubs/:tag/summary",
      ],
    },
  });
});

router.use("/players", players);
router.use("/clubs", clubs);
router.use("/brawlers", brawlers);
router.use("/rankings", rankings);
router.use("/events", events);
router.use("/analytics", analytics);

export default router;
