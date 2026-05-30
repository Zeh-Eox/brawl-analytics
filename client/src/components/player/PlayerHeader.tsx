import { motion } from "framer-motion";
import type { Player } from "../../types/brawlstars";
import { fmtCompact, fmtNum } from "../../utils/format";
import { Skeleton } from "../ui/Skeleton";
import { Img } from "../ui/Img";
import { displayTag } from "../../utils/tag";
import { cdn } from "../../utils/cdn";

const TROPHY = "🏆";

const hasClub = (p: Player): p is Player & { club: { tag: string; name: string } } =>
  "tag" in p.club && typeof (p.club as { tag?: string }).tag === "string";

export function PlayerHeader({ player }: { player: Player }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="surface-elevated relative overflow-hidden rounded-2xl p-5 md:p-8"
    >
      <div
        aria-hidden
        className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-brand-yellow/15 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute -bottom-32 -left-24 w-72 h-72 rounded-full bg-brand-magenta/15 blur-3xl"
      />

      <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="flex items-center gap-4 md:gap-5 min-w-0">
          {/* Brawlify profile icons are circular PNGs with transparent corners.
              The outer ring stays circular too so no dark square ever shows
              through; the inner Img uses object-cover to fill edge-to-edge. */}
          <div className="shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-brand-yellow to-brand-magenta p-[2px] glow-yellow">
            <Img
              src={player.icon?.id ? cdn.playerIcon(player.icon.id) : undefined}
              alt={`${player.name} avatar`}
              wrapperClassName="w-full h-full rounded-full bg-bg-surface"
              fit="cover"
              fallback={
                <span className="display text-brand-yellow text-2xl md:text-3xl">
                  {player.name.slice(0, 2).toUpperCase()}
                </span>
              }
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-baseline gap-3 min-w-0">
              <h1 className="display text-3xl md:text-5xl truncate">
                {player.name}
              </h1>
              <span className="display text-brand-yellow text-base md:text-xl shrink-0">
                {displayTag(player.tag)}
              </span>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-text-muted">
              <span>Niveau {player.expLevel}</span>
              {hasClub(player) && (
                <>
                  <span className="text-text-dim">·</span>
                  <span>
                    Club{" "}
                    <span className="text-text-base font-semibold">
                      {player.club.name}
                    </span>
                  </span>
                </>
              )}
              {player.isQualifiedFromChampionshipChallenge && (
                <>
                  <span className="text-text-dim">·</span>
                  <span className="text-brand-yellow font-semibold">
                    Championship qualifié
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-3 md:gap-4">
          <Stat
            label="Trophées"
            value={fmtCompact(player.trophies)}
            sub={`max ${fmtCompact(player.highestTrophies)}`}
            icon={TROPHY}
            tone="yellow"
          />
          <Stat
            label="Victoires"
            value={fmtCompact(
              player["3vs3Victories"] +
                player.soloVictories +
                player.duoVictories,
            )}
            sub={`${fmtNum(player["3vs3Victories"])} 3v3`}
            icon="⚔"
            tone="magenta"
          />
        </div>
      </div>
    </motion.section>
  );
}

function Stat({
  label,
  value,
  sub,
  icon,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  icon: string;
  tone: "yellow" | "magenta";
}) {
  return (
    <div
      className={`px-4 py-3 rounded-2xl bg-white/5 border border-white/10 min-w-[120px] ${tone === "yellow" ? "glow-yellow" : "glow-magenta"}`}
    >
      <div className="text-xs text-text-muted uppercase tracking-wider flex items-center gap-1.5">
        <span aria-hidden>{icon}</span>
        {label}
      </div>
      <div className="display text-2xl md:text-3xl mt-0.5">{value}</div>
      <div className="text-[10px] text-text-dim mt-0.5">{sub}</div>
    </div>
  );
}

export function PlayerHeaderSkeleton() {
  return (
    <div className="surface-elevated rounded-2xl p-5 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div className="flex items-center gap-5">
        <Skeleton className="w-16 h-16 md:w-20 md:h-20" rounded="rounded-2xl" />
        <div className="space-y-2">
          <Skeleton className="h-7 md:h-10 w-44 md:w-56" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
      <div className="flex gap-3">
        <Skeleton className="w-32 h-20" rounded="rounded-2xl" />
        <Skeleton className="w-32 h-20" rounded="rounded-2xl" />
      </div>
    </div>
  );
}
