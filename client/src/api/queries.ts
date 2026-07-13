import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./client";
import type {
  BattleLog,
  Club,
  ClubRankingList,
  Player,
  PlayerRankingList,
  ScheduledEvent,
} from "../types/brawlstars";
import type {
  BrawlerEnriched,
  ClubSummary,
  PlayerComparison,
  PlayerProfileAnalytics,
  PlayerSummary,
  BattlelogAnalytics,
} from "../types/analytics";
import type {
  TrackerBattles,
  TrackerStatus,
  TrackerTimeline,
} from "../types/tracker";

/** Standard query options for player-scoped resources. */
const playerScoped = {
  staleTime: 30_000,
  refetchOnWindowFocus: false,
  retry: (count: number, err: unknown) => {
    // 4xx errors are deterministic — don't retry. 5xx & network: retry once.
    const status = (err as { status?: number } | null)?.status;
    if (status && status >= 400 && status < 500) return false;
    return count < 1;
  },
} as const;

export const queryKeys = {
  player: (tag: string) => ["player", tag] as const,
  battlelog: (tag: string) => ["battlelog", tag] as const,
  profile: (tag: string) => ["profile", tag] as const,
  summary: (tag: string) => ["summary", tag] as const,
  brawlers: (tag: string) => ["brawlers", tag] as const,
  battlelogAnalytics: (tag: string) =>
    ["analytics", "battlelog", tag] as const,
  events: () => ["events"] as const,
  club: (tag: string) => ["club", tag] as const,
  clubSummary: (tag: string) => ["club", "summary", tag] as const,
  playerRankings: (country: string) =>
    ["rankings", "players", country] as const,
  clubRankings: (country: string) => ["rankings", "clubs", country] as const,
  compare: (a: string, b: string) => ["compare", a, b] as const,
  tracker: (tag: string) => ["tracker", tag] as const,
  trackerTimeline: (tag: string) => ["tracker", "timeline", tag] as const,
  trackerBattles: (tag: string) => ["tracker", "battles", tag] as const,
};

export function usePlayerProfile(tag: string | undefined) {
  return useQuery({
    queryKey: tag ? queryKeys.profile(tag) : ["profile", "none"],
    enabled: Boolean(tag),
    queryFn: () =>
      apiFetch<PlayerProfileAnalytics>(`/analytics/players/${tag!}/profile`),
    ...playerScoped,
  });
}

export function usePlayer(tag: string | undefined) {
  return useQuery({
    queryKey: tag ? queryKeys.player(tag) : ["player", "none"],
    enabled: Boolean(tag),
    queryFn: () => apiFetch<Player>(`/players/${tag!}`),
    ...playerScoped,
  });
}

export function usePlayerSummary(tag: string | undefined) {
  return useQuery({
    queryKey: tag ? queryKeys.summary(tag) : ["summary", "none"],
    enabled: Boolean(tag),
    queryFn: () =>
      apiFetch<PlayerSummary>(`/analytics/players/${tag!}/summary`),
    ...playerScoped,
  });
}

export function usePlayerBrawlers(tag: string | undefined) {
  return useQuery({
    queryKey: tag ? queryKeys.brawlers(tag) : ["brawlers", "none"],
    enabled: Boolean(tag),
    queryFn: () =>
      apiFetch<{ tag: string; name: string; items: BrawlerEnriched[] }>(
        `/analytics/players/${tag!}/brawlers`,
      ),
    ...playerScoped,
  });
}

export function useBattlelog(tag: string | undefined) {
  return useQuery({
    queryKey: tag ? queryKeys.battlelog(tag) : ["battlelog", "none"],
    enabled: Boolean(tag),
    queryFn: () => apiFetch<BattleLog>(`/players/${tag!}/battlelog`),
    ...playerScoped,
  });
}

