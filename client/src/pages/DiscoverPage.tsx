import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useClubRankings,
  useEventRotation,
  usePlayerRankings,
} from "../api/queries";
import { Card } from "../components/ui/Card";
import { Skeleton } from "../components/ui/Skeleton";
import { ErrorState } from "../components/ui/ErrorState";
import { CdnIcon } from "../components/ui/CdnIcon";
import { cn } from "../utils/cn";
import { cdn } from "../utils/cdn";
import { fmtMode, fmtCompact } from "../utils/format";
import { displayTag } from "../utils/tag";
import { IconController, IconTrophy } from "../components/ui/icons";

const COUNTRIES: { code: string; label: string }[] = [
  { code: "global", label: "🌍 Mondial" },
  { code: "FR", label: "🇫🇷 France" },
  { code: "US", label: "🇺🇸 USA" },
  { code: "GB", label: "🇬🇧 UK" },
  { code: "DE", label: "🇩🇪 Allemagne" },
  { code: "ES", label: "🇪🇸 Espagne" },
  { code: "BR", label: "🇧🇷 Brésil" },
];

/** "YYYYMMDDTHHMMSS.000Z" → ms epoch. */
function eventMs(raw: string): number {
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/.exec(raw);
  if (!m) return 0;
  const [, y, mo, d, h, mi, s] = m;
  return Date.parse(`${y}-${mo}-${d}T${h}:${mi}:${s}Z`);
}
function remaining(end: string): string {
  const diff = eventMs(end) - Date.now();
  if (diff <= 0) return "terminé";
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  return h > 0 ? `${h} h ${m} min` : `${m} min`;
}

export function DiscoverPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"players" | "clubs">("players");
  const [country, setCountry] = useState("global");

  const events = useEventRotation();
  const playerRanks = usePlayerRankings(country);
  const clubRanks = useClubRankings(country);

  const rankColor = (i: number) =>
    i === 0
      ? "text-gold"
      : i === 1
        ? "text-text-2"
        : i === 2
          ? "text-warning"
          : "text-dim";

  return (
    <section className="space-y-6">
      <div>
        <h1 className="display text-2xl text-white md:text-3xl">Découvrir</h1>
        <p className="mt-1 text-sm text-text-2">
          Classements & événements en direct
        </p>
      </div>

      {/* Événements */}
      <div>
        <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-muted">
          <span className="text-danger">●</span> Événements en cours
        </div>
        {events.isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : events.isError ? (
          <ErrorState error={events.error} onRetry={() => void events.refetch()} />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(events.data ?? []).map((ev) => (
              <Card key={ev.slotId} className="flex items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-surface-2">
                  <CdnIcon
                    srcs={
                      typeof ev.event.modeId === "number"
                        ? [cdn.gameMode(48000000 + ev.event.modeId)]
                        : []
                    }
                    alt={ev.event.mode}
                    wrapperClassName="h-8 w-8"
                    fallback={<span className="text-text-2"><IconController size={18} /></span>}
                  />
                </div>
                {ev.event.id > 0 && (
                  <div className="h-10 w-14 shrink-0 overflow-hidden rounded-lg border border-line bg-surface-2">
                    <CdnIcon
                      srcs={[cdn.map(ev.event.id)]}
                      alt={ev.event.map}
                      fit="cover"
                      wrapperClassName="h-full w-full"
                      fallback={<span className="text-[9px] text-dim">map</span>}
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-bold text-text">
                    {fmtMode(ev.event.mode)}
                  </div>
                  <div className="truncate text-[11px] text-dim">
                    {ev.event.map}
                  </div>
                </div>
                <div className="shrink-0 text-right text-[10px] font-semibold text-success">
                  {remaining(ev.endTime)}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Classements */}
      <div>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="flex gap-1 rounded-xl border border-line bg-surface p-1">
            {(["players", "clubs"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "rounded-lg px-4 py-1.5 text-[12px] font-bold transition-colors",
                  tab === t ? "bg-gold/12 text-gold" : "text-text-2",
                )}
              >
                {t === "players" ? "Joueurs" : "Clubs"}
              </button>
            ))}
          </div>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="ml-auto rounded-xl border border-line bg-surface px-3 py-2 text-[12px] font-semibold text-text outline-none"
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code} className="bg-app">
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {tab === "players" ? (
          <RankingList
            loading={playerRanks.isLoading}
            error={playerRanks.isError ? playerRanks.error : null}
            onRetry={() => void playerRanks.refetch()}
            rows={(playerRanks.data?.items ?? []).map((r, i) => ({
              key: r.tag,
              rank: r.rank || i + 1,
              name: r.name,
              sub: r.club?.name ? r.club.name : displayTag(r.tag),
              trophies: r.trophies,
              onClick: () => navigate(`/player/${r.tag.replace(/^#/, "")}`),
              color: rankColor(i),
            }))}
          />
        ) : (
          <RankingList
            loading={clubRanks.isLoading}
            error={clubRanks.isError ? clubRanks.error : null}
            onRetry={() => void clubRanks.refetch()}
            rows={(clubRanks.data?.items ?? []).map((r, i) => ({
              key: r.tag,
              rank: r.rank || i + 1,
              name: r.name,
              sub: `${r.memberCount} membres`,
              trophies: r.trophies,
              color: rankColor(i),
            }))}
          />
        )}
      </div>
    </section>
  );
}

interface Row {
  key: string;
  rank: number;
  name: string;
  sub: string;
  trophies: number;
  color: string;
  onClick?: () => void;
}

function RankingList({
  loading,
  error,
  onRetry,
  rows,
}: {
  loading: boolean;
  error: unknown;
  onRetry: () => void;
  rows: Row[];
}) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-12" />
        ))}
      </div>
    );
  }
  if (error) return <ErrorState error={error} onRetry={onRetry} />;
  if (rows.length === 0)
    return (
      <div className="py-10 text-center text-sm text-text-2">
        Aucun classement disponible pour cette zone.
      </div>
    );

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {rows.map((r) => {
        const Tag = r.onClick ? "button" : "div";
        return (
          <Tag
            key={r.key}
            onClick={r.onClick}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl border border-line bg-surface px-3 py-2.5 text-left",
              r.onClick && "card-hover",
            )}
          >
            <span className={cn("display w-7 text-base", r.color)}>
              {r.rank}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-bold text-text">
                {r.name}
              </div>
              <div className="truncate text-[11px] text-dim">{r.sub}</div>
            </div>
            <div className="display text-[13px] text-gold">
              <span className="inline-flex items-center gap-0.5"><IconTrophy size={12} />{fmtCompact(r.trophies)}</span>
            </div>
          </Tag>
        );
      })}
    </div>
  );
}
