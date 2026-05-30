import type { PlayerProfileAnalytics } from "../../types/analytics";
import type { PlayerBrawler } from "../../types/brawlstars";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Img } from "../ui/Img";
import { useAccumulatedBattles } from "../../hooks/useAccumulatedBattles";
import { fmtDuration, fmtNum, fmtPercent } from "../../utils/format";
import { cdn } from "../../utils/cdn";
import { cn } from "../../utils/cn";
import { displayTag } from "../../utils/tag";

const MAX_POWER = 11;
const MAX_RANK = 35;

export function OverviewTab({
  profile,
  tag,
}: {
  profile: PlayerProfileAnalytics;
  tag: string;
}) {
  const { player, summary } = profile;
  const accumulated = useAccumulatedBattles(tag);
  const battlelog =
    accumulated.analytics &&
    accumulated.analytics.totalBattles >= (profile.battlelog?.totalBattles ?? 0)
      ? accumulated.analytics
      : profile.battlelog;

  const topBrawlers = [...player.brawlers]
    .sort((a, b) => b.trophies - a.trophies)
    .slice(0, 6);
  const bestBrawler = topBrawlers[0] ?? null;

  const showdownTotal = player.soloVictories + player.duoVictories;
  const hasPowerPlay =
    typeof player.highestPowerPlayPoints === "number" &&
    player.highestPowerPlayPoints > 0;

  return (
    <div className="grid grid-cols-12 gap-4 mt-4">
      {/* ──────────────────────────────────────────────────────────────
       *  IDENTITÉ — icône, pseudo, club
       * ────────────────────────────────────────────────────────────── */}
      <Card className="col-span-12 lg:col-span-5" padding="lg">
        <SectionTitle>Profil</SectionTitle>
        <div className="flex items-center gap-4 mb-4">
          <div className="shrink-0 w-20 h-20 rounded-full bg-gradient-to-br from-brand-yellow to-brand-magenta p-[2px] glow-yellow">
            <Img
              src={
                player.icon?.id ? cdn.playerIcon(player.icon.id) : undefined
              }
              alt={player.name}
              wrapperClassName="w-full h-full rounded-full bg-bg-surface"
              fit="cover"
              fallback={
                <span className="display text-brand-yellow text-2xl">
                  {player.name.slice(0, 2).toUpperCase()}
                </span>
              }
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="display text-2xl truncate">{player.name}</div>
            <div className="display text-brand-yellow text-sm">
              {displayTag(player.tag)}
            </div>
            {player.nameColor && (
              <div className="mt-1 inline-flex items-center gap-1.5 text-xs text-text-dim">
                <span
                  className="w-3 h-3 rounded-full ring-1 ring-white/15"
                  style={{ background: nameColorToCss(player.nameColor) }}
                />
                <span className="font-mono">{player.nameColor}</span>
              </div>
            )}
          </div>
        </div>

        <KV label="Icône (ID)" value={`#${player.icon?.id ?? "—"}`} />
        <KV
          label="Club"
          value={
            "tag" in player.club && typeof player.club.tag === "string"
              ? `${player.club.name}  ·  ${displayTag(player.club.tag)}`
              : "Sans club"
          }
        />
        <KV
          label="Championship"
          value={
            player.isQualifiedFromChampionshipChallenge
              ? "Qualifié ✓"
              : "Non qualifié"
          }
          accent={
            player.isQualifiedFromChampionshipChallenge ? "success" : undefined
          }
        />
      </Card>

      {/* ──────────────────────────────────────────────────────────────
       *  TROPHÉES + XP — chiffres complets, pas d'abréviation
       * ────────────────────────────────────────────────────────────── */}
      <BigStatCard
        className="col-span-12 md:col-span-6 lg:col-span-4"
        label="Trophées"
        icon="🏆"
        accent="yellow"
        primary={fmtNum(player.trophies)}
        secondary={`record ${fmtNum(player.highestTrophies)}`}
        progressLabel="Vs record personnel"
        progress={player.trophies / Math.max(1, player.highestTrophies)}
      />

      <BigStatCard
        className="col-span-12 md:col-span-6 lg:col-span-3"
        label="Niveau"
        icon="⚡"
        accent="cyan"
        primary={fmtNum(player.expLevel)}
        secondary={`${fmtNum(player.expPoints)} pts d'XP`}
      />

      {/* ──────────────────────────────────────────────────────────────
       *  VICTOIRES — 3v3 / Solo / Duo séparés
       * ────────────────────────────────────────────────────────────── */}
      <Card className="col-span-12" padding="md">
        <SectionTitle>Victoires</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <VictoryStat
            mode="3v3"
            value={player["3vs3Victories"]}
            accent="yellow"
            note="Gem Grab, Brawl Ball, Heist, Bounty, Hot Zone, Knockout…"
          />
          <VictoryStat
            mode="Solo Showdown"
            value={player.soloVictories}
            accent="magenta"
            note="Top 1 en solo (jusqu'à 10 joueurs)"
          />
          <VictoryStat
            mode="Duo Showdown"
            value={player.duoVictories}
            accent="cyan"
            note="Top 1 en équipe de 2 (jusqu'à 5 paires)"
          />
        </div>
        <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between flex-wrap gap-3">
          <span className="text-text-muted text-sm">
            Total victoires{" "}
            <span className="text-text-dim">(3v3 + Showdown solo + duo)</span>
          </span>
          <div className="display text-2xl text-gradient-y">
            {fmtNum(summary.totalVictories)}
          </div>
          <div className="text-text-dim text-xs">
            dont {fmtNum(showdownTotal)} en showdown
          </div>
        </div>
      </Card>

      {/* ──────────────────────────────────────────────────────────────
       *  COLLECTION DE BRAWLERS
       * ────────────────────────────────────────────────────────────── */}
      <Card className="col-span-12 lg:col-span-7" padding="md">
        <SectionTitle>Collection</SectionTitle>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MiniStat
            label="Brawlers"
            value={fmtNum(summary.brawlers.owned)}
            sub="possédés"
            accent="yellow"
          />
          <MiniStat
            label="Power 11"
            value={fmtNum(summary.brawlers.maxedOut)}
            sub={`sur ${summary.brawlers.owned}`}
            accent="yellow"
          />
          <MiniStat
            label="Power moyen"
            value={summary.brawlers.averagePower.toFixed(1)}
            sub={`sur ${MAX_POWER}`}
            accent="cyan"
          />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <KitBar
            label="Star Powers"
            value={summary.brawlers.totalStarPowers}
            max={summary.brawlers.owned * 2}
            ratio={summary.completion.starPowers}
            accent="yellow"
          />
          <KitBar
            label="Gadgets"
            value={summary.brawlers.totalGadgets}
            max={summary.brawlers.owned * 2}
            ratio={summary.completion.gadgets}
            accent="cyan"
          />
          <KitBar
            label="Gears"
            value={summary.brawlers.totalGears}
            max={summary.brawlers.owned * 5}
            ratio={summary.completion.gears}
            accent="violet"
          />
        </div>

        <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between flex-wrap gap-3">
          <span className="text-text-muted text-sm">Complétion globale</span>
          <div className="display text-2xl text-gradient-y">
            {fmtPercent(summary.completion.overall, 1)}
          </div>
        </div>
      </Card>

      {/* ──────────────────────────────────────────────────────────────
       *  MEILLEUR BRAWLER
       * ────────────────────────────────────────────────────────────── */}
      <Card className="col-span-12 lg:col-span-5" padding="md">
        <SectionTitle>Meilleur brawler</SectionTitle>
        {bestBrawler ? (
          <BestBrawler brawler={bestBrawler} />
        ) : (
          <div className="text-text-muted text-sm">Aucun brawler.</div>
        )}
      </Card>

      {/* ──────────────────────────────────────────────────────────────
       *  TOP BRAWLERS (carousel visuel avec portraits CDN)
       * ────────────────────────────────────────────────────────────── */}
      <Card className="col-span-12" padding="md">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <SectionTitle className="!mb-0">Top 6 brawlers</SectionTitle>
          <span className="text-text-dim text-xs">
            triés par trophées actuels
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {topBrawlers.map((b) => (
            <div
              key={b.id}
              className="surface rounded-xl p-2 flex flex-col items-center gap-2 text-center"
            >
              <Img
                src={cdn.brawlerBorder(b.id)}
                alt={b.name}
                wrapperClassName="w-16 h-16"
                fallback={
                  <span className="display text-brand-yellow text-xs">
                    {b.name.slice(0, 2)}
                  </span>
                }
              />
              <div className="display text-xs truncate w-full">{b.name}</div>
              <div className="display text-sm text-brand-yellow leading-none">
                {fmtNum(b.trophies)}
              </div>
              <div className="text-text-dim text-[10px]">
                P{b.power} · R{b.rank}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* ──────────────────────────────────────────────────────────────
       *  RECORDS PERSONNELS
       * ────────────────────────────────────────────────────────────── */}
      <Card className="col-span-12" padding="md">
        <SectionTitle>Records personnels</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Record
            label="Trophées (pic historique)"
            value={fmtNum(player.highestTrophies)}
            sub={`actuel ${fmtNum(player.trophies)}`}
            icon="🏆"
            accent="yellow"
          />
          <Record
            label="Meilleur brawler"
            value={
              bestBrawler ? fmtNum(bestBrawler.highestTrophies) : "—"
            }
            sub={bestBrawler?.name ?? "—"}
            icon="⭐"
            accent="magenta"
          />
          <Record
            label="Niveau XP atteint"
            value={fmtNum(player.expLevel)}
            sub={`${fmtNum(player.expPoints)} XP total`}
            icon="⚡"
            accent="cyan"
          />
          <Record
            label="Total victoires"
            value={fmtNum(summary.totalVictories)}
            sub={`${fmtNum(player["3vs3Victories"])} en 3v3`}
            icon="⚔"
            accent="violet"
          />
          <Record
            label="Best Robo Rumble"
            value={
              player.bestRoboRumbleTime > 0
                ? formatRoboTime(player.bestRoboRumbleTime)
                : "—"
            }
            sub="niveau atteint en coop"
            icon="🤖"
            accent="violet"
          />
          <Record
            label="Best en Big Brawler"
            value={
              player.bestTimeAsBigBrawler > 0
                ? fmtDuration(player.bestTimeAsBigBrawler)
                : "—"
            }
            sub="temps de survie en Big Game"
            icon="👑"
            accent="yellow"
          />
          {hasPowerPlay && (
            <Record
              label="Power Play (legacy)"
              value={fmtNum(player.highestPowerPlayPoints!)}
              sub="record d'avant Ranked"
              icon="🎖"
              accent="magenta"
            />
          )}
          {battlelog && battlelog.longestWinStreak > 0 && (
            <Record
              label="Plus longue série"
              value={`${battlelog.longestWinStreak} V`}
              sub={`sur ${battlelog.countedBattles} matchs analysés`}
              icon="🔥"
              accent="success"
            />
          )}
        </div>
      </Card>
    </div>
  );
}

// ============================================================
//                   Sub-components
// ============================================================

function SectionTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h3
      className={cn(
        "display text-xs uppercase tracking-widest text-text-muted mb-3",
        className,
      )}
    >
      {children}
    </h3>
  );
}

