/**
 * Types describing the official Brawl Stars API responses (as returned by
 * our proxy passthrough routes). Kept in sync with proxy/src/types/brawlstars.ts.
 */

export interface Paging {
  cursors: { after?: string; before?: string };
}
export interface PaginatedList<T> {
  items: T[];
  paging: Paging;
}

export interface PlayerIcon {
  id: number;
}
export interface PlayerClubRef {
  tag: string;
  name: string;
}
export interface BrawlerEquipment {
  id: number;
  name: string;
}
export interface BrawlerGear extends BrawlerEquipment {
  level: number;
}

export interface PlayerBrawler {
  id: number;
  name: string;
  power: number;
  rank: number;
  trophies: number;
  highestTrophies: number;
  gears: BrawlerGear[];
  starPowers: BrawlerEquipment[];
  gadgets: BrawlerEquipment[];
}

export interface Player {
  tag: string;
  name: string;
  nameColor: string;
  icon: PlayerIcon;
  trophies: number;
  highestTrophies: number;
  expLevel: number;
  expPoints: number;
  isQualifiedFromChampionshipChallenge: boolean;
  "3vs3Victories": number;
  soloVictories: number;
  duoVictories: number;
  bestRoboRumbleTime: number;
  bestTimeAsBigBrawler: number;
  club: PlayerClubRef | Record<string, never>;
  brawlers: PlayerBrawler[];
  // Legacy fields some accounts still surface from Power Play era.
  highestPowerPlayPoints?: number;
  powerPlayPoints?: number;
}

export type BattleResult = "victory" | "defeat" | "draw";

export interface BattleBrawler {
  id: number;
  name: string;
  power: number;
  trophies: number;
}
export interface BattlePlayer {
  tag: string;
  name: string;
  /**
   * Le brawler joué. ABSENT dans certains modes (ex. Duels, où l'API renvoie
   * `brawlers` — un tableau — à la place). Résoudre via `battleBrawlerOf`.
   */
  brawler?: BattleBrawler;
  brawlers?: BattleBrawler[];
}
export interface BattleEvent {
  id: number;
  mode: string;
  map: string;
  /** Petit entier officiel ; l'icône Brawlify = 48000000 + modeId. */
  modeId?: number;
}
export interface Battle {
  mode: string;
  type: string;
  result?: BattleResult;
  rank?: number;
  duration?: number;
  trophyChange?: number;
  starPlayer?: BattlePlayer | null;
  teams?: BattlePlayer[][];
  players?: BattlePlayer[];
  bigBrawler?: BattlePlayer;
}
export interface BattleLogItem {
  battleTime: string;
  event: BattleEvent;
  battle: Battle;
}
export type BattleLog = PaginatedList<BattleLogItem>;

export interface ScheduledEvent {
  slotId: number;
  startTime: string;
  endTime: string;
  event: BattleEvent;
}

// ---- Clubs ----
export type ClubMemberRole =
  | "notMember"
  | "member"
  | "president"
  | "senior"
  | "vicePresident"
  | "unknown";

export type ClubType = "open" | "inviteOnly" | "closed" | "unknown";

export interface ClubMember {
  tag: string;
  name: string;
  nameColor: string;
  role: ClubMemberRole;
  trophies: number;
  icon: PlayerIcon;
}

export interface Club {
  tag: string;
  name: string;
  description: string;
  type: ClubType;
  badgeId: number;
  requiredTrophies: number;
  trophies: number;
  members: ClubMember[];
}
export type ClubMemberList = PaginatedList<ClubMember>;

// ---- Rankings ----
export interface PlayerRanking {
  tag: string;
  name: string;
  nameColor: string;
  icon: PlayerIcon;
  trophies: number;
  rank: number;
  club?: { name: string };
}
export type PlayerRankingList = PaginatedList<PlayerRanking>;

export interface ClubRanking {
  tag: string;
  name: string;
  badgeId: number;
  trophies: number;
  rank: number;
  memberCount: number;
}
export type ClubRankingList = PaginatedList<ClubRanking>;
