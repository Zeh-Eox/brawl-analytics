/**
 * Computed/derived stats produced by this proxy on top of the official API.
 * None of these shapes mirror an upstream model — they are 100% additive.
 */

import type {
  BattleResult,
  Player,
  PlayerBrawler,
} from "./brawlstars.js";

export interface PlayerSummary {
  tag: string;
  name: string;
  trophies: number;
  highestTrophies: number;
  expLevel: number;
  expPoints: number;
  totalVictories: number;

  brawlers: {
    owned: number;
    averageTrophies: number;
    averagePower: number;
    maxedOut: number; // power 11
    fullyRanked: number; // rank 35
    totalGadgets: number;
    totalStarPowers: number;
    totalGears: number;
    /** Sum of trophies across all brawlers (cross-check with player.trophies). */
    trophiesSum: number;
    /** Highest trophies achieved on any single brawler. */
    bestBrawlerTrophies: number;
    bestBrawlerName: string | null;
  };

  /** Distribution by rank bucket (1-9, 10-14, 15-19, 20-24, 25-29, 30+). */
  rankDistribution: Record<string, number>;
  /** Distribution by power level (1-9, 10, 11). */
  powerDistribution: Record<string, number>;
  /** Distribution by trophies bucket per brawler (0, 1-299, 300-499, …). */
  trophyDistribution: Record<string, number>;

  /** Progression toward fully unlocking every brawler's kit, in [0, 1]. */
  completion: {
    starPowers: number;
    gadgets: number;
    gears: number;
    overall: number;
  };
}

export interface BrawlerEnriched extends PlayerBrawler {
  /** Total kit slots filled out of the maximum (2 SPs + 3 gadgets + 3 gears). */
  unlockedSlots: number;
  /** Whether the brawler is power 11. */
  isMaxed: boolean;
  /** Whether the brawler has hit rank 35. */
  isFullyRanked: boolean;
}

export interface BattlelogAnalytics {
  totalBattles: number;
  countedBattles: number; // battles with a clear win/draw/loss

  results: Record<BattleResult, number>;
  winRate: number; // [0, 1] across counted battles
  drawRate: number;

  totalTrophyChange: number;
  averageTrophyChange: number;

  starPlayerAppearances: number;
  starPlayerRate: number; // among 3v3 battles where the user was involved

  longestWinStreak: number;
  currentStreak: { type: BattleResult | null; length: number };

  averageDurationSeconds: number | null;

  /** Per-mode breakdown (e.g. "gemGrab", "brawlBall", "soloShowdown"). */
  modes: Array<{
    mode: string;
    battles: number;
    wins: number;
    losses: number;
    draws: number;
    winRate: number;
    trophyChange: number;
  }>;
  favoriteMode: string | null;

  /** Per-brawler breakdown of the brawlers the user piloted. */
  brawlers: Array<{
    id: number;
    name: string;
    battles: number;
    wins: number;
    losses: number;
    draws: number;
    winRate: number;
    trophyChange: number;
  }>;
  favoriteBrawler: { id: number; name: string } | null;

  /** Per-map breakdown. */
  maps: Array<{
    map: string;
    mode: string;
    battles: number;
    wins: number;
    winRate: number;
  }>;

  /** Earliest and latest battle timestamps in the analysed window (ISO 8601). */
  window: { from: string | null; to: string | null };
}

export interface PlayerProfileAnalytics {
  player: Player;
  summary: PlayerSummary;
  battlelog: BattlelogAnalytics | null;
  /** ISO timestamp of when this aggregate was computed by the proxy. */
  computedAt: string;
}

export interface ClubSummary {
  tag: string;
  name: string;
  type: string;
  trophies: number;
  requiredTrophies: number;

  memberCount: number;
  averageTrophies: number;
  medianTrophies: number;
  minTrophies: number;
  maxTrophies: number;
  /** Standard deviation of member trophies. */
  trophySpread: number;

  /** How many members are below the club's requiredTrophies. */
  belowRequirement: number;

  roleDistribution: Record<string, number>;

  topContributors: Array<{
    tag: string;
    name: string;
    trophies: number;
    role: string;
  }>;
}

export interface PlayerComparison {
  players: [PlayerSummary, PlayerSummary];
  diff: {
    trophies: number;
    highestTrophies: number;
    expLevel: number;
    totalVictories: number;
    brawlersOwned: number;
    maxedOut: number;
    fullyRanked: number;
    starPowers: number;
    gadgets: number;
    gears: number;
  };
  /** "playerA" | "playerB" | "tie" for the headline trophy comparison. */
  trophyLeader: "playerA" | "playerB" | "tie";
}
