import type { BattleLogItem } from "../types/brawlstars";

/** "YYYYMMDDTHHMMSS.000Z" → epoch ms. */
export function battleTimeMs(bt: string): number {
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/.exec(bt);
  if (!m) return NaN;
  const [, y, mo, d, h, mi, s] = m;
  return Date.parse(`${y}-${mo}-${d}T${h}:${mi}:${s}Z`);
}

export type Outcome = "victory" | "defeat" | "draw" | "other";

/** Issue normalisée d'un combat (gère 3v3 et le classement showdown). */
export function outcomeOf(item: BattleLogItem): Outcome {
  const r = item.battle.result;
  if (r === "victory" || r === "defeat" || r === "draw") return r;
  if (typeof item.battle.rank === "number") {
    return item.battle.rank <= 4 ? "victory" : "defeat";
  }
  return "other";
}

/** Le brawler joué par le tag donné dans ce combat (ou null). */
export function myBrawler(
  item: BattleLogItem,
  myTag: string,
): { id: number; name: string } | null {
  const all = [
    ...(item.battle.teams?.flat() ?? []),
    ...(item.battle.players ?? []),
  ];
  const me = all.find((p) => p.tag === myTag);
  return me ? { id: me.brawler.id, name: me.brawler.name } : null;
}

export interface Session {
  start: string; // ISO (plus ancien)
  end: string; // ISO (plus récent)
  items: BattleLogItem[];
  wins: number;
  losses: number;
  draws: number;
  trophyDelta: number;
  playedSec: number;
}

/**
 * Regroupe des combats (triés du plus récent au plus ancien) en sessions :
 * une coupure est introduite dès que l'écart entre deux combats consécutifs
 * dépasse `gapMs`. Chaque session résume W/L, delta trophées et durée jouée.
 */
export function groupSessions(
  items: BattleLogItem[],
  gapMs = 45 * 60_000,
): Session[] {
  if (items.length === 0) return [];
  const sorted = [...items].sort((a, b) =>
    b.battleTime.localeCompare(a.battleTime),
  );

  const sessions: Session[] = [];
  let current: BattleLogItem[] = [];

  const flush = () => {
    if (current.length === 0) return;
    let wins = 0;
    let losses = 0;
    let draws = 0;
    let trophyDelta = 0;
    let playedSec = 0;
    for (const it of current) {
      const o = outcomeOf(it);
      if (o === "victory") wins += 1;
      else if (o === "defeat") losses += 1;
      else if (o === "draw") draws += 1;
      if (typeof it.battle.trophyChange === "number")
        trophyDelta += it.battle.trophyChange;
      if (typeof it.battle.duration === "number")
        playedSec += it.battle.duration;
    }
    sessions.push({
      start: current[current.length - 1]!.battleTime,
      end: current[0]!.battleTime,
      items: current,
      wins,
      losses,
      draws,
      trophyDelta,
      playedSec,
    });
    current = [];
  };

  for (let i = 0; i < sorted.length; i += 1) {
    const it = sorted[i]!;
    if (current.length === 0) {
      current.push(it);
      continue;
    }
    const prev = current[current.length - 1]!;
    const gap = battleTimeMs(prev.battleTime) - battleTimeMs(it.battleTime);
    if (Number.isFinite(gap) && gap > gapMs) {
      flush();
    }
    current.push(it);
  }
  flush();
  return sessions;
}
