import type { BattleLogItem } from "./brawlstars";

/** A captured trophy snapshot (server-side background poller). */
export interface TrophyPoint {
  t: string; // ISO
  trophies: number;
  highestTrophies: number;
  expLevel: number;
  victories: number;
  brawlers: number;
}

export interface TrackerStatus {
  tag: string;
  name?: string;
  tracked: boolean;
  firstSeen?: string;
  lastRequested?: string;
  lastPolled?: string | null;
  lastError?: string | null;
  battleCount: number;
  timelinePoints: number;
}

export interface TrackerBattles {
  tag: string;
  items: BattleLogItem[];
}

export interface TrackerTimeline {
  tag: string;
  points: TrophyPoint[];
}
