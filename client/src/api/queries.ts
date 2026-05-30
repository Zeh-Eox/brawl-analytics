import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "./client";
import type {
  BattleLog,
  Player,
  ScheduledEvent,
} from "../types/brawlstars";
import type {
  BrawlerEnriched,
  PlayerProfileAnalytics,
  PlayerSummary,
  BattlelogAnalytics,
} from "../types/analytics";

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
