import { useMemo, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import type { PlayerProfileAnalytics } from "../../types/analytics";
import { Card } from "../ui/Card";
import { Stat } from "../ui/Stat";
import { SectionTitle } from "../ui/SectionTitle";
import { RadialGauge } from "../ui/RadialGauge";
import { Img } from "../ui/Img";
import { cdn } from "../../utils/cdn";
import { fmtNum, fmtPercent, fmtDuration, fmtMode, relativeTime, fmtPlaytime, fmtHours } from "../../utils/format";
import { prettyBrawlerName } from "../../utils/brawlerName";
import { previousVisit } from "../../utils/profileHistory";
import { loadPlaytime } from "../../utils/battleStore";
import { estimateLifetimeSeconds } from "../../utils/playtime";
import { useAccumulatedBattles } from "../../hooks/useAccumulatedBattles";
import { accentHex } from "../ui/accent";
import {
  IconTrophy, IconSwords, IconFire, IconSparkles, IconStar, IconBolt,
  IconCrown, IconRobot, IconMedal, IconArrowRight, IconClub, IconClock, type IconProps,
} from "../ui/icons";

const MAX_POWER = 11;

function battleMs(raw: string): number {
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/.exec(raw);
  if (!m) return 0;
  const [, y, mo, d, h, mi, s] = m;
  return Date.parse(`${y}-${mo}-${d}T${h}:${mi}:${s}Z`);
}
const resultColor = (r?: string) =>
  r === "victory" ? accentHex.success : r === "defeat" ? accentHex.danger : accentHex.neutral;

export function OverviewTab({
  profile,
  tag,
  onOpenBrawler,
}: {
  profile: PlayerProfileAnalytics;
  tag: string;
  onOpenBrawler: (id: number) => void;
}) {
  const { player, summary } = profile;
  const navigate = useNavigate();
  const acc = useAccumulatedBattles(tag);
  const analytics = acc.analytics ?? profile.battlelog;

  const prev = useMemo(() => previousVisit(tag), [tag]);
  const sinceVisit = useMemo(() => {
    if (!prev) return null;
    const prevMs = new Date(prev.t).getTime();
    const recent = acc.items.filter((b) => battleMs(b.battleTime) > prevMs);
    const wins = recent.filter((b) => b.battle.result === "victory").length;
    const losses = recent.filter((b) => b.battle.result === "defeat").length;
    return {
      trophyDelta: player.trophies - prev.trophies,
      brawlerDelta: summary.brawlers.owned - prev.brawlers,
      wins,
      losses,
      when: relativeTime(prev.t),
      streak: acc.analytics?.currentStreak ?? null,
    };
  }, [prev, acc.items, acc.analytics, player.trophies, summary.brawlers.owned]);

  const maxRank = useMemo(() => player.brawlers.reduce((m, b) => Math.max(m, b.rank), 0), [player.brawlers]);
  const topBrawlers = useMemo(
    () => [...player.brawlers].sort((a, b) => b.trophies - a.trophies).slice(0, 8),
    [player.brawlers],
  );
  const best = topBrawlers[0] ?? null;
  const recentForm = acc.items.slice(0, 10);
  const club = "tag" in player.club ? player.club : null;

  const playtime = useMemo(() => loadPlaytime(tag), [tag, acc.items]);
  const estLifetimeSec = useMemo(
    () =>
      estimateLifetimeSeconds(
        summary.totalVictories,
        analytics?.winRate,
        analytics?.averageDurationSeconds,
      ),
    [analytics, summary.totalVictories],
  );

  const victories = [
    { label: "Victoires 3v3", value: player["3vs3Victories"], accent: "success" as const },
    { label: "Solo Showdown", value: player.soloVictories, accent: "gold" as const },
    { label: "Duo Showdown", value: player.duoVictories, accent: "cyan" as const },
    { label: "Total", value: summary.totalVictories, accent: "neutral" as const },
  ];

  const kit = [
    { label: "Star Powers", ratio: summary.completion.starPowers, total: summary.brawlers.totalStarPowers, accent: "bg-gold" },
    { label: "Gadgets", ratio: summary.completion.gadgets, total: summary.brawlers.totalGadgets, accent: "bg-success" },
    { label: "Gears", ratio: summary.completion.gears, total: summary.brawlers.totalGears, accent: "bg-cyan" },
  ];

  const records = [
    { Icon: IconBolt, label: "Niveau", value: fmtNum(player.expLevel), sub: `${fmtNum(player.expPoints)} XP` },
    { Icon: IconTrophy, label: "Pic de trophées", value: fmtNum(player.highestTrophies), sub: `actuel ${fmtNum(player.trophies)}` },
    { Icon: IconSwords, label: "Total victoires", value: fmtNum(summary.totalVictories), sub: `${fmtNum(player["3vs3Victories"])} en 3v3` },
    analytics && analytics.longestWinStreak > 0
      ? { Icon: IconFire, label: "Plus longue série", value: `${analytics.longestWinStreak} V`, sub: `sur ${analytics.countedBattles} matchs` }
      : null,
    player.bestRoboRumbleTime > 0
      ? { Icon: IconRobot, label: "Best Robo Rumble", value: `Niv. ${player.bestRoboRumbleTime}`, sub: "en coop" }
      : null,
    player.bestTimeAsBigBrawler > 0
      ? { Icon: IconCrown, label: "Best Big Brawler", value: fmtDuration(player.bestTimeAsBigBrawler), sub: "survie en Big Game" }
      : null,
    typeof player.highestPowerPlayPoints === "number" && player.highestPowerPlayPoints > 0
      ? { Icon: IconMedal, label: "Power Play (legacy)", value: fmtNum(player.highestPowerPlayPoints), sub: "record d'avant Ranked" }
      : null,
  ].filter(Boolean) as { Icon: (p: IconProps) => ReactNode; label: string; value: string; sub: string }[];

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
      {/* depuis ta dernière visite */}
      {sinceVisit && (
        <div className="rounded-2xl border border-violet/25 bg-gradient-to-br from-violet/15 to-cyan/5 p-4 lg:col-span-12">
          <div className="mb-3 flex items-center gap-2 text-violet">
            <IconSparkles size={16} />
            <span className="text-[12px] font-bold tracking-wide text-violet">Depuis ta dernière visite</span>
            <span className="ml-auto text-[11px] text-dim">{sinceVisit.when}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat align="center" accent={sinceVisit.trophyDelta >= 0 ? "success" : "danger"} value={`${sinceVisit.trophyDelta >= 0 ? "+" : ""}${fmtNum(sinceVisit.trophyDelta)}`} label="Trophées" />
            <Stat align="center" value={<>{sinceVisit.wins}<span className="text-dim text-base">/{sinceVisit.losses}</span></>} label="V / D" />
            <Stat align="center" accent="magenta" value={sinceVisit.streak?.type === "victory" ? <span className="inline-flex items-center gap-0.5"><IconFire size={16} />{sinceVisit.streak.length}</span> : "—"} label="Série" />
            <Stat align="center" accent="cyan" value={`${sinceVisit.brawlerDelta >= 0 ? "+" : ""}${sinceVisit.brawlerDelta}`} label="Brawler" />
          </div>
        </div>
      )}

      {/* victoires */}
      <Card padding="lg" className="lg:col-span-5">
        <SectionTitle>Victoires</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          {victories.map((v) => (
            <div key={v.label} className="rounded-xl border border-line bg-white/3 px-3 py-2.5">
              <Stat value={fmtNum(v.value)} label={v.label} accent={v.accent} size="sm" />
            </div>
          ))}
        </div>
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold text-muted">
            <span>3v3</span>
            <span>Showdown (solo + duo)</span>
          </div>
          <div className="flex h-2.5 overflow-hidden rounded-full bg-white/6">
            <div className="h-full bg-success" style={{ width: `${pct(player["3vs3Victories"], summary.totalVictories)}%` }} />
            <div className="h-full bg-gold" style={{ width: `${pct(player.soloVictories, summary.totalVictories)}%` }} />
            <div className="h-full bg-cyan" style={{ width: `${pct(player.duoVictories, summary.totalVictories)}%` }} />
          </div>
        </div>
      </Card>

      {/* collection */}
      <Card padding="lg" className="lg:col-span-7">
        <SectionTitle>Collection</SectionTitle>
        <div className="grid grid-cols-4 gap-2">
          <Stat align="center" size="sm" value={fmtNum(summary.brawlers.owned)} label="Possédés" />
          <Stat align="center" size="sm" accent="gold" value={fmtNum(summary.brawlers.maxedOut)} label="Power 11" />
          <Stat align="center" size="sm" accent="violet" value={summary.brawlers.averagePower.toFixed(1)} label="Power moy." />
          <Stat align="center" size="sm" accent="cyan" value={maxRank || "—"} label="Rank max" />
        </div>
        <div className="mt-4 space-y-2.5">
          {kit.map((k) => (
            <div key={k.label}>
              <div className="mb-1 flex items-center justify-between text-[11px] font-semibold text-muted">
                <span>{k.label}</span>
                <span className="text-text-2">{fmtNum(k.total)} · {fmtPercent(k.ratio, 0)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/6">
                <div className={`h-full rounded-full ${k.accent}`} style={{ width: `${Math.round(k.ratio * 100)}%` }} />
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between pt-1 text-[12px] font-semibold text-muted">
            <span>Complétion globale du kit</span>
            <span className="text-gold">{fmtPercent(summary.completion.overall, 0)}</span>
          </div>
        </div>
      </Card>

      {/* aperçu combat */}
      <Card padding="lg" className="lg:col-span-5">
        <SectionTitle
          action={
            analytics && analytics.countedBattles > 0 ? (
              <button onClick={() => navigate(`/player/${tag}?tab=analytics`)} className="inline-flex items-center gap-1 text-[12px] font-semibold text-cyan">
                Analytics <IconArrowRight size={13} />
              </button>
            ) : undefined
          }
        >
          Combat récent
        </SectionTitle>
        {analytics && analytics.countedBattles > 0 ? (
          <div className="flex items-center gap-4">
            <RadialGauge value={analytics.winRate} center={fmtPercent(analytics.winRate, 0)} label="Win rate" accent="success" size={96} />
            <div className="min-w-0 flex-1 space-y-2.5">
              <div>
                <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted">Forme récente</div>
                <div className="flex flex-wrap gap-1">
                  {recentForm.map((b, i) => (
                    <span key={i} className="h-2.5 w-2.5 rounded-full" style={{ background: resultColor(b.battle.result) }} />
                  ))}
                </div>
              </div>
              {analytics.favoriteMode && (
                <Line label="Mode favori" value={fmtMode(analytics.favoriteMode)} />
              )}
              {analytics.favoriteBrawler && (
                <Line label="Brawler favori" value={prettyBrawlerName(analytics.favoriteBrawler.name)} />
              )}
              <Line label="Série en cours" value={
                analytics.currentStreak.type
                  ? `${analytics.currentStreak.length} ${analytics.currentStreak.type === "victory" ? "V" : analytics.currentStreak.type === "defeat" ? "D" : "N"}`
                  : "—"
              } />
            </div>
          </div>
        ) : (
          <div className="py-6 text-center text-[13px] text-text-2">Pas encore de combats analysés.</div>
        )}
      </Card>

      {/* brawler du moment */}
      {best && (
        <button onClick={() => onOpenBrawler(best.id)} className="w-full text-left lg:col-span-7">
          <div className="relative h-full overflow-hidden rounded-2xl border border-gold/28 bg-gradient-to-br from-gold/14 via-magenta/5 to-transparent p-4 glow-gold">
            <div className="mb-2 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gold"><IconStar size={12} filled /> Brawler du moment</div>
            <div className="flex items-center gap-3">
              <Img src={cdn.brawlerBorderless(best.id)} alt={best.name} wrapperClassName="h-16 w-16 shrink-0" fallback={<span className="display text-gold">{best.name.slice(0, 2)}</span>} />
              <div className="min-w-0 flex-1">
                <div className="display text-xl text-white">{prettyBrawlerName(best.name)}</div>
                <div className="text-[12px] text-text-2">Rank {best.rank} · Power {best.power}/{MAX_POWER} · record {fmtNum(best.highestTrophies)}</div>
                {club && <div className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-cyan"><IconClub size={12} /> {club.name}</div>}
              </div>
              <div className="display inline-flex items-center gap-1 text-2xl text-gold"><IconTrophy size={20} />{fmtNum(best.trophies)}</div>
            </div>
          </div>
        </button>
      )}

      {/* temps de jeu */}
      <Card padding="lg" className="lg:col-span-12">
        <SectionTitle
          action={
            <button onClick={() => navigate(`/player/${tag}?tab=analytics`)} className="inline-flex items-center gap-1 text-[12px] font-semibold text-cyan">
              Détails <IconArrowRight size={13} />
            </button>
          }
        >
          Temps de jeu
        </SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-xl border border-cyan/20 bg-cyan/5 p-4">
            <span className="text-cyan"><IconClock size={24} /></span>
            <div>
              <div className="display text-2xl text-cyan">{fmtPlaytime(playtime.sec)}</div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                Temps suivi (en match) · {playtime.n} combats
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-gold/20 bg-gold/5 p-4">
            <div className="display text-2xl text-gold">≈ {fmtHours(estLifetimeSec)}</div>
            <div className="mt-0.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
              Estimation à vie
              <span className="rounded bg-white/10 px-1 py-0.5 text-[8px] font-semibold normal-case text-text-2">~ grossière</span>
            </div>
          </div>
        </div>
      </Card>

      {/* top brawlers */}
      <Card padding="lg" className="lg:col-span-12">
        <SectionTitle>Top brawlers</SectionTitle>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-8">
          {topBrawlers.map((b) => (
            <button key={b.id} onClick={() => onOpenBrawler(b.id)} className="flex flex-col items-center gap-1.5 rounded-2xl border border-line bg-white/3 p-2.5 card-hover">
              <Img src={cdn.brawlerBorderless(b.id)} alt={b.name} wrapperClassName="h-12 w-12" fallback={<span className="display text-[10px] text-gold">{b.name.slice(0, 2)}</span>} />
              <div className="w-full truncate text-center text-[10.5px] font-bold text-text">{prettyBrawlerName(b.name)}</div>
              <div className="display inline-flex items-center gap-0.5 text-[12px] text-gold"><IconTrophy size={12} />{fmtNum(b.trophies)}</div>
            </button>
          ))}
        </div>
      </Card>

      {/* records */}
      <Card padding="lg" className="lg:col-span-12">
        <SectionTitle>Records personnels</SectionTitle>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
          {records.map((r) => (
            <div key={r.label} className="rounded-xl border border-line bg-white/3 px-3 py-3">
              <div className="mb-1 flex items-start justify-between gap-2">
                <span className="text-[10px] font-semibold uppercase leading-tight tracking-wide text-muted">{r.label}</span>
                <span className="text-muted"><r.Icon size={16} /></span>
              </div>
              <div className="display text-xl text-text">{r.value}</div>
              <div className="mt-0.5 truncate text-[10.5px] text-dim">{r.sub}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

const pct = (n: number, total: number) => (total > 0 ? (n / total) * 100 : 0);

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2 border-b border-white/5 pb-1 text-[12px] last:border-0">
      <span className="text-muted">{label}</span>
      <span className="truncate font-semibold text-text">{value}</span>
    </div>
  );
}
