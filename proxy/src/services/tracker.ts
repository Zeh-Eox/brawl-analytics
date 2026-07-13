/**
 * Background capture ("tracker").
 *
 * The official API only ever returns the 25 most recent battles and exposes NO
 * trophy history. This service polls every *active* tag on a fixed interval and
 * persists, per tag:
 *   - a deduplicated battle archive (grows far beyond the 25-battle window)
 *   - a trophy timeline (a point whenever trophies / victories change)
 *
 * A tag becomes active when a client hits `POST /tracker/:tag` (done on profile
 * view). Tags not requested for TRACKER_INACTIVE_DAYS stop being polled.
 *
 * Storage is plain JSON files under DATA_DIR/tracker — zero native deps, fine
 * for the expected volume (a handful of players, one sweep every ~10 min).
 * Writes are atomic (temp file + rename) and debounced per tag.
 *
 * Caveats (by design, not bugs): capture only advances while the proxy runs,
 * and only from the IP authorised by the API key (JWT is IP-locked).
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { config } from "../config/config.js";
import { logger } from "../config/logger.js";
import * as bs from "./brawlstars.js";
import type { BattleLogItem, Player } from "../types/brawlstars.js";

export interface TrophyPoint {
  /** ISO timestamp of capture. */
  t: string;
  trophies: number;
  highestTrophies: number;
  expLevel: number;
  /** 3v3 + solo + duo victories (cumulative career totals). */
  victories: number;
  brawlers: number;
}

export interface TrackedEntry {
  tag: string; // normalised, no leading '#'
  name: string;
  firstSeen: string;
  lastRequested: string;
  lastPolled: string | null;
  lastError: string | null;
  battles: BattleLogItem[];
  timeline: TrophyPoint[];
}

export interface TrackerStatus {
  tag: string;
  name: string;
  tracked: boolean;
  firstSeen: string;
  lastRequested: string;
  lastPolled: string | null;
  lastError: string | null;
  battleCount: number;
  timelinePoints: number;
}

const DIR = path.resolve(config.DATA_DIR, "tracker");

/** In-memory index of tracked tags, hydrated from disk on init. */
const entries = new Map<string, TrackedEntry>();
/** Debounce timers for pending disk writes, keyed by tag. */
const writeTimers = new Map<string, NodeJS.Timeout>();

let poller: NodeJS.Timeout | null = null;
let sweeping = false;

const totalVictories = (p: Player): number =>
  (p["3vs3Victories"] ?? 0) + (p.soloVictories ?? 0) + (p.duoVictories ?? 0);

/** battleTime + mode + map uniquely identifies a recorded battle. */
const battleId = (b: BattleLogItem): string =>
  `${b.battleTime}::${b.battle.mode || b.event.mode || "?"}::${b.event.map || "?"}`;

const fileFor = (tag: string): string => path.join(DIR, `${tag}.json`);

const nowIso = (): string => new Date().toISOString();

// ------------------------------------------------------------------
// Persistence
// ------------------------------------------------------------------

async function ensureDir(): Promise<void> {
  await fs.mkdir(DIR, { recursive: true });
}

