import type {
  BattleLog,
  BattleLogItem,
  BattleResult,
  Club,
  Player,
  PlayerBrawler,
} from "../types/brawlstars.js";
import type {
  BattlelogAnalytics,
  BrawlerEnriched,
  ClubSummary,
  PlayerComparison,
  PlayerSummary,
} from "../types/analytics.js";

// ------------------------------------------------------------------
// Constants (kit capacity per brawler is set by the game)
// ------------------------------------------------------------------

const MAX_STAR_POWERS = 2;
const MAX_GADGETS = 3;
const MAX_GEARS = 3;
const MAX_POWER_LEVEL = 11;
const MAX_RANK = 35;

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

const safeDiv = (n: number, d: number): number => (d === 0 ? 0 : n / d);

const sum = (xs: number[]): number => xs.reduce((a, b) => a + b, 0);

const round = (n: number, decimals = 4): number => {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
};

const median = (xs: number[]): number => {
  if (xs.length === 0) return 0;
  const sorted = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    // Both indexes are in-bounds; coerce away the noUncheckedIndexedAccess undefined.
    return ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
  }
  return sorted[mid] ?? 0;
};

const stddev = (xs: number[]): number => {
  if (xs.length === 0) return 0;
  const mean = sum(xs) / xs.length;
  const variance = sum(xs.map((x) => (x - mean) ** 2)) / xs.length;
  return Math.sqrt(variance);
};

const rankBucket = (rank: number): string => {
  if (rank >= 30) return "30+";
  if (rank >= 25) return "25-29";
  if (rank >= 20) return "20-24";
  if (rank >= 15) return "15-19";
  if (rank >= 10) return "10-14";
  return "1-9";
};

const powerBucket = (power: number): string => {
  if (power >= 11) return "11";
  if (power >= 10) return "10";
  return "1-9";
};

const trophyBucket = (t: number): string => {
  if (t >= 1000) return "1000+";
  if (t >= 700) return "700-999";
  if (t >= 500) return "500-699";
  if (t >= 300) return "300-499";
  if (t >= 1) return "1-299";
  return "0";
};

/**
 * `battleTime` in the upstream API uses the compact form
 * `YYYYMMDDTHHMMSS.000Z`. Convert it to a real ISO-8601 string.
 */
const parseBattleTime = (s: string): string | null => {
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})\.(\d{3})Z$/.exec(s);
  if (!m) return null;
  const [, y, mo, d, h, mi, sec, ms] = m;
  return `${y}-${mo}-${d}T${h}:${mi}:${sec}.${ms}Z`;
};

// ------------------------------------------------------------------
// Player summary
// ------------------------------------------------------------------

