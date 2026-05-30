import { LRUCache } from "lru-cache";
import { config } from "./config.js";

/**
 * Per-key TTL is supported by passing `ttl` to .set(). The cache stores
 * already-parsed JSON values keyed by `<METHOD> <path>?<sortedQuery>`.
 */
// lru-cache requires V to extend `{}`. We use NonNullable<unknown> as a
// "any non-nullish JSON-ish value" placeholder.
type CacheValue = NonNullable<unknown>;

export const responseCache = new LRUCache<string, CacheValue>({
  max: config.CACHE_MAX_ITEMS,
  ttl: 60_000, // default — overridden per call
});

/** Default TTLs (ms) per upstream resource. Tuned for freshness vs. quota. */
export const TTL = {
  player: 60_000,
  battlelog: 60_000,
  club: 60_000,
  clubMembers: 60_000,
  brawlers: 60 * 60_000, // brawler catalogue rarely changes
  brawler: 60 * 60_000,
  rankings: 5 * 60_000,
  events: 5 * 60_000,
} as const;

export type CacheTTL = (typeof TTL)[keyof typeof TTL];