/** Atomic write: temp file + rename (rename replaces on Windows & POSIX). */
async function writeEntry(entry: TrackedEntry): Promise<void> {
  try {
    await ensureDir();
    const target = fileFor(entry.tag);
    const tmp = `${target}.${process.pid}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(entry), "utf8");
    await fs.rename(tmp, target);
  } catch (err) {
    logger.error({ err, tag: entry.tag }, "tracker: failed to persist entry");
  }
}

/** Debounced persistence — batches rapid mutations into one write. */
function scheduleWrite(tag: string): void {
  const existing = writeTimers.get(tag);
  if (existing) clearTimeout(existing);
  const timer = setTimeout(() => {
    writeTimers.delete(tag);
    const entry = entries.get(tag);
    if (entry) void writeEntry(entry);
  }, 500);
  timer.unref?.();
  writeTimers.set(tag, timer);
}

/** Load all persisted entries into memory. Called once at startup. */
export async function initTracker(): Promise<void> {
  try {
    await ensureDir();
    const files = await fs.readdir(DIR);
    for (const f of files) {
      if (!f.endsWith(".json")) continue;
      try {
        const raw = await fs.readFile(path.join(DIR, f), "utf8");
        const entry = JSON.parse(raw) as TrackedEntry;
        if (entry?.tag) entries.set(entry.tag, normaliseEntry(entry));
      } catch (err) {
        logger.warn({ err, file: f }, "tracker: skipping unreadable entry");
      }
    }
    logger.info({ count: entries.size }, "tracker: hydrated from disk");
  } catch (err) {
    logger.error({ err }, "tracker: init failed");
  }
}

/** Defensive normalisation for entries read off disk. */
function normaliseEntry(e: TrackedEntry): TrackedEntry {
  return {
    tag: e.tag,
    name: e.name ?? "",
    firstSeen: e.firstSeen ?? nowIso(),
    lastRequested: e.lastRequested ?? e.firstSeen ?? nowIso(),
    lastPolled: e.lastPolled ?? null,
    lastError: e.lastError ?? null,
    battles: Array.isArray(e.battles) ? e.battles : [],
    timeline: Array.isArray(e.timeline) ? e.timeline : [],
  };
}

// ------------------------------------------------------------------
// Public API
// ------------------------------------------------------------------

const toStatus = (e: TrackedEntry): TrackerStatus => ({
  tag: e.tag,
  name: e.name,
  tracked: isActive(e),
  firstSeen: e.firstSeen,
  lastRequested: e.lastRequested,
  lastPolled: e.lastPolled,
  lastError: e.lastError,
  battleCount: e.battles.length,
  timelinePoints: e.timeline.length,
});

function isActive(e: TrackedEntry): boolean {
  const age = Date.now() - new Date(e.lastRequested).getTime();
  return age <= config.TRACKER_INACTIVE_DAYS * 86_400_000;
}

/**
 * Register or refresh a tag's activity. Creates the entry on first sight and,
 * if it has never been polled, triggers an immediate background poll so the
 * client gets data without waiting for the next sweep.
 */
export function touch(tag: string): TrackerStatus {
  let entry = entries.get(tag);
  const first = !entry;
  if (!entry) {
    entry = {
      tag,
      name: "",
      firstSeen: nowIso(),
      lastRequested: nowIso(),
      lastPolled: null,
      lastError: null,
      battles: [],
      timeline: [],
    };
    entries.set(tag, entry);
    evictIfNeeded();
  } else {
    entry.lastRequested = nowIso();
  }
  scheduleWrite(tag);

  if (first || entry.lastPolled === null) {
    // Fire-and-forget: don't block the HTTP response on an upstream call.
    void pollTag(tag).catch(() => {});
  }
  return toStatus(entry);
}

export function getStatus(tag: string): TrackerStatus | null {
  const e = entries.get(tag);
  return e ? toStatus(e) : null;
}

export function getBattles(tag: string, limit?: number): BattleLogItem[] {
  const e = entries.get(tag);
  if (!e) return [];
  return typeof limit === "number" ? e.battles.slice(0, limit) : e.battles;
}

export function getTimeline(tag: string): TrophyPoint[] {
  return entries.get(tag)?.timeline ?? [];
}

/** Drop the least-recently-requested tags when over the cap. */
function evictIfNeeded(): void {
  if (entries.size <= config.TRACKER_MAX_TAGS) return;
  const sorted = [...entries.values()].sort(
    (a, b) =>
      new Date(a.lastRequested).getTime() - new Date(b.lastRequested).getTime(),
  );
  const overflow = entries.size - config.TRACKER_MAX_TAGS;
  for (let i = 0; i < overflow; i += 1) {
    const victim = sorted[i]!;
    entries.delete(victim.tag);
    void fs.rm(fileFor(victim.tag), { force: true }).catch(() => {});
    logger.info({ tag: victim.tag }, "tracker: evicted inactive tag");
  }
}

// ------------------------------------------------------------------
// Polling
// ------------------------------------------------------------------

/** Merge fresh battles into the archive; return how many were new. */
function mergeBattles(entry: TrackedEntry, fresh: BattleLogItem[]): number {
  const seen = new Map<string, BattleLogItem>();
  for (const b of entry.battles) seen.set(battleId(b), b);
  let added = 0;
  for (const b of fresh) {
    const id = battleId(b);
    if (!seen.has(id)) added += 1;
    seen.set(id, b);
  }
  entry.battles = [...seen.values()]
    .sort((a, b) => b.battleTime.localeCompare(a.battleTime))
    .slice(0, config.TRACKER_BATTLE_CAP);
  return added;
}

/** Append a trophy point when something meaningful changed. */
function recordTrophyPoint(entry: TrackedEntry, player: Player): boolean {
  const point: TrophyPoint = {
    t: nowIso(),
    trophies: player.trophies,
    highestTrophies: player.highestTrophies,
    expLevel: player.expLevel,
    victories: totalVictories(player),
    brawlers: player.brawlers?.length ?? 0,
  };
  const last = entry.timeline[entry.timeline.length - 1];
  const changed =
    !last ||
    last.trophies !== point.trophies ||
    last.victories !== point.victories ||
    last.brawlers !== point.brawlers;
  if (!changed) return false;
  entry.timeline.push(point);
  if (entry.timeline.length > config.TRACKER_TIMELINE_CAP) {
    entry.timeline = entry.timeline.slice(-config.TRACKER_TIMELINE_CAP);
  }
  return true;
}

/** Poll a single tag: fetch player + battlelog, merge, snapshot. */
async function pollTag(tag: string): Promise<void> {
  const entry = entries.get(tag);
  if (!entry) return;
  try {
    const [player, log] = await Promise.all([
      bs.getPlayer(tag),
      bs.getPlayerBattlelog(tag).catch(() => null),
    ]);
    entry.name = player.name;
    const addedBattles = log ? mergeBattles(entry, log.items ?? []) : 0;
    const addedPoint = recordTrophyPoint(entry, player);
    entry.lastPolled = nowIso();
    entry.lastError = null;
    if (addedBattles > 0 || addedPoint) {
      logger.info(
        { tag, addedBattles, addedPoint },
        "tracker: captured new data",
      );
    }
  } catch (err) {
    entry.lastPolled = nowIso();
    entry.lastError = err instanceof Error ? err.message : "poll failed";
    logger.warn({ tag, err }, "tracker: poll failed");
  } finally {
    scheduleWrite(tag);
  }
}

const sleep = (ms: number) =>
  new Promise<void>((r) => setTimeout(r, ms).unref?.());

/** Sweep every active tag, spacing calls to spread upstream load. */
async function sweep(): Promise<void> {
  if (sweeping) return;
  sweeping = true;
  try {
    const active = [...entries.values()].filter(isActive);
    if (active.length === 0) return;
    logger.debug({ count: active.length }, "tracker: sweep start");
    for (const entry of active) {
      await pollTag(entry.tag);
      if (config.TRACKER_POLL_SPACING_MS > 0) {
        await sleep(config.TRACKER_POLL_SPACING_MS);
      }
    }
  } finally {
    sweeping = false;
  }
}

export function startPoller(): void {
  if (!config.TRACKER_ENABLED || poller) return;
  poller = setInterval(() => {
    void sweep();
  }, config.TRACKER_POLL_INTERVAL_MS);
  poller.unref?.();
  logger.info(
    { intervalMs: config.TRACKER_POLL_INTERVAL_MS },
    "tracker: poller started",
  );
}

export function stopPoller(): void {
  if (poller) {
    clearInterval(poller);
    poller = null;
  }
}