export function summarisePlayer(player: Player): PlayerSummary {
  const brawlers = player.brawlers;
  const count = brawlers.length;

  const trophiesPerBrawler = brawlers.map((b) => b.trophies);
  const powers = brawlers.map((b) => b.power);

  const totalStarPowers = sum(brawlers.map((b) => b.starPowers.length));
  const totalGadgets = sum(brawlers.map((b) => b.gadgets.length));
  const totalGears = sum(brawlers.map((b) => b.gears.length));

  const maxStarPowers = count * MAX_STAR_POWERS;
  const maxGadgets = count * MAX_GADGETS;
  const maxGears = count * MAX_GEARS;

  const rankDistribution = brawlers.reduce<Record<string, number>>((acc, b) => {
    const k = rankBucket(b.rank);
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});
  const powerDistribution = brawlers.reduce<Record<string, number>>(
    (acc, b) => {
      const k = powerBucket(b.power);
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    },
    {},
  );
  const trophyDistribution = brawlers.reduce<Record<string, number>>(
    (acc, b) => {
      const k = trophyBucket(b.trophies);
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    },
    {},
  );

  const bestBrawler = brawlers.reduce<PlayerBrawler | null>((best, b) => {
    if (!best || b.highestTrophies > best.highestTrophies) return b;
    return best;
  }, null);

  const totalVictories =
    player["3vs3Victories"] + player.soloVictories + player.duoVictories;

  return {
    tag: player.tag,
    name: player.name,
    trophies: player.trophies,
    highestTrophies: player.highestTrophies,
    expLevel: player.expLevel,
    expPoints: player.expPoints,
    totalVictories,
    brawlers: {
      owned: count,
      averageTrophies: round(safeDiv(sum(trophiesPerBrawler), count), 2),
      averagePower: round(safeDiv(sum(powers), count), 2),
      maxedOut: brawlers.filter((b) => b.power >= MAX_POWER_LEVEL).length,
      fullyRanked: brawlers.filter((b) => b.rank >= MAX_RANK).length,
      totalGadgets,
      totalStarPowers,
      totalGears,
      trophiesSum: sum(trophiesPerBrawler),
      bestBrawlerTrophies: bestBrawler?.highestTrophies ?? 0,
      bestBrawlerName: bestBrawler?.name ?? null,
    },
    rankDistribution,
    powerDistribution,
    trophyDistribution,
    completion: {
      starPowers: round(safeDiv(totalStarPowers, maxStarPowers)),
      gadgets: round(safeDiv(totalGadgets, maxGadgets)),
      gears: round(safeDiv(totalGears, maxGears)),
      overall: round(
        safeDiv(
          totalStarPowers + totalGadgets + totalGears,
          maxStarPowers + maxGadgets + maxGears,
        ),
      ),
    },
  };
}

export function enrichBrawlers(player: Player): BrawlerEnriched[] {
  return player.brawlers
    .map<BrawlerEnriched>((b) => ({
      ...b,
      unlockedSlots: b.starPowers.length + b.gadgets.length + b.gears.length,
      isMaxed: b.power >= MAX_POWER_LEVEL,
      isFullyRanked: b.rank >= MAX_RANK,
    }))
    .sort((a, b) => b.trophies - a.trophies);
}

// ------------------------------------------------------------------
// Battle-log analytics
// ------------------------------------------------------------------

interface BattleSlice {
  result: BattleResult | null;
  trophyChange: number;
  duration: number | null;
  starPlayerTag: string | null;
  /** Brawler the user piloted in this battle, if discoverable. */
  ownBrawler: { id: number; name: string } | null;
  isStarPlayer: boolean;
}

const findOwnBrawler = (
  item: BattleLogItem,
  playerTag: string,
): BattleSlice["ownBrawler"] => {
  const teams = item.battle.teams;
  if (teams) {
    for (const team of teams) {
      for (const p of team) {
        if (p.tag === playerTag) return { id: p.brawler.id, name: p.brawler.name };
      }
    }
  }
  const players = item.battle.players;
  if (players) {
    for (const p of players) {
      if (p.tag === playerTag) return { id: p.brawler.id, name: p.brawler.name };
    }
  }
  if (item.battle.bigBrawler?.tag === playerTag) {
    return {
      id: item.battle.bigBrawler.brawler.id,
      name: item.battle.bigBrawler.brawler.name,
    };
  }
  return null;
};

const sliceBattle = (item: BattleLogItem, playerTag: string): BattleSlice => {
  const result = (item.battle.result ?? null) as BattleResult | null;
  const trophyChange = item.battle.trophyChange ?? 0;
  const duration = item.battle.duration ?? null;
  const starPlayerTag = item.battle.starPlayer?.tag ?? null;
  return {
    result,
    trophyChange,
    duration,
    starPlayerTag,
    isStarPlayer: starPlayerTag !== null && starPlayerTag === playerTag,
    ownBrawler: findOwnBrawler(item, playerTag),
  };
};

