/**
 * Type definitions for the official Brawl Stars API.
 * Reference: https://developer.brawlstars.com/#/documentation
 *
 * Fields are typed defensively — the upstream API has been observed to add
 * fields without warning, so consumers should treat unknown shapes as
 * forward-compatible.
 */

export interface Paging {
  cursors: {
    after?: string;
    before?: string;
  };
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

export interface BrawlerGear {
  id: number;
  name: string;
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
  // Some accounts surface deprecated/legacy fields:
  highestPowerPlayPoints?: number;
  powerPlayPoints?: number;
}

export type BattleResult = "victory" | "defeat" | "draw";

export type ClubMemberRole =
  | "notMember"
  | "member"
  | "president"
  | "senior"
  | "vicePresident"
  | "unknown";

export type ClubType = "open" | "inviteOnly" | "closed" | "unknown";

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
   * `brawlers` — un tableau — à la place). Toujours résoudre via un fallback.
   */
  brawler?: BattleBrawler;
  brawlers?: BattleBrawler[];
}

export interface BattleEvent {
  id: number;
  mode: string;
  map: string;
}

/**
 * The shape of `battle` varies per mode:
 *  - 3v3 modes (gemGrab, brawlBall, …): `result` + `teams[][]`
 *  - Solo modes (soloShowdown, …): `rank` + `players[]`
 *  - Duo modes / boss fights: hybrid shapes
 * All fields are therefore optional and consumers should check at runtime.
 */
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
  battleTime: string; // YYYYMMDDTHHMMSS.000Z
  event: BattleEvent;
  battle: Battle;
}

export type BattleLog = PaginatedList<BattleLogItem>;

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

export interface Brawler {
  id: number;
  name: string;
  starPowers: BrawlerEquipment[];
  gadgets: BrawlerEquipment[];
}

export type BrawlerList = PaginatedList<Brawler>;

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

export interface BrawlerRanking extends PlayerRanking {}
export type BrawlerRankingList = PaginatedList<BrawlerRanking>;

export interface ScheduledEvent {
  slotId: number;
  startTime: string;
  endTime: string;
  event: BattleEvent;
}

export type EventRotation = ScheduledEvent[];
