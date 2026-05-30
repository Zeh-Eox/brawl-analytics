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
  const seen = new Map<string, BattleLogItem>();
  for (const item of loadBattles(tag)) seen.set(battleId(item), item);
  // Fresh items overwrite stored ones (in case the API enriches a field).
  for (const item of fresh) seen.set(battleId(item), item);

  const merged = [...seen.values()].sort((a, b) =>
    b.battleTime.localeCompare(a.battleTime),
  );
  const capped = merged.slice(0, MAX_STORED);
  saveBattles(tag, capped);
  return capped;
}

export function clearBattles(tag: string): void {
  try {
    localStorage.removeItem(key(tag));
  } catch {
    /* noop */
  }
}
