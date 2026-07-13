import { useMemo } from "react";
import type { PlayerProfileAnalytics } from "../../types/analytics";
import { Card } from "../ui/Card";
import { SectionTitle } from "../ui/SectionTitle";
import { RadialGauge } from "../ui/RadialGauge";
import { TrophyProgress } from "../player/TrophyProgress";
import { Img } from "../ui/Img";
import { cdn } from "../../utils/cdn";
import { fmtNum, fmtMode, fmtPercent, fmtDuration, fmtPlaytime, fmtHours } from "../../utils/format";
import { loadPlaytime } from "../../utils/battleStore";
import { estimateLifetimeSeconds } from "../../utils/playtime";
import { prettyBrawlerName } from "../../utils/brawlerName";
import { buildInsights } from "../../utils/insights";
import { useAccumulatedBattles } from "../../hooks/useAccumulatedBattles";
import { accentHex } from "../ui/accent";
import { IconFire, IconBulb, IconCheck, IconWarning, IconClock } from "../ui/icons";

function winColor(win: number): string {
  if (win >= 0.6) return accentHex.success;
  if (win >= 0.5) return accentHex.cyan;
  if (win >= 0.42) return accentHex.gold;
  return accentHex.danger;
}

export function AnalyticsTab({
  profile,
  tag,
}: {
  profile: PlayerProfileAnalytics;
  tag: string;
}) {
  const acc = useAccumulatedBattles(tag);
  const analytics = acc.analytics ?? profile.battlelog;
  const summary = profile.summary;

  const insights = useMemo(() => buildInsights(analytics), [analytics]);
  const modes = (analytics?.modes ?? []).filter((m) => m.battles >= 2).slice(0, 6);
  const hasData = analytics && analytics.countedBattles > 0;

  const brawlerPerf = useMemo(
    () =>
      (analytics?.brawlers ?? [])
        .filter((b) => b.battles >= 2)
        .sort((a, b) => b.battles - a.battles || b.winRate - a.winRate)
        .slice(0, 8),
    [analytics],
  );
  const maps = useMemo(() => {
    const list = (analytics?.maps ?? []).filter(
      (m) => m.battles >= 2 && m.map && m.map !== "unknown",
    );
    const best = [...list].sort((a, b) => b.winRate - a.winRate).slice(0, 3);
    const worst = [...list]
      .sort((a, b) => a.winRate - b.winRate)
      .slice(0, 3)
      .filter((m) => !best.includes(m));
    return { best, worst };
  }, [analytics]);

  // Temps de jeu suivi : compteur cumulé persistant (grandit à chaque nouveau
  // combat vu, survit à l'éviction des vieux matchs de l'archive).
  const tracked = useMemo(() => loadPlaytime(tag), [tag, acc.items]);
  // Estimation à vie (grossière) : parties × (durée en match + menus/matchmaking).
  const estLifetimeSec = useMemo(
    () =>
      estimateLifetimeSeconds(
        summary.totalVictories,
        analytics?.winRate,
        analytics?.averageDurationSeconds,
      ),
    [analytics, summary.totalVictories],
  );

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-12">
      {/* Progression des trophées (ex-onglet Historique, fusionné ici) */}
      <TrophyProgress profile={profile} tag={tag} />

      {hasData ? (
        <>
          {/* Win rate + chiffres clés */}
          <Card padding="lg" className="col-span-2 flex items-center justify-center lg:col-span-4">
            <RadialGauge
              value={analytics.winRate}
              center={fmtPercent(analytics.winRate, 0)}
              label="Win rate"
              accent="success"
              size={128}
            />
          </Card>
          <Card padding="lg" className="col-span-2 lg:col-span-8">
            <SectionTitle>Sur {analytics.countedBattles} combats analysés</SectionTitle>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <KeyStat value={<span className="inline-flex items-center gap-0.5"><IconFire size={16} />{analytics.longestWinStreak}</span>} label="Plus longue série" accent="text-magenta" />
              <KeyStat value={fmtPercent(analytics.starPlayerRate, 0)} label="Star Player" accent="text-gold" />
              <KeyStat
                value={`${analytics.totalTrophyChange >= 0 ? "+" : ""}${fmtNum(analytics.totalTrophyChange)}`}
                label="Δ trophées"
                accent={analytics.totalTrophyChange >= 0 ? "text-success" : "text-danger"}
              />
              <KeyStat
                value={`${analytics.averageTrophyChange >= 0 ? "+" : ""}${analytics.averageTrophyChange.toFixed(1)}`}
                label="Δ moyen / combat"
                accent={analytics.averageTrophyChange >= 0 ? "text-success" : "text-danger"}
              />
              <KeyStat
                value={fmtDuration(analytics.averageDurationSeconds)}
                label="Durée moyenne"
                accent="text-cyan"
              />
              <KeyStat
                value={`${analytics.results.victory}/${analytics.results.draw}/${analytics.results.defeat}`}
                label="V / N / D"
                accent="text-text"
              />
            </div>
          </Card>

          {/* Perf par brawler */}
          {brawlerPerf.length > 0 && (
            <Card padding="lg" className="col-span-2 lg:col-span-7">
              <SectionTitle>Tes brawlers en combat</SectionTitle>
              <div className="space-y-1.5">
                {brawlerPerf.map((b) => (
                  <div key={b.id} className="flex items-center gap-3 rounded-xl bg-white/3 px-2.5 py-2">
                    <Img
                      src={cdn.brawlerBorderless(b.id)}
                      alt={b.name}
                      wrapperClassName="h-8 w-8 shrink-0"
                      fallback={<span className="display text-[9px] text-gold">{b.name.slice(0, 2)}</span>}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[12.5px] font-bold text-text">{prettyBrawlerName(b.name)}</div>
                      <div className="text-[10px] text-dim">{b.battles} matchs · {b.wins}V {b.losses}D</div>
                    </div>
                    <div
                      className="font-mono text-[11px]"
                      style={{ color: b.trophyChange >= 0 ? accentHex.success : accentHex.danger }}
                    >
                      {b.trophyChange >= 0 ? "+" : ""}{b.trophyChange}
                    </div>
                    <div className="w-11 text-right text-[13px] font-extrabold" style={{ color: winColor(b.winRate) }}>
                      {fmtPercent(b.winRate, 0)}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Meilleures / pires maps */}
          {(maps.best.length > 0 || maps.worst.length > 0) && (
            <Card padding="lg" className="col-span-2 lg:col-span-5">
              <SectionTitle>Maps</SectionTitle>
              <MapList title={<span className="inline-flex items-center gap-1 text-success"><IconCheck size={12} /> Meilleures</span>} items={maps.best} />
              {maps.worst.length > 0 && (
                <div className="mt-3">
                  <MapList title={<span className="inline-flex items-center gap-1 text-danger"><IconWarning size={12} /> Pires</span>} items={maps.worst} />
                </div>
              )}
            </Card>
          )}

          {/* Winrate par mode */}
          {modes.length > 0 && (
            <Card padding="lg" className="col-span-2 lg:col-span-7">
              <SectionTitle>Winrate par mode</SectionTitle>
              <div className="space-y-3">
                {modes.map((m) => {
                  const c = winColor(m.winRate);
                  return (
                    <div key={m.mode}>
                      <div className="mb-1 flex items-center justify-between text-[12px] font-semibold text-text-2">
                        <span>{fmtMode(m.mode)} <span className="text-dim">· {m.battles}</span></span>
                        <span style={{ color: c }}>{fmtPercent(m.winRate, 0)}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/7">
                        <div className="h-full rounded-full" style={{ width: `${Math.round(m.winRate * 100)}%`, background: c }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Insights */}
          {insights.length > 0 && (
            <div className="col-span-2 rounded-2xl border border-cyan/22 bg-gradient-to-br from-cyan/10 to-violet/5 p-4 lg:col-span-5">
              <div className="mb-3 flex items-center gap-2">
                <span className="text-cyan"><IconBulb size={16} /></span>
                <span className="text-[12px] font-bold tracking-wide text-cyan">Insights auto</span>
              </div>
              <div className="space-y-2.5">
                {insights.map((t, i) => (
                  <div key={i} className="flex gap-2 text-[13px] leading-relaxed text-text">
                    <span className="text-cyan">›</span>
                    <span>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="col-span-2 px-6 py-10 text-center text-sm text-text-2 lg:col-span-12">
          Pas encore assez de combats analysés. Joue quelques parties puis reviens — l'historique s'accumule à chaque visite.
        </div>
      )}

      {/* Temps de jeu */}
      <Card padding="lg" className="col-span-2 lg:col-span-12">
        <SectionTitle>Temps de jeu</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-cyan/20 bg-cyan/5 p-4">
            <div className="mb-1 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-cyan">
              <IconClock size={13} /> Temps suivi (en match)
            </div>
            <div className="display text-2xl text-cyan">{fmtPlaytime(tracked.sec)}</div>
            <div className="mt-1 text-[11px] leading-relaxed text-dim">
              {tracked.n > 0
                ? `Somme exacte des durées de ${tracked.n} combats enregistrés depuis que tu suis ce profil — grandit à chaque visite.`
                : "Se remplira au fil de tes visites (durées réelles des combats)."}
            </div>
          </div>
          <div className="rounded-xl border border-gold/20 bg-gold/5 p-4">
            <div className="mb-1 flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wide text-gold">Estimation à vie</span>
              <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-semibold text-text-2">~ grossière</span>
            </div>
            <div className="display text-2xl text-gold">≈ {fmtHours(estLifetimeSec)}</div>
            <div className="mt-1 text-[11px] leading-relaxed text-dim">
              {fmtNum(summary.totalVictories)} victoires ÷ winrate{" "}
              {analytics ? fmtPercent(analytics.winRate, 0) : "≈ 50 %"} × (durée moyenne
              en match + ~45 s de menus / matchmaking / rejouer par partie).
              Ordre de grandeur — l'API ne fournit pas le vrai temps de jeu.
            </div>
          </div>
        </div>
      </Card>

      {/* Répartition de la collection (toujours) */}
      <Card padding="lg" className="col-span-2 lg:col-span-12">
        <SectionTitle>Ta collection · {fmtNum(summary.brawlers.owned)} brawlers</SectionTitle>
        <div className="grid gap-5 sm:grid-cols-2">
          <Distribution title="Par niveau de power" dist={summary.powerDistribution} accent={accentHex.gold} />
          <Distribution title="Par trophées" dist={summary.trophyDistribution} accent={accentHex.cyan} />
        </div>
      </Card>
    </div>
  );
}

function KeyStat({ value, label, accent }: { value: React.ReactNode; label: string; accent: string }) {
  return (
    <div className="rounded-xl border border-line bg-white/3 px-3 py-2.5 text-center">
      <div className={`display text-xl ${accent}`}>{value}</div>
      <div className="mt-0.5 text-[9.5px] font-semibold uppercase tracking-wide text-muted">{label}</div>
    </div>
  );
}

function MapList({
  title,
  items,
}: {
  title: React.ReactNode;
  items: { map: string; mode: string; battles: number; winRate: number }[];
}) {
  return (
    <div>
      <div className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted">{title}</div>
      <div className="space-y-1.5">
        {items.map((m) => (
          <div key={`${m.mode}-${m.map}`} className="flex items-center gap-2 rounded-lg bg-white/3 px-2.5 py-1.5">
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12px] font-semibold text-text">{m.map}</div>
              <div className="text-[10px] text-dim">{fmtMode(m.mode)} · {m.battles}</div>
            </div>
            <span className="text-[13px] font-extrabold" style={{ color: winColor(m.winRate) }}>
              {fmtPercent(m.winRate, 0)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Distribution({
  title,
  dist,
  accent,
}: {
  title: string;
  dist: Record<string, number>;
  accent: string;
}) {
  const entries = Object.entries(dist).filter(([, v]) => v > 0);
  const max = Math.max(1, ...entries.map(([, v]) => v));
  return (
    <div>
      <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted">{title}</div>
      <div className="space-y-1.5">
        {entries.map(([label, v]) => (
          <div key={label} className="flex items-center gap-2">
            <span className="w-14 shrink-0 text-right font-mono text-[11px] text-text-2">{label}</span>
            <div className="h-3 flex-1 overflow-hidden rounded bg-white/6">
              <div className="h-full rounded" style={{ width: `${(v / max) * 100}%`, background: accent }} />
            </div>
            <span className="w-6 text-right text-[11px] font-bold text-text">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
