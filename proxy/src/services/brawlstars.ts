import { config } from "../config/config.js";
import { logger } from "../config/logger.js";
import { responseCache, TTL, type CacheTTL } from "../config/cache.js";
import {
  HttpError,
  upstreamError,
  upstreamTimeout,
  upstreamUnavailable,
} from "../config/errors.js";
import { encodeTag } from "../config/tags.js";
import type {
  BattleLog,
  Brawler,
  BrawlerList,
  BrawlerRankingList,
  Club,
  ClubMemberList,
  ClubRankingList,
  EventRotation,
  Player,
  PlayerRankingList,
} from "../types/brawlstars.js";

interface UpstreamErrorBody {
  reason?: string;
  message?: string;
}

export interface PaginationParams {
  limit?: number;
  before?: string;
  after?: string;
}

const buildQuery = (params?: PaginationParams): string => {
  if (!params) return "";
  const sp = new URLSearchParams();
  if (params.limit !== undefined) sp.set("limit", String(params.limit));
  if (params.before !== undefined) sp.set("before", params.before);
  if (params.after !== undefined) sp.set("after", params.after);
  const s = sp.toString();
  return s ? `?${s}` : "";
};

const cacheKey = (path: string): string => `GET ${path}`;

async function callUpstream<T>(
  path: string,
  ttl: CacheTTL,
  { signal }: { signal?: AbortSignal } = {},
): Promise<T> {
  const key = cacheKey(path);
  const cached = responseCache.get(key) as T | undefined;
  if (cached !== undefined) {
    logger.debug({ path }, "cache hit");
    return cached;
  }

  const url = `${config.BRAWL_STARS_API_URL}${path}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    config.UPSTREAM_TIMEOUT_MS,
  );
  // Bridge an externally-provided signal (e.g. client disconnect) to ours.
  signal?.addEventListener("abort", () => controller.abort(), { once: true });

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${config.BRAWL_STARS_API_KEY}`,
        Accept: "application/json",
        "User-Agent": "brawl-analytics-proxy/1.0",
      },
      signal: controller.signal,
    });

    if (!res.ok) {
      let body: UpstreamErrorBody | undefined;
      try {
        body = (await res.json()) as UpstreamErrorBody;
      } catch {
        // ignore — upstream returned non-JSON
      }
      const message = body?.message ?? `Upstream returned ${res.status}`;
      logger.warn(
        { status: res.status, path, reason: body?.reason },
        "upstream error",
      );
      // Pass through useful client errors (404 → 404, 429 → 429) but never
      // leak internal headers or the API key.
      if (res.status >= 400 && res.status < 500) {
        throw upstreamError(res.status, message, { reason: body?.reason });
      }
      throw upstreamError(502, "Upstream service returned an error");
    }

    const data = (await res.json()) as T;
    // Cast through the LRU's non-nullish constraint; we only ever cache JSON objects.
    responseCache.set(key, data as NonNullable<unknown>, { ttl });
    return data;
  } catch (err) {
    if (err instanceof HttpError) throw err;
    if (err instanceof Error && err.name === "AbortError") {
      throw upstreamTimeout();
    }
    logger.error({ err, path }, "upstream request failed");
    throw upstreamUnavailable();
  } finally {
    clearTimeout(timeoutId);
  }
}

// ------------------------------------------------------------------
// Players
// ------------------------------------------------------------------

export const getPlayer = (tag: string, signal?: AbortSignal) =>
  callUpstream<Player>(`/players/${encodeTag(tag)}`, TTL.player, { signal });

export const getPlayerBattlelog = (
  tag: string,
  params?: PaginationParams,
  signal?: AbortSignal,
) =>
  callUpstream<BattleLog>(
    `/players/${encodeTag(tag)}/battlelog${buildQuery(params)}`,
    TTL.battlelog,
    { signal },
  );

// ------------------------------------------------------------------
// Clubs
// ------------------------------------------------------------------

export const getClub = (tag: string, signal?: AbortSignal) =>
  callUpstream<Club>(`/clubs/${encodeTag(tag)}`, TTL.club, { signal });

export const getClubMembers = (
  tag: string,
  params?: PaginationParams,
  signal?: AbortSignal,
) =>
  callUpstream<ClubMemberList>(
    `/clubs/${encodeTag(tag)}/members${buildQuery(params)}`,
    TTL.clubMembers,
    { signal },
  );

// ------------------------------------------------------------------
// Brawlers
// ------------------------------------------------------------------

export const getBrawlers = (params?: PaginationParams, signal?: AbortSignal) =>
  callUpstream<BrawlerList>(`/brawlers${buildQuery(params)}`, TTL.brawlers, {
    signal,
  });

export const getBrawler = (brawlerId: number, signal?: AbortSignal) =>
  callUpstream<Brawler>(`/brawlers/${brawlerId}`, TTL.brawler, { signal });

// ------------------------------------------------------------------
// Rankings
// ------------------------------------------------------------------

export const getPlayerRankings = (
  countryCode: string,
  params?: PaginationParams,
  signal?: AbortSignal,
) =>
  callUpstream<PlayerRankingList>(
    `/rankings/${countryCode.toLowerCase()}/players${buildQuery(params)}`,
    TTL.rankings,
    { signal },
  );

export const getClubRankings = (
  countryCode: string,
  params?: PaginationParams,
  signal?: AbortSignal,
) =>
  callUpstream<ClubRankingList>(
    `/rankings/${countryCode.toLowerCase()}/clubs${buildQuery(params)}`,
    TTL.rankings,
    { signal },
  );

export const getBrawlerRankings = (
  countryCode: string,
  brawlerId: number,
  params?: PaginationParams,
  signal?: AbortSignal,
) =>
  callUpstream<BrawlerRankingList>(
    `/rankings/${countryCode.toLowerCase()}/brawlers/${brawlerId}${buildQuery(params)}`,
    TTL.rankings,
    { signal },
  );

// ------------------------------------------------------------------
// Events
// ------------------------------------------------------------------

export const getEventRotation = (signal?: AbortSignal) =>
  callUpstream<EventRotation>("/events/rotation", TTL.events, { signal });
