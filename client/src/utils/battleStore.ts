import type { BattleLogItem } from "../types/brawlstars";

/**
 * Persistent battle archive in localStorage.
 *
 * The official Brawl Stars API only ever returns the 25 most recent battles
 * per request — there's no way to page deeper into history. By merging each
 * fresh fetch with what we've already seen for this tag, the archive grows
 * over time as the user revisits.
 *
 * Storage is per-tag and capped at MAX_STORED items.
 */
const PREFIX = "battle-history:";
const MAX_STORED = 200;

const key = (tag: string) => `${PREFIX}${tag.replace(/^#/, "").toUpperCase()}`;

const battleId = (b: BattleLogItem): string =>
  // battleTime + mode + map is unique per recorded battle.
  `${b.battleTime}::${b.battle.mode || b.event.mode || "?"}::${b.event.map || "?"}`;

export function loadBattles(tag: string): BattleLogItem[] {
  try {
    const raw = localStorage.getItem(key(tag));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as BattleLogItem[]) : [];
  } catch {
    return [];
  }
}

export function saveBattles(tag: string, items: BattleLogItem[]): void {
  try {
    localStorage.setItem(key(tag), JSON.stringify(items));
  } catch {
    // localStorage might be disabled or full — ignore.
  }
}

/**
 * Merge a fresh batch with the persisted archive, dedupe, sort newest first,
 * cap, persist. Returns the merged list.
 */
export function mergeBattles(
  tag: string,
  fresh: BattleLogItem[],
): BattleLogItem[] {
  const existing = loadBattles(tag);
  const existingIds = new Set(existing.map(battleId));

  // Migration : si le compteur cumulé est vierge mais qu'une archive existe
  // déjà, on l'amorce une fois depuis les combats déjà stockés.
  const pt0 = loadPlaytime(tag);
  if (pt0.sec === 0 && pt0.n === 0 && existing.length > 0) {
    let s = 0;
    let c = 0;
    for (const it of existing) {
      const d = it.battle.duration;
      if (typeof d === "number" && d > 0) {
        s += d;
        c += 1;
      }
    }
    savePlaytime(tag, { sec: s, n: c });
  }

  // Cumul du temps de jeu : on ajoute la durée des combats JAMAIS vus, une
  // seule fois. Le compteur persiste même si le combat est ensuite évincé
  // de l'archive capée — il continue donc de grandir indéfiniment.
  let addSec = 0;
  let addN = 0;
  for (const item of fresh) {
    if (existingIds.has(battleId(item))) continue;
    const d = item.battle.duration;
    if (typeof d === "number" && d > 0) {
      addSec += d;
      addN += 1;
    }
  }
  if (addSec > 0 || addN > 0) {
    const pt = loadPlaytime(tag);
    savePlaytime(tag, { sec: pt.sec + addSec, n: pt.n + addN });
  }

  const seen = new Map<string, BattleLogItem>();
  for (const item of existing) seen.set(battleId(item), item);
  // Fresh items overwrite stored ones (in case the API enriches a field).
  for (const item of fresh) seen.set(battleId(item), item);

  const merged = [...seen.values()].sort((a, b) =>
    b.battleTime.localeCompare(a.battleTime),
  );
  const capped = merged.slice(0, MAX_STORED);
  saveBattles(tag, capped);
  return capped;
}

/* ---------- Temps de jeu cumulé (persiste au-delà du cap de l'archive) ---------- */
const PLAYTIME_PREFIX = "playtime:";
const ptKey = (tag: string) =>
  `${PLAYTIME_PREFIX}${tag.replace(/^#/, "").toUpperCase()}`;

export interface Playtime {
  /** Secondes cumulées en combat. */
  sec: number;
  /** Nombre de combats comptés. */
  n: number;
}

export function loadPlaytime(tag: string): Playtime {
  try {
    const raw = localStorage.getItem(ptKey(tag));
    if (raw) {
      const p = JSON.parse(raw) as Partial<Playtime>;
      if (typeof p?.sec === "number" && typeof p?.n === "number") {
        return { sec: p.sec, n: p.n };
      }
    }
  } catch {
    /* noop */
  }
  return { sec: 0, n: 0 };
}

function savePlaytime(tag: string, v: Playtime): void {
  try {
    localStorage.setItem(ptKey(tag), JSON.stringify(v));
  } catch {
    /* noop */
  }
}

export function clearBattles(tag: string): void {
  try {
    localStorage.removeItem(key(tag));
    localStorage.removeItem(ptKey(tag));
  } catch {
    /* noop */
  }
}
