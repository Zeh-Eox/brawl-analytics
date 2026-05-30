import { useEffect, useMemo, useState } from "react";
import { useBattlelog } from "../api/queries";
import {
  loadBattles,
  mergeBattles,
  clearBattles,
} from "../utils/battleStore";
import { analyseBattlelog } from "../utils/battleStats";
import type { BattleLogItem } from "../types/brawlstars";
import type { BattlelogAnalytics } from "../types/analytics";

export interface AccumulatedBattlesResult {
  items: BattleLogItem[];
  /** How many came from this exact API call (capped to 25). */
  freshCount: number;
  /** How many are sourced from previous visits via localStorage. */
  storedCount: number;
  analytics: BattlelogAnalytics | null;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => Promise<unknown>;
  clearHistory: () => void;
}

/**
 * Merges the freshly-fetched 25 battles with the per-tag localStorage archive
 * and recomputes analytics on the union. The archive grows on every visit.
 */
export function useAccumulatedBattles(
  tag: string | undefined,
): AccumulatedBattlesResult {
  const battlelog = useBattlelog(tag);
  // Seed from localStorage immediately so the UI doesn't flash empty.
  const [stored, setStored] = useState<BattleLogItem[]>(() =>
    tag ? loadBattles(tag) : [],
  );

  // Reset when the tag changes.
  useEffect(() => {
    setStored(tag ? loadBattles(tag) : []);
  }, [tag]);

  // Merge whenever the fetch returns fresh data.
  useEffect(() => {
    if (!tag || !battlelog.data) return;
    const merged = mergeBattles(tag, battlelog.data.items ?? []);
    setStored(merged);
  }, [tag, battlelog.data]);

  const freshItems = battlelog.data?.items ?? [];
  const freshIds = useMemo(
    () =>
      new Set(
        freshItems.map(
          (b) =>
            `${b.battleTime}::${b.battle.mode || b.event.mode}::${b.event.map}`,
        ),
      ),
    [freshItems],
  );
  const storedOnly = stored.filter(
    (b) =>
      !freshIds.has(
        `${b.battleTime}::${b.battle.mode || b.event.mode}::${b.event.map}`,
      ),
  );

  const analytics = useMemo(() => {
    if (!tag || stored.length === 0) return null;
    return analyseBattlelog(stored, `#${tag}`);
  }, [tag, stored]);

  return {
    items: stored,
    freshCount: freshItems.length,
    storedCount: storedOnly.length,
    analytics,
    isLoading: battlelog.isLoading && stored.length === 0,
    isError: battlelog.isError,
    error: battlelog.error,
    refetch: battlelog.refetch,
    clearHistory: () => {
      if (!tag) return;
      clearBattles(tag);
      setStored([]);
    },
  };
}