export function analyseBattlelog(
  log: BattleLog,
  playerTag: string,
): BattlelogAnalytics {
  const items = log.items ?? [];
  const slices = items.map((i) => sliceBattle(i, playerTag));

  const counted = slices.filter((s) => s.result !== null);
  const wins = counted.filter((s) => s.result === "victory").length;
  const losses = counted.filter((s) => s.result === "defeat").length;
  const draws = counted.filter((s) => s.result === "draw").length;

  // Streaks — walk chronologically (the API returns most-recent-first).
  const chronological = [...slices].reverse();
  let longestWinStreak = 0;
  let runWin = 0;
  let currentLength = 0;
  let currentType: BattleResult | null = null;
  for (const s of chronological) {
    if (s.result === "victory") {
      runWin += 1;
      if (runWin > longestWinStreak) longestWinStreak = runWin;
    } else {
      runWin = 0;
    }
    if (s.result !== null) {
      if (currentType === s.result) {
        currentLength += 1;
      } else {
        currentType = s.result;
        currentLength = 1;
      }
    }
  }

  // Per-mode breakdown
  const modeAgg = new Map<
    string,
    {
      battles: number;
      wins: number;
      losses: number;
      draws: number;
      trophyChange: number;
    }
  >();
  for (let idx = 0; idx < items.length; idx += 1) {
    const item = items[idx]!;
    const s = slices[idx]!;
    const mode = item.battle.mode || item.event.mode || "unknown";
    const entry = modeAgg.get(mode) ?? {
      battles: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      trophyChange: 0,
    };
    entry.battles += 1;
    entry.trophyChange += s.trophyChange;
    if (s.result === "victory") entry.wins += 1;
    else if (s.result === "defeat") entry.losses += 1;
    else if (s.result === "draw") entry.draws += 1;
    modeAgg.set(mode, entry);
  }

  const modes = [...modeAgg.entries()]
    .map(([mode, v]) => ({
      mode,
      ...v,
      winRate: round(safeDiv(v.wins, v.wins + v.losses + v.draws)),
    }))
    .sort((a, b) => b.battles - a.battles);

  // Per-brawler breakdown
  const brawlerAgg = new Map<
    number,
    {
      name: string;
      battles: number;
      wins: number;
      losses: number;
      draws: number;
      trophyChange: number;
    }
  >();
  for (const s of slices) {
    if (!s.ownBrawler) continue;
    const cur = brawlerAgg.get(s.ownBrawler.id) ?? {
      name: s.ownBrawler.name,
      battles: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      trophyChange: 0,
    };
    cur.battles += 1;
    cur.trophyChange += s.trophyChange;
    if (s.result === "victory") cur.wins += 1;
    else if (s.result === "defeat") cur.losses += 1;
    else if (s.result === "draw") cur.draws += 1;
    brawlerAgg.set(s.ownBrawler.id, cur);
  }
  const brawlers = [...brawlerAgg.entries()]
    .map(([id, v]) => ({
      id,
      name: v.name,
      battles: v.battles,
      wins: v.wins,
      losses: v.losses,
      draws: v.draws,
      trophyChange: v.trophyChange,
      winRate: round(safeDiv(v.wins, v.wins + v.losses + v.draws)),
    }))
    .sort((a, b) => b.battles - a.battles);

  // Per-map breakdown
  const mapAgg = new Map<
    string,
    { map: string; mode: string; battles: number; wins: number }
  >();
  for (let idx = 0; idx < items.length; idx += 1) {
    const item = items[idx]!;
    const s = slices[idx]!;
    const map = item.event.map ?? "unknown";
    const mode = item.event.mode ?? "unknown";
    const key = `${mode}::${map}`;
    const cur = mapAgg.get(key) ?? { map, mode, battles: 0, wins: 0 };
    cur.battles += 1;
    if (s.result === "victory") cur.wins += 1;
    mapAgg.set(key, cur);
  }
  const maps = [...mapAgg.values()]
    .map((m) => ({ ...m, winRate: round(safeDiv(m.wins, m.battles)) }))
    .sort((a, b) => b.battles - a.battles);

  // Window timestamps
  const isoTimestamps = items
    .map((i) => parseBattleTime(i.battleTime))
    .filter((t): t is string => t !== null)
    .sort();
  const from = isoTimestamps[0] ?? null;
  const to = isoTimestamps[isoTimestamps.length - 1] ?? null;

  const totalTrophyChange = sum(slices.map((s) => s.trophyChange));
  const durations = slices
    .map((s) => s.duration)
    .filter((d): d is number => d !== null);

  const starPlayerEligible = slices.filter(
    (s) => s.starPlayerTag !== null,
  ).length;
  const starPlayerAppearances = slices.filter((s) => s.isStarPlayer).length;

  return {
    totalBattles: items.length,
    countedBattles: counted.length,
    results: { victory: wins, defeat: losses, draw: draws },
    winRate: round(safeDiv(wins, counted.length)),
    drawRate: round(safeDiv(draws, counted.length)),
    totalTrophyChange,
    averageTrophyChange: round(safeDiv(totalTrophyChange, items.length), 2),
    starPlayerAppearances,
    starPlayerRate: round(safeDiv(starPlayerAppearances, starPlayerEligible)),
    longestWinStreak,
    currentStreak: { type: currentType, length: currentLength },
    averageDurationSeconds:
      durations.length === 0 ? null : round(safeDiv(sum(durations), durations.length), 2),
    modes,
    favoriteMode: modes[0]?.mode ?? null,
    brawlers,
    favoriteBrawler: brawlers[0]
      ? { id: brawlers[0].id, name: brawlers[0].name }
      : null,
    maps,
    window: { from, to },
  };
}