function KV({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "success" | "danger" | "warning";
}) {
  const c = {
    success: "text-success",
    danger: "text-danger",
    warning: "text-warning",
  };
  return (
    <div className="flex items-baseline justify-between py-1.5 border-b border-white/5 last:border-0 gap-3">
      <span className="text-text-muted text-xs">{label}</span>
      <span
        className={cn(
          "text-sm font-semibold truncate text-right",
          accent && c[accent],
        )}
      >
        {value}
      </span>
    </div>
  );
}

function BigStatCard({
  className,
  label,
  icon,
  accent,
  primary,
  secondary,
  progressLabel,
  progress,
}: {
  className?: string;
  label: string;
  icon: string;
  accent: "yellow" | "magenta" | "cyan" | "violet";
  primary: string;
  secondary: string;
  progressLabel?: string;
  progress?: number;
}) {
  const color = {
    yellow: "text-brand-yellow",
    magenta: "text-brand-magenta",
    cyan: "text-brand-cyan",
    violet: "text-brand-violet",
  }[accent];
  const fill = {
    yellow: "bg-brand-yellow",
    magenta: "bg-brand-magenta",
    cyan: "bg-brand-cyan",
    violet: "bg-brand-violet",
  }[accent];
  return (
    <Card className={className} padding="lg">
      <div className="flex items-center justify-between mb-1">
        <span className="text-text-muted text-xs uppercase tracking-wider">
          {label}
        </span>
        <span className="text-2xl leading-none" aria-hidden>
          {icon}
        </span>
      </div>
      <div className={cn("display text-4xl md:text-5xl mt-1", color)}>
        {primary}
      </div>
      <div className="text-text-dim text-xs mt-1">{secondary}</div>
      {progress !== undefined && progressLabel && (
        <div className="mt-4">
          <div className="flex justify-between items-baseline mb-1.5">
            <span className="text-text-muted text-xs">{progressLabel}</span>
            <span className="font-mono text-text-base text-xs">
              {fmtPercent(progress, 1)}
            </span>
          </div>
          <div className="h-2 rounded-full bg-white/5 overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", fill)}
              style={{ width: `${Math.min(100, progress * 100)}%` }}
            />
          </div>
        </div>
      )}
    </Card>
  );
}