export function useBattlelogAnalytics(tag: string | undefined) {
  return useQuery({
    queryKey: tag
      ? queryKeys.battlelogAnalytics(tag)
      : ["analytics", "battlelog", "none"],
    enabled: Boolean(tag),
    queryFn: () =>
      apiFetch<BattlelogAnalytics>(
        `/analytics/players/${tag!}/battlelog`,
      ),
    ...playerScoped,
  });
}

export function useEventRotation() {
  return useQuery({
    queryKey: queryKeys.events(),
    queryFn: () => apiFetch<ScheduledEvent[]>(`/events/rotation`),
    staleTime: 5 * 60_000,
  });
}

export function useClub(tag: string | undefined) {
  return useQuery({
    queryKey: tag ? queryKeys.club(tag) : ["club", "none"],
    enabled: Boolean(tag),
    queryFn: () => apiFetch<Club>(`/clubs/${tag!}`),
    ...playerScoped,
  });
}

export function useClubSummary(tag: string | undefined) {
  return useQuery({
    queryKey: tag ? queryKeys.clubSummary(tag) : ["club", "summary", "none"],
    enabled: Boolean(tag),
    queryFn: () => apiFetch<ClubSummary>(`/analytics/clubs/${tag!}/summary`),
    ...playerScoped,
  });
}

export function usePlayerRankings(country: string) {
  return useQuery({
    queryKey: queryKeys.playerRankings(country),
    queryFn: () =>
      apiFetch<PlayerRankingList>(`/rankings/${country}/players`),
    staleTime: 5 * 60_000,
  });
}

export function useClubRankings(country: string) {
  return useQuery({
    queryKey: queryKeys.clubRankings(country),
    queryFn: () => apiFetch<ClubRankingList>(`/rankings/${country}/clubs`),
    staleTime: 5 * 60_000,
  });
}

// ------------------------------------------------------------------
// Background capture (tracker)
// ------------------------------------------------------------------

/** Capture status for a tag (poll counters, last error, …). */
export function useTracker(tag: string | undefined) {
  return useQuery({
    queryKey: tag ? queryKeys.tracker(tag) : ["tracker", "none"],
    enabled: Boolean(tag),
    queryFn: () => apiFetch<TrackerStatus>(`/tracker/${tag!}`),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

/** Captured trophy timeline (grows while the proxy polls in the background). */
export function useTrackerTimeline(tag: string | undefined) {
  return useQuery({
    queryKey: tag ? queryKeys.trackerTimeline(tag) : ["tracker", "timeline", "none"],
    enabled: Boolean(tag),
    queryFn: () => apiFetch<TrackerTimeline>(`/tracker/${tag!}/timeline`),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

/** Full captured battle archive (server-side, past the 25-battle window). */
export function useTrackerBattles(tag: string | undefined) {
  return useQuery({
    queryKey: tag ? queryKeys.trackerBattles(tag) : ["tracker", "battles", "none"],
    enabled: Boolean(tag),
    queryFn: () =>
      apiFetch<TrackerBattles>(`/tracker/${tag!}/battles?limit=200`),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

/** Activate / refresh background capture for a tag. */
export function useActivateTracking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tag: string) =>
      apiFetch<TrackerStatus>(`/tracker/${tag}`, { method: "POST" }),
    onSuccess: (data, tag) => {
      qc.setQueryData(queryKeys.tracker(tag), data);
      void qc.invalidateQueries({ queryKey: queryKeys.trackerTimeline(tag) });
    },
  });
}

export function usePlayerCompare(
  tagA: string | undefined,
  tagB: string | undefined,
) {
  return useQuery({
    queryKey: tagA && tagB ? queryKeys.compare(tagA, tagB) : ["compare", "none"],
    enabled: Boolean(tagA && tagB),
    queryFn: () =>
      apiFetch<PlayerComparison>(
        `/analytics/players/${tagA!}/compare/${tagB!}`,
      ),
    ...playerScoped,
  });
}
