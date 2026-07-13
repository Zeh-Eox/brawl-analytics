import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import type { Player } from "../../types/brawlstars";
import { Avatar } from "../ui/Avatar";
import { Skeleton } from "../ui/Skeleton";
import { IconTrophy, IconMedal, IconStar, IconSwords, IconShare, IconClub } from "../ui/icons";
import { cn } from "../../utils/cn";
import { displayTag } from "../../utils/tag";
import { fmtNum } from "../../utils/format";
import { nameColorToCss } from "../../utils/color";
import { isFavorite, toggleFavorite } from "../../utils/favorites";

export function PlayerHeader({
  player,
  tag,
  onShare,
}: {
  player: Player;
  tag: string;
  onShare: () => void;
}) {
  const navigate = useNavigate();
  const [pinned, setPinned] = useState(() => isFavorite(tag));
  const club = "tag" in player.club ? player.club : null;

  function togglePin() {
    toggleFavorite({
      tag,
      name: player.name,
      iconId: player.icon?.id,
      trophies: player.trophies,
    });
    setPinned((v) => !v);
  }

  return (
    <div className="surface anim-in overflow-hidden p-4 md:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* identité */}
        <div className="flex items-center gap-4">
          <Avatar
            iconId={player.icon?.id}
            name={player.name}
            className="h-16 w-16 shrink-0 border border-white/10 text-xl"
          />
          <div className="min-w-0">
            <h1
              className="display truncate text-2xl md:text-[1.7rem]"
              style={{ color: nameColorToCss(player.nameColor) }}
            >
              {player.name}
            </h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-white/5 px-2 py-0.5 font-mono text-[12px] text-muted">
                {displayTag(player.tag)}
              </span>
              {club && (
                <button
                  onClick={() => navigate(`/player/${tag}?tab=club`)}
                  className="inline-flex items-center gap-1 text-[12px] font-semibold text-cyan hover:underline"
                >
                  <IconClub size={13} /> {club.name}
                </button>
              )}
              {player.isQualifiedFromChampionshipChallenge && (
                <span className="inline-flex items-center gap-1 rounded-md bg-gold/12 px-2 py-0.5 text-[10px] font-bold text-gold">
                  <IconMedal size={12} /> CHAMPIONSHIP
                </span>
              )}
            </div>
          </div>
        </div>

        {/* stats + actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:gap-4">
          <div className="grid grid-cols-3 gap-2 sm:flex">
            <KeyStat
              value={
                <span className="inline-flex items-center gap-1">
                  <IconTrophy size={15} />
                  {fmtNum(player.trophies)}
                </span>
              }
              label="Trophées"
              gold
            />
            <KeyStat value={fmtNum(player.highestTrophies)} label="Record" />
            <KeyStat value={fmtNum(player.expLevel)} label="Niveau" />
          </div>
          <div className="flex gap-2">
            <button
              onClick={togglePin}
              aria-label={pinned ? "Ne plus épingler" : "Épingler"}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-[13px] font-bold transition-colors",
                pinned
                  ? "border-gold/40 bg-gold/12 text-gold"
                  : "border-line-strong bg-white/5 text-text hover:bg-white/10",
              )}
            >
              <IconStar size={15} filled={pinned} />
              <span className="hidden sm:inline">
                {pinned ? "Épinglé" : "Épingler"}
              </span>
            </button>
            <button
              onClick={() => navigate(`/compare?a=${tag}`)}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-line-strong bg-white/5 px-3 py-2.5 text-[13px] font-bold text-text hover:bg-white/10"
            >
              <IconSwords size={15} /> <span className="hidden sm:inline">Comparer</span>
            </button>
            <button
              onClick={onShare}
              aria-label="Partager"
              className="grid place-items-center rounded-xl border border-line-strong bg-white/5 px-3.5 text-text hover:bg-white/10"
            >
              <IconShare size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function KeyStat({
  value,
  label,
  gold = false,
}: {
  value: ReactNode;
  label: string;
  gold?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-3 py-2 text-center sm:min-w-[92px]",
        gold ? "border-gold/25 bg-gold/10" : "border-line bg-white/5",
      )}
    >
      <div className={cn("display text-lg", gold ? "text-gold" : "text-text")}>
        {value}
      </div>
      <div className="mt-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </div>
    </div>
  );
}

export function PlayerHeaderSkeleton() {
  return (
    <div className="surface p-4 md:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-12 w-24" />
          <Skeleton className="h-12 w-24" />
          <Skeleton className="h-12 w-24" />
        </div>
      </div>
    </div>
  );
}