function VictoryStat({
  mode,
  value,
  note,
  accent,
}: {
  mode: string;
  value: number;
  note: string;
  accent: "yellow" | "magenta" | "cyan";
}) {
  const color = {
    yellow: "text-brand-yellow",
    magenta: "text-brand-magenta",
    cyan: "text-brand-cyan",
  }[accent];
  return (
    <div className="surface rounded-xl p-4">
      <div className="text-text-muted text-xs uppercase tracking-wider">
        {mode}
      </div>
      <div className={cn("display text-3xl mt-1", color)}>{fmtNum(value)}</div>
      <div className="text-text-dim text-[11px] mt-2 leading-relaxed">
        {note}
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent: "yellow" | "magenta" | "cyan" | "violet";
}) {
  const color = {
    yellow: "text-brand-yellow",
    magenta: "text-brand-magenta",
    cyan: "text-brand-cyan",
    violet: "text-brand-violet",
  }[accent];
  return (
    <div className="surface rounded-xl p-3">
      <div className="text-text-muted text-[10px] uppercase tracking-wider">
        {label}
      </div>
      <div className={cn("display text-2xl leading-none mt-1", color)}>
        {value}
      </div>
      <div className="text-text-dim text-[10px] mt-1">{sub}</div>
    </div>
  );
}