// ------------------------------------------------------------------
// Club summary
// ------------------------------------------------------------------

export function summariseClub(club: Club): ClubSummary {
  const members = club.members ?? [];
  const trophies = members.map((m) => m.trophies);

  const roleDistribution = members.reduce<Record<string, number>>((acc, m) => {
    const r = m.role ?? "unknown";
    acc[r] = (acc[r] ?? 0) + 1;
    return acc;
  }, {});

  const sortedDesc = [...members].sort((a, b) => b.trophies - a.trophies);
  const topContributors = sortedDesc.slice(0, 5).map((m) => ({
    tag: m.tag,
    name: m.name,
    trophies: m.trophies,
    role: m.role,
  }));

  return {
    tag: club.tag,
    name: club.name,
    type: club.type,
    trophies: club.trophies,
    requiredTrophies: club.requiredTrophies,
    memberCount: members.length,
    averageTrophies: round(safeDiv(sum(trophies), members.length), 2),
    medianTrophies: median(trophies),
    minTrophies: trophies.length === 0 ? 0 : Math.min(...trophies),
    maxTrophies: trophies.length === 0 ? 0 : Math.max(...trophies),
    trophySpread: round(stddev(trophies), 2),
    belowRequirement: members.filter((m) => m.trophies < club.requiredTrophies)
      .length,
    roleDistribution,
    topContributors,
  };
}

// ------------------------------------------------------------------
// Comparison
// ------------------------------------------------------------------

export function comparePlayers(a: Player, b: Player): PlayerComparison {
  const sa = summarisePlayer(a);
  const sb = summarisePlayer(b);
  const trophyLeader: PlayerComparison["trophyLeader"] =
    sa.trophies === sb.trophies
      ? "tie"
      : sa.trophies > sb.trophies
        ? "playerA"
        : "playerB";
  return {
    players: [sa, sb],
    diff: {
      trophies: sa.trophies - sb.trophies,
      highestTrophies: sa.highestTrophies - sb.highestTrophies,
      expLevel: sa.expLevel - sb.expLevel,
      totalVictories: sa.totalVictories - sb.totalVictories,
      brawlersOwned: sa.brawlers.owned - sb.brawlers.owned,
      maxedOut: sa.brawlers.maxedOut - sb.brawlers.maxedOut,
      fullyRanked: sa.brawlers.fullyRanked - sb.brawlers.fullyRanked,
      starPowers: sa.brawlers.totalStarPowers - sb.brawlers.totalStarPowers,
      gadgets: sa.brawlers.totalGadgets - sb.brawlers.totalGadgets,
      gears: sa.brawlers.totalGears - sb.brawlers.totalGears,
    },
    trophyLeader,
  };
}
