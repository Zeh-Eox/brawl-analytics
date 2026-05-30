import { useEffect } from "react";
import { motion } from "framer-motion";
import type {
  BattleLogItem,
  BattlePlayer,
} from "../../types/brawlstars";
import { fmtBattleTime, fmtDuration, fmtMode } from "../../utils/format";
import { Badge } from "../ui/Badge";
import { Img } from "../ui/Img";
import { cdn } from "../../utils/cdn";
import { displayTag } from "../../utils/tag";

interface Props {
  item: BattleLogItem;
  playerTag: string;
  onClose: () => void;
}

export function BattleDetailModal({ item, playerTag, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const { battle, event } = item;
  const result = battle.result;
  const tone =
    result === "victory"
      ? "success"
      : result === "defeat"
        ? "danger"
        : result === "draw"
          ? "warning"
          : "neutral";
  const label =
    result === "victory"
      ? "Victoire"
      : result === "defeat"
        ? "Défaite"
        : result === "draw"
          ? "Match nul"
          : battle.rank !== undefined
            ? `Rang ${battle.rank}`
            : "—";

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 grid place-items-center p-4 md:p-8 bg-bg-overlay backdrop-blur-md"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto surface-elevated rounded-2xl"
      >
        {/* Header */}
        <div className="relative p-5 md:p-6 border-b border-white/5 flex items-center gap-4">
          <Img
            src={cdn.map(event.id)}
            alt={event.map}
            wrapperClassName="hidden sm:block w-20 h-20 rounded-xl border border-white/10"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge tone={tone as never}>{label}</Badge>
              <Badge tone="neutral">{fmtMode(event.mode || battle.mode)}</Badge>
            </div>
            <h2 className="display text-2xl mt-1 truncate">
              {event.map || "Map inconnue"}
            </h2>
            <div className="text-text-muted text-xs mt-0.5">
              {fmtBattleTime(item.battleTime)} ·{" "}
              {fmtDuration(battle.duration ?? null)}
              {battle.type && <> · {battle.type}</>}
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Fermer"
            className="shrink-0 w-9 h-9 grid place-items-center rounded-full bg-white/5 hover:bg-white/10 text-text-muted hover:text-text-base"
          >
            ✕
          </button>
        </div>

        {/* Numbers grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-5 md:p-6">
          <Stat
            label="Trophées"
            value={
              battle.trophyChange !== undefined && battle.trophyChange !== 0
                ? battle.trophyChange > 0
                  ? `+${battle.trophyChange}`
                  : `${battle.trophyChange}`
                : "—"
            }
            tone={
              battle.trophyChange && battle.trophyChange > 0
                ? "success"
                : battle.trophyChange && battle.trophyChange < 0
                  ? "danger"
                  : "neutral"
            }
          />
          <Stat
            label="Durée"
            value={fmtDuration(battle.duration ?? null)}
          />
          <Stat
            label="Star Player"
            value={
              battle.starPlayer
                ? battle.starPlayer.tag === playerTag
                  ? "Toi ★"
                  : battle.starPlayer.name
                : "—"
            }
            tone={
              battle.starPlayer?.tag === playerTag ? "warning" : "neutral"
            }
          />
          <Stat
            label="Rang"
            value={battle.rank !== undefined ? `#${battle.rank}` : "—"}
          />
        </div>

        {/* Teams or players */}
        <div className="px-5 md:px-6 pb-6">
          {battle.teams && battle.teams.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2">
              {battle.teams.map((team, idx) => (
                <Team
                  key={idx}
                  team={team}
                  index={idx}
                  playerTag={playerTag}
                />
              ))}
            </div>
          ) : battle.players && battle.players.length > 0 ? (
            <div>
              <h3 className="display text-sm uppercase tracking-wider text-text-muted mb-2">
                Joueurs
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {battle.players.map((p) => (
                  <PlayerRow
                    key={p.tag}
                    player={p}
                    isOwn={p.tag === playerTag}
                  />
                ))}
              </div>
            </div>
          ) : (
            <p className="text-text-muted text-sm text-center">
              Pas de détails d'équipe pour ce mode.
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "success" | "danger" | "warning";
}) {
  const color = {
    neutral: "text-text-base",
    success: "text-success",
    danger: "text-danger",
    warning: "text-warning",
  }[tone];
  return (
    <div className="surface rounded-xl p-3 text-center">
      <div className="text-[10px] uppercase tracking-wider text-text-dim">
        {label}
      </div>
      <div className={`display text-xl mt-1 ${color}`}>{value}</div>
    </div>
  );
}

function Team({
  team,
  index,
  playerTag,
}: {
  team: BattlePlayer[];
  index: number;
  playerTag: string;
}) {
  const hasOwn = team.some((p) => p.tag === playerTag);
  return (
    <div
      className={`surface rounded-xl p-3 ${hasOwn ? "ring-1 ring-brand-yellow/40" : ""}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="display text-sm uppercase tracking-wider text-text-muted">
          Équipe {index + 1}
        </span>
        {hasOwn && <Badge tone="yellow">Toi</Badge>}
      </div>
      <div className="space-y-1.5">
        {team.map((p) => (
          <PlayerRow key={p.tag} player={p} isOwn={p.tag === playerTag} />
        ))}
      </div>
    </div>
  );
}

function PlayerRow({
  player,
  isOwn,
}: {
  player: BattlePlayer;
  isOwn: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2.5 p-2 rounded-lg ${isOwn ? "bg-brand-yellow/10" : "bg-white/3"}`}
    >
      <Img
        src={cdn.brawlerBorderless(player.brawler.id)}
        alt={player.brawler.name}
        wrapperClassName="w-10 h-10 rounded-md shrink-0"
        fallback={
          <span className="display text-brand-yellow text-xs">
            {player.brawler.name.slice(0, 2)}
          </span>
        }
      />
      <div className="min-w-0 flex-1">
        <div className="display text-sm truncate">{player.name}</div>
        <div className="text-text-dim text-[10px] truncate">
          {displayTag(player.tag)}
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="display text-xs text-brand-yellow">
          {player.brawler.name}
        </div>
        <div className="text-text-dim text-[10px]">
          P{player.brawler.power} · {player.brawler.trophies}🏆
        </div>
      </div>
    </div>
  );
}