function KitBar({
  label,
  value,
  max,
  ratio,
  accent,
}: {
  label: string;
  value: number;
  max: number;
  ratio: number;
  accent: "yellow" | "cyan" | "violet";
}) {
  const fill = {
    yellow: "bg-brand-yellow",
    cyan: "bg-brand-cyan",
    violet: "bg-brand-violet",
  }[accent];
  return (
    <div>
      <div className="flex justify-evenly items-baseline mb-1.5">
        <span className="text-sm text-text-muted">{label}</span>
        <span className="font-mono text-text-base text-xs">
          {value}/{max}
        </span>
      </div>
      {/* <div className="h-2 rounded-full bg-white/5 overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", fill)}
          style={{ width: `${Math.min(100, ratio * 100)}%` }}
        />
      </div> */}
      {/* <div className="text-text-dim text-[10px] mt-0.5">
        {fmtPercent(ratio, 1)} complet
      </div> */}
    </div>
  );
}

function Record({
  label,
  value,
  sub,
  icon,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  icon: string;
  accent: "yellow" | "magenta" | "cyan" | "violet" | "success";
}) {
  const color = {
    yellow: "text-brand-yellow",
    magenta: "text-brand-magenta",
    cyan: "text-brand-cyan",
    violet: "text-brand-violet",
    success: "text-success",
  }[accent];
  return (
    <div className="surface rounded-xl p-4">
      <div className="flex items-start justify-between gap-2 mb-1">
        <span className="text-text-muted text-[10px] uppercase tracking-wider leading-tight">
          {label}
        </span>
        <span className="text-xl leading-none" aria-hidden>
          {icon}
        </span>
      </div>
      <div className={cn("display text-2xl leading-none mt-2", color)}>
        {value}
      </div>
      <div className="text-text-dim text-[11px] mt-1.5 truncate">{sub}</div>
    </div>
  );
}

function BestBrawler({ brawler: b }: { brawler: PlayerBrawler }) {
  return (
    <div className="flex items-center gap-4">
      <Img
        src={cdn.brawlerBorder(b.id)}
        alt={b.name}
        wrapperClassName="shrink-0 w-24 h-24"
        fallback={
          <span className="display text-brand-yellow text-lg">
            {b.name.slice(0, 2)}
          </span>
        }
      />
      <div className="min-w-0 flex-1">
        <div className="display text-2xl truncate">{b.name}</div>
        <div className="text-text-dim text-xs">#{b.id}</div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          <Badge tone={b.power >= MAX_POWER ? "yellow" : "neutral"}>
            P{b.power}
          </Badge>
          <Badge tone={b.rank >= MAX_RANK ? "magenta" : "neutral"}>
            R{b.rank}
          </Badge>
          <Badge tone="cyan">{b.starPowers.length}/2 SP</Badge>
          <Badge tone="cyan">{b.gadgets.length}/3 GA</Badge>
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="display text-3xl text-brand-yellow leading-none">
          {fmtNum(b.trophies)}
        </div>
        <div className="text-text-dim text-[10px] mt-1">
          record {fmtNum(b.highestTrophies)}
        </div>
      </div>
    </div>
  );
}

// ============================================================
//                       Helpers
// ============================================================

/**
 * Brawl Stars `nameColor` is encoded as "0xAARRGGBB" (the Supercell engine
 * embeds the alpha in the high byte). Strip the alpha to get a usable CSS
 * color.
 */
function nameColorToCss(raw: string | undefined): string {
  if (!raw) return "transparent";
  const m = /^0x([0-9a-fA-F]{8})$/.exec(raw);
  if (!m) return raw;
  const hex = m[1]!.slice(2); // drop AA
  return `#${hex}`;
}

/**
 * `bestRoboRumbleTime` is exposed as an integer "level reached" (per the
 * Supercell API contract), not seconds. Display it as a rank.
 */
function formatRoboTime(level: number): string {
  return `Niveau ${level}`;
}
