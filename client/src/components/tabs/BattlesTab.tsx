import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAccumulatedBattles } from "../../hooks/useAccumulatedBattles";
import type { BattleLogItem, BattlePlayer } from "../../types/brawlstars";
import { Img } from "../ui/Img";
import { CdnIcon } from "../ui/CdnIcon";
import { Skeleton } from "../ui/Skeleton";
import { EmptyState } from "../ui/EmptyState";
import { cn } from "../../utils/cn";
import { cdn } from "../../utils/cdn";
import { fmtDuration, fmtMode, fmtNum, relativeTime } from "../../utils/format";
import { accentHex } from "../ui/accent";
import { groupSessions, myBrawler, outcomeOf } from "../../utils/sessions";
import {
  IconController,
  IconClock,
  IconFilter,
  IconLayers,
  IconList,
  IconStar,
  IconTrophy,
} from "../ui/icons";


function resolveResult(item: BattleLogItem) {
  const r = item.battle.result;
  if (r === "victory") return { label: "Victoire", color: accentHex.success };
  if (r === "defeat") return { label: "Défaite", color: accentHex.danger };
  if (r === "draw") return { label: "Nul", color: accentHex.neutral };
  if (typeof item.battle.rank === "number")
    return {
      label: `Rang ${item.battle.rank}`,
      color: item.battle.rank <= 4 ? accentHex.success : accentHex.danger,
    };
  return { label: "—", color: accentHex.neutral };
}

/** "YYYYMMDDTHHMMSS.000Z" → ISO. */
function toIso(bt: string): string {
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/.exec(bt);
  if (!m) return bt;
  const [, y, mo, d, h, mi, s] = m;
  return `${y}-${mo}-${d}T${h}:${mi}:${s}Z`;
}

type ResultFilter = "all" | "victory" | "defeat";
type ViewMode = "list" | "sessions";

