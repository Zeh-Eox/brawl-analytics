import type { BattleResult, Player, PlayerBrawler } from "./brawlstars";

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
    maxedOut: number;
    fullyRanked: number;
    totalGadgets: number;
    totalStarPowers: number;
    totalGears: number;
    trophiesSum: number;
    bestBrawlerTrophies: number;
    bestBrawlerName: string | null;
  };
  rankDistribution: Record<string, number>;
  powerDistribution: Record<string, number>;
  trophyDistribution: Record<string, number>;
  completion: {
    starPowers: number;
    gadgets: number;
    gears: number;
    overall: number;
  };
}

export interface BrawlerEnriched extends PlayerBrawler {
  unlockedSlots: number;
  isMaxed: boolean;
  isFullyRanked: boolean;
}

export interface BattlelogAnalytics {
  totalBattles: number;
  countedBattles: number;
  results: Record<BattleResult, number>;
  winRate: number;
  drawRate: number;
  totalTrophyChange: number;
  averageTrophyChange: number;
  starPlayerAppearances: number;
  starPlayerRate: number;
  longestWinStreak: number;
  currentStreak: { type: BattleResult | null; length: number };
  averageDurationSeconds: number | null;
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
  maps: Array<{
    map: string;
    mode: string;
    battles: number;
    wins: number;
    winRate: number;
  }>;
  window: { from: string | null; to: string | null };
}

export interface PlayerProfileAnalytics {
  player: Player;
  summary: PlayerSummary;
  battlelog: BattlelogAnalytics | null;
  computedAt: string;
}
