import { useMemo, useState } from "react";
import {
  useActivateTracking,
  useTracker,
  useTrackerTimeline,
} from "../../api/queries";
import type { PlayerProfileAnalytics } from "../../types/analytics";
import { loadSnapshots } from "../../utils/profileHistory";
import { DAY_MS, deltaOver, mergeTimeline } from "../../utils/timeline";
import { TrophyCurve } from "../ui/TrophyCurve";
import { EmptyState } from "../ui/EmptyState";
import { fmtNum, relativeTime } from "../../utils/format";
import { cn } from "../../utils/cn";
import {
  IconBroadcast,
  IconCheck,
  IconHistory,
  IconTrophy,
} from "../ui/icons";

type Range = 7 | 30 | 0; // 0 = tout

const RANGES: { id: Range; label: string }[] = [
  { id: 7, label: "7 j" },
  { id: 30, label: "30 j" },
  { id: 0, label: "Tout" },
];

/**
 * Progression des trophées dans le temps : bannière de suivi (capture serveur),
 * deltas 24 h / 7 j, courbe avec plages. Fusionne la timeline serveur et les
 * snapshots locaux. Rendu comme une cellule pleine largeur dans la grille
 * Analytics.
 */
export function TrophyProgress({
  profile,
  tag,
}: {
  profile: PlayerProfileAnalytics;
  tag: string;
}) {
  const status = useTracker(tag);
  const timelineQ = useTrackerTimeline(tag);
  const activate = useActivateTracking();
  const [range, setRange] = useState<Range>(30);

  const points = useMemo(() => {
    const server = timelineQ.data?.points ?? [];
    const local = loadSnapshots(tag);
    return mergeTimeline(server, local);
  }, [timelineQ.data, tag]);

  const visible = useMemo(() => {
    if (range === 0) return points;
    const cutoff = Date.now() - range * DAY_MS;
    const inRange = points.filter((p) => new Date(p.t).getTime() >= cutoff);
    if (inRange.length < points.length) {
      const before = points.filter((p) => new Date(p.t).getTime() < cutoff);
      if (before.length) return [before[before.length - 1]!, ...inRange];
    }
    return inRange;
  }, [points, range]);

  const d1 = deltaOver(points, DAY_MS);
  const d7 = deltaOver(points, 7 * DAY_MS);
  const v7 = deltaOver(points, 7 * DAY_MS, "victories");

  const tracked = status.data?.tracked ?? false;
  const lastPolled = status.data?.lastPolled ?? null;

  return (
    <div className="col-span-2 space-y-3 lg:col-span-12">
      <TrackingBanner
        tracked={tracked}
        lastPolled={lastPolled}
        points={status.data?.timelinePoints ?? points.length}
        onActivate={() => activate.mutate(tag)}
        activating={activate.isPending}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <DeltaStat
          label="Trophées"
          value={fmtNum(profile.player.trophies)}
          color="text-gold"
        />
        <DeltaStat label="Δ 24 h" value={fmtDelta(d1)} color={deltaColor(d1)} />
        <DeltaStat label="Δ 7 j" value={fmtDelta(d7)} color={deltaColor(d7)} />
        <DeltaStat
          label="Record"
          value={fmtNum(profile.player.highestTrophies)}
          color="text-cyan"
        />
      </div>

      <div className="rounded-2xl border border-line bg-surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="display inline-flex items-center gap-2 text-sm text-white">
            <IconHistory size={16} /> Progression des trophées
          </div>
          <div className="flex gap-1 rounded-lg border border-line bg-surface-2 p-0.5">
            {RANGES.map((r) => (
              <button
                key={r.id}
                onClick={() => setRange(r.id)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-[11px] font-bold transition-colors",
                  range === r.id
                    ? "bg-gold/15 text-gold"
                    : "text-dim hover:text-text-2",
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {visible.length >= 2 ? (
          <TrophyCurve data={visible} height={220} />
        ) : (
          <EmptyState
            icon={<IconTrophy size={26} />}
            title="Pas encore assez de points"
            message={
              tracked
                ? "La capture tourne — reviens après quelques parties pour voir la courbe se dessiner."
                : "Active le suivi en arrière-plan pour construire un vrai historique de trophées, même quand tu n'es pas sur le site."
            }
            className="border-0 bg-transparent py-10"
          />
        )}
      </div>

      {typeof v7 === "number" && v7 > 0 && (
        <div className="flex items-center gap-2 rounded-2xl border border-line bg-surface px-4 py-3 text-sm">
          <span className="text-success">
            <IconCheck size={16} />
          </span>
          <span className="text-text-2">
            <span className="font-bold text-success">+{fmtNum(v7)}</span>{" "}
            victoires capturées ces 7 derniers jours.
          </span>
        </div>
      )}
    </div>
  );
}

function TrackingBanner({
  tracked,
  lastPolled,
  points,
  onActivate,
  activating,
}: {
  tracked: boolean;
  lastPolled: string | null;
  points: number;
  onActivate: () => void;
  activating: boolean;
}) {
  if (tracked) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-success/25 bg-success/5 px-4 py-3">
        <span className="text-success">
          <IconBroadcast size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold text-text">Suivi actif</div>
          <div className="text-[12px] text-text-2">
            {points} point{points > 1 ? "s" : ""} capturé
            {points > 1 ? "s" : ""}
            {lastPolled ? ` · dernière capture ${relativeTime(lastPolled)}` : ""}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-gold/25 bg-gold/5 px-4 py-4 sm:flex-row sm:items-center">
      <span className="text-gold">
        <IconBroadcast size={22} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-bold text-text">
          Active le suivi en arrière-plan
        </div>
        <div className="text-[12px] text-text-2">
          Le serveur capturera régulièrement tes combats et tes trophées — ton
          historique grandit même hors connexion. (Le proxy doit tourner.)
        </div>
      </div>
      <button
        onClick={onActivate}
        disabled={activating}
        className="shrink-0 rounded-xl bg-gold px-4 py-2.5 text-[13px] font-black text-app disabled:opacity-50"
      >
        {activating ? "Activation…" : "Activer"}
      </button>
    </div>
  );
}

function DeltaStat({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-3.5">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </div>
      <div className={cn("display mt-1 text-xl", color)}>{value}</div>
    </div>
  );
}

const fmtDelta = (n: number | null): string =>
  n === null ? "—" : `${n > 0 ? "+" : ""}${fmtNum(n)}`;

const deltaColor = (n: number | null): string =>
  n === null || n === 0
    ? "text-text-2"
    : n > 0
      ? "text-success"
      : "text-danger";
