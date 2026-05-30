import { useMemo, useState } from "react";
import { useAccumulatedBattles } from "../../hooks/useAccumulatedBattles";
import type {
  BattleLogItem,
  BattlePlayer,
  BattleResult,
} from "../../types/brawlstars";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { ErrorState } from "../ui/ErrorState";
import { Skeleton } from "../ui/Skeleton";
import { Img } from "../ui/Img";
import { fmtBattleTime, fmtDuration, fmtMode, fmtPercent } from "../../utils/format";
import { cdn } from "../../utils/cdn";
import { BattleDetailModal } from "../player/BattleDetailModal";
import { cn } from "../../utils/cn";

const PAGE_SIZE = 12;

export function BattlesTab({ tag }: { tag: string }) {
  const playerTag = `#${tag}`;
  const data = useAccumulatedBattles(tag);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<BattleLogItem | null>(null);
  const [resultFilter, setResultFilter] = useState<BattleResult | "all">("all");

  const filtered = useMemo(
    () =>
      resultFilter === "all"
        ? data.items
        : data.items.filter((b) => b.battle.result === resultFilter),
    [data.items, resultFilter],
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const slice = filtered.slice(
    safePage * PAGE_SIZE,
    safePage * PAGE_SIZE + PAGE_SIZE,
  );

  if (data.isLoading)
    return (
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square w-full" rounded="rounded-2xl" />
        ))}
      </div>
    );

  if (data.isError && data.items.length === 0)
    return (
      <div className="mt-4">
        <ErrorState error={data.error} onRetry={() => void data.refetch()} />
      </div>
    );

  if (data.items.length === 0)
    return (
      <Card padding="lg" className="text-center text-text-muted mt-4">
        Aucune bataille récente. Lance une partie en jeu et reviens !
      </Card>
    );

  const wr = data.analytics?.winRate ?? 0;
  const counted = data.analytics?.countedBattles ?? 0;

  return (
    <div className="mt-4 space-y-4">
      {/* Header summary + filters */}
      <Card padding="md" className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-3 mr-auto">
          <div>
            <div className="display text-3xl text-gradient-y leading-none">
              {fmtPercent(wr, 1)}
            </div>
            <div className="text-text-dim text-xs">
              win rate · {counted} matchs
            </div>
          </div>
          <div className="hidden md:block w-px h-10 bg-white/10" />
          <div className="hidden md:block">
            <div className="text-text-dim text-[10px] uppercase tracking-wider">
              Historique
            </div>
            <div className="text-sm">
              <span className="font-bold text-text-base">
                {data.items.length}
              </span>
              <span className="text-text-muted"> matchs</span>
              {data.storedCount > 0 && (
                <span className="text-text-dim text-xs ml-2">
                  ({data.freshCount} récents + {data.storedCount} archivés)
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {(["all", "victory", "defeat", "draw"] as const).map((r) => (
            <button
              key={r}
              onClick={() => {
                setResultFilter(r);
                setPage(0);
              }}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors",
                resultFilter === r
                  ? r === "victory"
                    ? "bg-success text-bg-base"
                    : r === "defeat"
                      ? "bg-danger text-bg-base"
                      : r === "draw"
                        ? "bg-warning text-bg-base"
                        : "bg-brand-yellow text-bg-base"
                  : "bg-white/5 text-text-muted hover:text-text-base",
              )}
            >
              {r === "all"
                ? "Tous"
                : r === "victory"
                  ? "V"
                  : r === "defeat"
                    ? "D"
                    : "N"}
            </button>
          ))}
          {data.items.length > 25 && (
            <button
              onClick={() => {
                if (
                  confirm(
                    "Effacer l'historique local des batailles pour ce joueur ?",
                  )
                ) {
                  data.clearHistory();
                  setPage(0);
                }
              }}
              className="ml-2 text-xs text-text-dim hover:text-danger"
              title="Vider l'historique local"
            >
              vider
            </button>
          )}
        </div>
      </Card>

      {filtered.length === 0 ? (
        <Card padding="lg" className="text-center text-text-muted">
          Aucune bataille ne correspond à ce filtre.
        </Card>
      ) : (
        <>
          {/* Square card grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {slice.map((item, i) => (
              <BattleCard
                key={`${item.battleTime}-${i}`}
                item={item}
                playerTag={playerTag}
                onClick={() => setSelected(item)}
              />
            ))}
          </div>

          {/* Pagination */}
          {pageCount > 1 && (
            <Pagination
              page={safePage}
              pageCount={pageCount}
              onChange={setPage}
            />
          )}
        </>
      )}

      {selected && (
        <BattleDetailModal
          item={selected}
          playerTag={playerTag}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

// ------------------------------------------------------------------
// Square card
// ------------------------------------------------------------------

function findOwn(item: BattleLogItem, tag: string): BattlePlayer | null {
  for (const t of item.battle.teams ?? []) {
    const f = t.find((p) => p.tag === tag);
    if (f) return f;
  }
  return item.battle.players?.find((p) => p.tag === tag) ?? null;
}

function tone(r?: BattleResult, rank?: number) {
  if (r === "victory") return "success";
  if (r === "defeat") return "danger";
  if (r === "draw") return "warning";
  if (rank !== undefined) {
    if (rank <= 4) return "success";
    if (rank <= 6) return "warning";
    return "danger";
  }
  return "neutral";
}

function label(r?: BattleResult, rank?: number) {
  if (r === "victory") return "VICTOIRE";
  if (r === "defeat") return "DÉFAITE";
  if (r === "draw") return "NUL";
  if (rank !== undefined) return `RANG ${rank}`;
  return "—";
}

function BattleCard({
  item,
  playerTag,
  onClick,
}: {
  item: BattleLogItem;
  playerTag: string;
  onClick: () => void;
}) {
  const own = findOwn(item, playerTag);
  const t = tone(item.battle.result, item.battle.rank);
  const lbl = label(item.battle.result, item.battle.rank);
  const change = item.battle.trophyChange;
  const isStar = item.battle.starPlayer?.tag === playerTag;

  const accentBg = {
    success: "from-success/15 to-success/0",
    danger: "from-danger/15 to-danger/0",
    warning: "from-warning/15 to-warning/0",
    neutral: "from-white/5 to-transparent",
  }[t];

  const ribbonBg = {
    success: "bg-success",
    danger: "bg-danger",
    warning: "bg-warning",
    neutral: "bg-white/15",
  }[t];

  return (
    <button
      onClick={onClick}
      className="group relative text-left surface rounded-2xl overflow-hidden focus:outline-none focus:ring-2 focus:ring-brand-yellow/60 transition-transform hover:-translate-y-0.5"
    >
      {/* Side ribbon */}
      <span
        aria-hidden
        className={cn(
          "absolute top-0 left-0 bottom-0 w-1.5",
          ribbonBg,
        )}
      />

      {/* Subtle accent backdrop */}
      <div
        aria-hidden
        className={cn(
          "absolute inset-0 bg-gradient-to-br pointer-events-none",
          accentBg,
        )}
      />

      <div className="relative p-3 md:p-4 flex flex-col gap-3 h-full">
        {/* Row 1: result + star */}
        <div className="flex items-center justify-between gap-2">
          <Badge tone={t as never}>{lbl}</Badge>
          {isStar && (
            <Badge tone="yellow" className="!px-1.5 !py-0.5 text-[9px]">
              ★ STAR
            </Badge>
          )}
        </div>

        {/* Row 2: brawler portrait + mode/map */}
        <div className="flex items-center gap-3 min-w-0">
          {own ? (
            <Img
              src={cdn.brawlerBorderless(own.brawler.id)}
              alt={own.brawler.name}
              wrapperClassName="shrink-0 w-14 h-14 rounded-xl bg-bg-base/40 ring-1 ring-white/10"
              fallback={
                <span className="display text-brand-yellow text-sm">
                  {own.brawler.name.slice(0, 2)}
                </span>
              }
            />
          ) : (
            <div className="shrink-0 w-14 h-14 rounded-xl bg-bg-base/40 ring-1 ring-white/10 grid place-items-center text-text-dim text-xs">
              ?
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="display text-base truncate">
              {own?.brawler.name ?? "—"}
            </div>
            <div className="text-text-muted text-xs truncate">
              {fmtMode(item.event.mode || item.battle.mode)}
            </div>
            <div className="text-text-dim text-[10px] truncate">
              {item.event.map || "Map inconnue"}
            </div>
          </div>
        </div>

        {/* Row 3: bottom stats grid */}
        <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-white/5">
          <Cell
            label="Trophées"
            value={
              change !== undefined && change !== 0
                ? change > 0
                  ? `+${change}`
                  : `${change}`
                : "—"
            }
            valueClass={
              change && change > 0
                ? "text-success"
                : change && change < 0
                  ? "text-danger"
                  : ""
            }
          />
          <Cell
            label="Durée"
            value={fmtDuration(item.battle.duration ?? null)}
          />
          <Cell label="Quand" value={fmtBattleTime(item.battleTime)} small />
        </div>

        {/* Hover hint */}
        <div className="absolute bottom-2 right-3 text-[10px] uppercase tracking-wider text-text-dim opacity-0 group-hover:opacity-100 transition-opacity">
          Détails →
        </div>
      </div>
    </button>
  );
}

function Cell({
  label,
  value,
  valueClass,
  small,
}: {
  label: string;
  value: string;
  valueClass?: string;
  small?: boolean;
}) {
  return (
    <div className="bg-white/3 rounded-md py-1.5 px-2 text-center">
      <div className="text-[9px] uppercase tracking-wider text-text-dim">
        {label}
      </div>
      <div
        className={cn(
          "display",
          small ? "text-[11px] mt-0.5 truncate" : "text-sm mt-0.5",
          valueClass,
        )}
      >
        {value}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// Pagination
// ------------------------------------------------------------------

function Pagination({
  page,
  pageCount,
  onChange,
}: {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
}) {
  // Compute a compact set of visible page numbers around the current page.
  const visible = pageNumbers(page, pageCount);

  return (
    <div className="flex items-center justify-center gap-1.5 pt-2">
      <NavBtn
        disabled={page === 0}
        onClick={() => onChange(Math.max(0, page - 1))}
      >
        ←
      </NavBtn>
      {visible.map((p, i) =>
        p === -1 ? (
          <span
            key={`gap-${i}`}
            className="px-1.5 text-text-dim text-sm select-none"
          >
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={cn(
              "min-w-9 h-9 px-3 rounded-lg text-sm font-bold transition-colors",
              p === page
                ? "bg-brand-yellow text-bg-base"
                : "bg-white/5 text-text-muted hover:text-text-base",
            )}
          >
            {p + 1}
          </button>
        ),
      )}
      <NavBtn
        disabled={page >= pageCount - 1}
        onClick={() => onChange(Math.min(pageCount - 1, page + 1))}
      >
        →
      </NavBtn>
    </div>
  );
}

function NavBtn({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="min-w-9 h-9 px-3 rounded-lg bg-white/5 text-text-base font-bold hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  );
}

/** Build pagination model: first, current ± 1, last, with -1 for ellipsis. */
function pageNumbers(page: number, count: number): number[] {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i);
  const set = new Set<number>([0, count - 1, page - 1, page, page + 1]);
  const arr = [...set].filter((n) => n >= 0 && n < count).sort((a, b) => a - b);
  const out: number[] = [];
  for (let i = 0; i < arr.length; i += 1) {
    if (i > 0 && arr[i]! - arr[i - 1]! > 1) out.push(-1);
    out.push(arr[i]!);
  }
  return out;
}
