import type {
  BattleLogItem,
  BattlePlayer,
  BattleResult,
} from "../types/brawlstars";
import type { BattlelogAnalytics } from "../types/analytics";
import { battleBrawlerOf } from "./sessions";

const safeDiv = (n: number, d: number) => (d === 0 ? 0 : n / d);
const round = (n: number, decimals = 4) => {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
};

function findOwn(item: BattleLogItem, playerTag: string): BattlePlayer | null {
  for (const team of item.battle.teams ?? []) {
    for (const p of team) if (p.tag === playerTag) return p;
  }
  for (const p of item.battle.players ?? [])
    if (p.tag === playerTag) return p;
  return null;
}

const parseBattleTime = (s: string): string | null => {
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})\.(\d{3})Z$/.exec(s);
  if (!m) return null;
  const [, y, mo, d, h, mi, sec, ms] = m;
  return `${y}-${mo}-${d}T${h}:${mi}:${sec}.${ms}Z`;
};

/**
 * Client-side mirror of proxy/src/services/analytics.ts → analyseBattlelog.
 * Used so we can compute stats on the *accumulated* local archive rather than
 * only the 25 the API just returned.
 */
export function analyseBattlelog(
  items: BattleLogItem[],
  playerTag: string,
): BattlelogAnalytics {
  const slices = items.map((item) => {
    const own = findOwn(item, playerTag);
    const ownB = own ? battleBrawlerOf(own) : null;
    return {
      result: (item.battle.result ?? null) as BattleResult | null,
      trophyChange: item.battle.trophyChange ?? 0,
      duration: item.battle.duration ?? null,
      starPlayerTag: item.battle.starPlayer?.tag ?? null,
      isStarPlayer: item.battle.starPlayer?.tag === playerTag,
      ownBrawler: ownB ? { id: ownB.id, name: ownB.name } : null,
    };
  });

  const counted = slices.filter((s) => s.result !== null);
  const wins = counted.filter((s) => s.result === "victory").length;
  const losses = counted.filter((s) => s.result === "defeat").length;
  const draws = counted.filter((s) => s.result === "draw").length;

  // Streaks — walk chronologically.
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
      if (currentType === s.result) currentLength += 1;
      else {
        currentType = s.result;
        currentLength = 1;
      }
    }
  }

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
  for (let i = 0; i < items.length; i += 1) {
    const item = items[i]!;
    const s = slices[i]!;
    const mode = item.battle.mode || item.event.mode || "unknown";
    const e = modeAgg.get(mode) ?? {
      battles: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      trophyChange: 0,
    };
    e.battles += 1;
    e.trophyChange += s.trophyChange;
    if (s.result === "victory") e.wins += 1;
    else if (s.result === "defeat") e.losses += 1;
    else if (s.result === "draw") e.draws += 1;
    modeAgg.set(mode, e);
  }
  const modes = [...modeAgg.entries()]
    .map(([mode, v]) => ({
      mode,
      ...v,
      winRate: round(safeDiv(v.wins, v.wins + v.losses + v.draws)),
    }))
    .sort((a, b) => b.battles - a.battles);

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

  const mapAgg = new Map<
    string,
    { map: string; mode: string; battles: number; wins: number }
  >();
  for (let i = 0; i < items.length; i += 1) {
    const item = items[i]!;
    const s = slices[i]!;
    const map = item.event.map ?? "unknown";
    const mode = item.event.mode ?? "unknown";
    const k = `${mode}::${map}`;
    const cur = mapAgg.get(k) ?? { map, mode, battles: 0, wins: 0 };
    cur.battles += 1;
    if (s.result === "victory") cur.wins += 1;
    mapAgg.set(k, cur);
  }
  const maps = [...mapAgg.values()]
    .map((m) => ({ ...m, winRate: round(safeDiv(m.wins, m.battles)) }))
    .sort((a, b) => b.battles - a.battles);

  const isoTimestamps = items
    .map((i) => parseBattleTime(i.battleTime))
    .filter((t): t is string => t !== null)
    .sort();
  const from = isoTimestamps[0] ?? null;
  const to = isoTimestamps[isoTimestamps.length - 1] ?? null;

  const totalTrophyChange = slices.reduce((a, s) => a + s.trophyChange, 0);
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
      durations.length === 0
        ? null
        : round(durations.reduce((a, b) => a + b, 0) / durations.length, 2),
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