export function BattlesTab({ tag }: { tag: string }) {
  const navigate = useNavigate();
  const acc = useAccumulatedBattles(tag);
  const myTag = `#${tag}`;

  const [result, setResult] = useState<ResultFilter>("all");
  const [mode, setMode] = useState<string>("all");
  const [brawler, setBrawler] = useState<string>("all");
  const [view, setView] = useState<ViewMode>("list");

  // Modes & brawlers présents dans l'archive (pour peupler les sélecteurs).
  const { modes, brawlers } = useMemo(() => {
    const modeSet = new Map<string, string>();
    const brawlerSet = new Map<string, string>();
    for (const it of acc.items) {
      const m = it.event.mode || it.battle.mode;
      if (m) modeSet.set(m, m);
      const mb = myBrawler(it, myTag);
      if (mb) brawlerSet.set(String(mb.id), mb.name);
    }
    return {
      modes: [...modeSet.keys()].sort((a, b) => a.localeCompare(b)),
      brawlers: [...brawlerSet.entries()].sort((a, b) =>
        a[1].localeCompare(b[1]),
      ),
    };
  }, [acc.items, myTag]);

  const filtered = useMemo(() => {
    return acc.items.filter((it) => {
      if (result !== "all" && outcomeOf(it) !== result) return false;
      if (mode !== "all" && (it.event.mode || it.battle.mode) !== mode)
        return false;
      if (brawler !== "all") {
        const mb = myBrawler(it, myTag);
        if (!mb || String(mb.id) !== brawler) return false;
      }
      return true;
    });
  }, [acc.items, result, mode, brawler, myTag]);

  const sessions = useMemo(
    () => (view === "sessions" ? groupSessions(filtered) : []),
    [view, filtered],
  );

  if (acc.isLoading) {
    return (
      <div className="grid gap-3 lg:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-40" />
        ))}
      </div>
    );
  }

  if (acc.items.length === 0) {
    return (
      <EmptyState
        icon={<IconController size={26} />}
        title="Aucun combat récent"
        message="Reviens après quelques parties — l'historique se construit à chaque visite, et la capture en arrière-plan l'enrichit même hors connexion."
      />
    );
  }

  const hasFilters = result !== "all" || mode !== "all" || brawler !== "all";

  return (
    <div className="space-y-3">
      {/* Barre de filtres + bascule de vue */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-xl border border-line bg-surface-2 p-0.5">
          {(["all", "victory", "defeat"] as ResultFilter[]).map((r) => (
            <button
              key={r}
              onClick={() => setResult(r)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-[12px] font-bold transition-colors",
                result === r
                  ? r === "victory"
                    ? "bg-success/15 text-success"
                    : r === "defeat"
                      ? "bg-danger/15 text-danger"
                      : "bg-gold/15 text-gold"
                  : "text-dim hover:text-text-2",
              )}
            >
              {r === "all" ? "Tous" : r === "victory" ? "Victoires" : "Défaites"}
            </button>
          ))}
        </div>

        <Select
          value={mode}
          onChange={setMode}
          label="Mode"
          options={[
            { value: "all", label: "Tous les modes" },
            ...modes.map((m) => ({ value: m, label: fmtMode(m) })),
          ]}
        />
        {brawlers.length > 1 && (
          <Select
            value={brawler}
            onChange={setBrawler}
            label="Brawler"
            options={[
              { value: "all", label: "Tous les brawlers" },
              ...brawlers.map(([id, name]) => ({ value: id, label: name })),
            ]}
          />
        )}

        <div className="ml-auto flex rounded-xl border border-line bg-surface-2 p-0.5">
          <ViewButton
            active={view === "list"}
            onClick={() => setView("list")}
            icon={<IconList size={15} />}
            label="Liste"
          />
          <ViewButton
            active={view === "sessions"}
            onClick={() => setView("sessions")}
            icon={<IconLayers size={15} />}
            label="Sessions"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 text-[12px]">
        <span className="font-bold text-text">
          {filtered.length} combat{filtered.length > 1 ? "s" : ""}
        </span>
        <span className="text-dim">
          {hasFilters
            ? `· filtrés sur ${acc.items.length}`
            : `· ${acc.freshCount} récents + ${acc.storedCount} archivés (25 max/API)`}
        </span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<IconFilter size={24} />}
          title="Aucun combat pour ce filtre"
          message="Élargis les critères pour voir plus de parties."
          className="py-10"
        />
      ) : view === "sessions" ? (
        <div className="space-y-5">
          {sessions.map((s, si) => (
            <div key={`${s.end}-${si}`} className="space-y-3">
              <SessionHeader session={s} />
              <div className="grid gap-3 lg:grid-cols-2">
                {s.items.map((item, i) => (
                  <BattleCard
                    key={`${item.battleTime}-${i}`}
                    item={item}
                    myTag={myTag}
                    onOpenPlayer={(t) =>
                      navigate(`/player/${t.replace(/^#/, "")}`)
                    }
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {filtered.map((item, i) => (
            <BattleCard
              key={`${item.battleTime}-${i}`}
              item={item}
              myTag={myTag}
              onOpenPlayer={(t) => navigate(`/player/${t.replace(/^#/, "")}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ViewButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-bold transition-colors",
        active ? "bg-gold/15 text-gold" : "text-dim hover:text-text-2",
      )}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function Select({
  value,
  onChange,
  label,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="cursor-pointer appearance-none rounded-xl border border-line bg-surface-2 py-1.5 pl-3 pr-8 text-[12px] font-semibold text-text outline-none hover:border-line-strong"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-surface text-text">
            {o.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-2.5 text-dim">▾</span>
    </label>
  );
}

const sessionOutcomeColor = (delta: number) =>
  delta > 0 ? accentHex.success : delta < 0 ? accentHex.danger : accentHex.neutral;

function SessionHeader({
  session,
}: {
  session: ReturnType<typeof groupSessions>[number];
}) {
  const day = new Date(toIso(session.end)).toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
  const total = session.wins + session.losses + session.draws;
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-surface-2/60 px-3.5 py-2.5">
      <div
        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg"
        style={{ background: `${sessionOutcomeColor(session.trophyDelta)}22` }}
      >
        <IconLayers size={16} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-bold capitalize text-text">{day}</div>
        <div className="text-[11px] text-dim">
          {total} combat{total > 1 ? "s" : ""} ·{" "}
          {relativeTime(toIso(session.start))}
          {session.playedSec > 0 && ` · ${fmtDuration(session.playedSec)}`}
        </div>
      </div>
      <div className="flex items-center gap-2 text-[12px] font-bold">
        <span className="text-success">{session.wins}V</span>
        <span className="text-danger">{session.losses}D</span>
        {session.trophyDelta !== 0 && (
          <span
            className="display"
            style={{ color: sessionOutcomeColor(session.trophyDelta) }}
          >
            {session.trophyDelta > 0 ? "+" : ""}
            {fmtNum(session.trophyDelta)}
          </span>
        )}
      </div>
    </div>
  );
}

function BattleCard({
  item,
  myTag,
  onOpenPlayer,
}: {
  item: BattleLogItem;
  myTag: string;
  onOpenPlayer: (tag: string) => void;
}) {
  const res = resolveResult(item);
  const delta = item.battle.trophyChange;
  const mode = item.event.mode || item.battle.mode;
  const isFriendly = item.battle.type === "friendly";
  const star = item.battle.starPlayer?.tag ?? null;
  const mapImg = item.event.id > 0 ? cdn.map(item.event.id) : null;
  // Icône de mode seule (l'image de la map est affichée à côté).
  const modeSrcs =
    typeof item.event.modeId === "number"
      ? [cdn.gameMode(48000000 + item.event.modeId)]
      : [];

  const teams = item.battle.teams;
  const isVs = !!teams && teams.length === 2;
  let mine: BattlePlayer[] = [];
  let other: BattlePlayer[] = [];
  let solo: BattlePlayer[] = [];
  if (isVs) {
    mine = teams!.find((t) => t.some((p) => p.tag === myTag)) ?? teams![0]!;
    other = teams!.find((t) => t !== mine) ?? teams![1]!;
  } else if (teams && teams.length > 2) {
    solo = teams.flat();
  } else {
    solo = item.battle.players ?? [];
  }

  return (
    <div
      className="overflow-hidden rounded-2xl border border-line bg-surface"
      style={{ borderLeft: `3px solid ${res.color}` }}
    >
      {/* En-tête : icône de mode + vignette de map côte à côte */}
      <div className="flex items-center gap-2.5 p-3">
        <CdnIcon
          srcs={modeSrcs}
          alt={mode}
          wrapperClassName="h-11 w-11 shrink-0 rounded-lg border border-line bg-surface-2"
          fallback={<span className="text-text-2"><IconController size={18} /></span>}
        />
        {mapImg && (
          <div className="h-11 w-16 shrink-0 overflow-hidden rounded-lg border border-line bg-surface-2">
            <CdnIcon
              srcs={[mapImg]}
              alt={item.event.map}
              fit="cover"
              wrapperClassName="h-full w-full"
              fallback={<span className="text-[9px] text-dim">map</span>}
            />
          </div>
        )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-bold text-text">
                {fmtMode(mode)}
              </span>
              {isFriendly && (
                <span className="shrink-0 rounded bg-violet/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-violet">
                  Amical
                </span>
              )}
              {typeof item.battle.duration === "number" && (
                <span className="shrink-0 rounded bg-white/8 px-1.5 py-0.5 font-mono text-[10px] text-text-2">
                  <IconClock size={11} className="inline align-[-1px]" /> {fmtDuration(item.battle.duration)}
                </span>
              )}
            </div>
            <div className="truncate text-[11px] text-dim">
              {item.event.map || (isFriendly ? "Match amical" : "Événement spécial")}{" "}
              · {relativeTime(toIso(item.battleTime))}
            </div>
          </div>
          <div className="text-right">
            <div
              className="text-[12px] font-extrabold uppercase"
              style={{ color: res.color }}
            >
              {res.label}
            </div>
            {typeof delta === "number" && delta !== 0 && (
              <div
                className="display text-[13px]"
                style={{ color: delta > 0 ? accentHex.success : accentHex.danger }}
              >
                {delta > 0 ? "+" : ""}
                {delta}
              </div>
            )}
          </div>
        </div>

      {/* Corps : VS (3v3) ou grille (showdown) */}
      <div className="p-3 pt-2">
        {isVs ? (
          <div className="flex items-start justify-center gap-2 overflow-x-auto no-scrollbar py-1 sm:gap-4">
            <Team players={mine} myTag={myTag} star={star} onOpen={onOpenPlayer} />
            <div className="display px-1 pt-4 text-sm text-dim">VS</div>
            <Team players={other} myTag={myTag} star={star} onOpen={onOpenPlayer} />
          </div>
        ) : (
          <div className="grid grid-cols-5 gap-x-3 gap-y-4 py-1">
            {solo.map((p, j) => (
              <PlayerCell
                key={`${p.tag}-${j}`}
                p={p}
                mine={p.tag === myTag}
                star={p.tag === star}
                onOpen={onOpenPlayer}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Team({
  players,
  myTag,
  star,
  onOpen,
}: {
  players: BattlePlayer[];
  myTag: string;
  star: string | null;
  onOpen: (tag: string) => void;
}) {
  return (
    <div className="flex gap-1.5 sm:gap-2.5">
      {players.map((p, j) => (
        <PlayerCell
          key={`${p.tag}-${j}`}
          p={p}
          mine={p.tag === myTag}
          star={p.tag === star}
          onOpen={onOpen}
        />
      ))}
    </div>
  );
}

function PlayerCell({
  p,
  mine,
  star,
  onOpen,
}: {
  p: BattlePlayer;
  mine: boolean;
  star: boolean;
  onOpen: (tag: string) => void;
}) {
  return (
    <button
      onClick={() => onOpen(p.tag)}
      title={`${p.name} · ${p.brawler.name}`}
      className="flex w-11 shrink-0 flex-col items-center gap-1.5 sm:w-14"
    >
      <div
        className={cn(
          "relative h-11 w-11 rounded-xl border bg-surface-2 sm:h-14 sm:w-14 sm:rounded-2xl",
          mine ? "border-gold/70 ring-1 ring-gold/40" : "border-line",
        )}
      >
        <Img
          src={cdn.brawlerBorderless(p.brawler.id)}
          alt={p.brawler.name}
          fit="contain"
          wrapperClassName="absolute inset-1.5 rounded-lg"
          fallback={
            <span className="display text-[10px] text-gold">
              {p.brawler.name.slice(0, 2)}
            </span>
          }
        />
        {star && (
          <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-gold text-app shadow">
            <IconStar size={10} filled />
          </span>
        )}
      </div>
      <span
        className={cn(
          "w-full truncate text-center text-[10px] font-semibold",
          mine ? "text-gold" : "text-text-2",
        )}
      >
        {p.name}
      </span>
      {p.brawler.trophies >= 0 ? (
        <span className="display inline-flex items-center gap-0.5 text-[10px] text-gold">
          <IconTrophy size={10} />{fmtNum(p.brawler.trophies)}
        </span>
      ) : p.brawler.power >= 0 ? (
        <span className="display text-[10px] text-text-2">P{p.brawler.power}</span>
      ) : (
        <span className="h-[13px]" />
      )}
    </button>
  );
}
