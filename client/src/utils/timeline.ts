import type { TrophyPoint } from "../types/tracker";
import type { ProfileSnapshot } from "./profileHistory";

export interface TimelinePoint {
  t: string; // ISO
  trophies: number;
  victories?: number;
}

/**
 * Fusionne la timeline serveur (capture en arrière-plan) avec les snapshots
 * locaux (une visite = un point). Dédoublonne par minute, trie par date.
 * La source serveur est prioritaire quand les deux coïncident.
 */
export function mergeTimeline(
  server: TrophyPoint[],
  local: ProfileSnapshot[],
): TimelinePoint[] {
  const byMinute = new Map<string, TimelinePoint>();
  const bucket = (iso: string) => iso.slice(0, 16); // yyyy-mm-ddThh:mm

  for (const s of local) {
    byMinute.set(bucket(s.t), { t: s.t, trophies: s.trophies });
  }
  // Le serveur écrase le local sur le même créneau (données plus riches).
  for (const p of server) {
    byMinute.set(bucket(p.t), {
      t: p.t,
      trophies: p.trophies,
      victories: p.victories,
    });
  }

  return [...byMinute.values()].sort((a, b) => a.t.localeCompare(b.t));
}

/**
 * Variation d'une métrique sur une fenêtre glissante (en ms). Compare la
 * dernière valeur au 1er point situé à l'intérieur de la fenêtre (ou, à défaut,
 * au tout premier point connu).
 */
export function deltaOver(
  points: TimelinePoint[],
  windowMs: number,
  key: "trophies" | "victories" = "trophies",
  now = Date.now(),
): number | null {
  const vals = points.filter((p) => typeof p[key] === "number");
  if (vals.length < 2) return null;
  const latest = vals[vals.length - 1]![key]!;
  const cutoff = now - windowMs;
  let baseline: number | null = null;
  for (const p of vals) {
    if (new Date(p.t).getTime() >= cutoff) {
      baseline = p[key]!;
      break;
    }
  }
  if (baseline === null) baseline = vals[0]![key]!; // rien dans la fenêtre
  return latest - baseline;
}

export const DAY_MS = 86_400_000;
