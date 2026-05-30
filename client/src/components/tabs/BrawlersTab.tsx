import { useMemo, useState } from "react";
import type { Player, PlayerBrawler } from "../../types/brawlstars";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Img } from "../ui/Img";
import { fmtNum } from "../../utils/format";
import { cn } from "../../utils/cn";
import { cdn } from "../../utils/cdn";
import { BrawlerDetailModal } from "../player/BrawlerDetailModal";

type SortKey = "trophies" | "highestTrophies" | "rank" | "power" | "name";

const SORT_OPTIONS: Array<{ id: SortKey; label: string }> = [
  { id: "trophies", label: "Trophées" },
  { id: "highestTrophies", label: "Record" },
  { id: "rank", label: "Rang" },
  { id: "power", label: "Power" },
  { id: "name", label: "Nom" },
];

export function BrawlersTab({ player }: { player: Player }) {
  const [sort, setSort] = useState<SortKey>("trophies");
  const [filter, setFilter] = useState("");
  const [onlyMaxed, setOnlyMaxed] = useState(false);
  const [selected, setSelected] = useState<PlayerBrawler | null>(null);

  const visible = useMemo(() => {
    const q = filter.trim().toUpperCase();
    return [...player.brawlers]
      .filter((b) => (q === "" ? true : b.name.includes(q)))
      .filter((b) => (onlyMaxed ? b.power >= 11 : true))
      .sort((a, b) => {
        if (sort === "name") return a.name.localeCompare(b.name);
        return Number(b[sort]) - Number(a[sort]);
      });
  }, [player.brawlers, filter, sort, onlyMaxed]);

  return (
    <div className="mt-4 space-y-4">
      <Card padding="sm" className="flex flex-wrap items-center gap-2">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Rechercher un brawler"
          className="flex-1 min-w-0 bg-white/5 rounded-full px-4 py-2 text-sm outline-none border border-white/10 focus:border-brand-yellow/40 placeholder:text-text-dim"
        />
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setSort(opt.id)}
              className={cn(
                "shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors",
                sort === opt.id
                  ? "bg-brand-yellow text-bg-base"
                  : "bg-white/5 text-text-muted hover:text-text-base",
              )}
            >
              {opt.label}
            </button>
          ))}
          <button
            onClick={() => setOnlyMaxed((v) => !v)}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors",
              onlyMaxed
                ? "bg-brand-magenta text-bg-base"
                : "bg-white/5 text-text-muted hover:text-text-base",
            )}
          >
            P11 seulement
          </button>
        </div>
      </Card>

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visible.map((b) => (
          <BrawlerCard
            key={b.id}
            brawler={b}
            onClick={() => setSelected(b)}
          />
        ))}
      </div>

      {visible.length === 0 && (
        <Card padding="lg" className="text-center text-text-muted">
          Aucun brawler ne correspond.
        </Card>
      )}

      {selected && (
        <BrawlerDetailModal
          brawler={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function BrawlerCard({
  brawler: b,
  onClick,
}: {
  brawler: PlayerBrawler;
  onClick: () => void;
}) {
  const slots = b.starPowers.length + b.gadgets.length + b.gears.length;
  const isMaxed = b.power >= 11;
  const isFullyRanked = b.rank >= 35;
  // Number of extra kit items (gears) not shown as icons — surfaced as "+N".
  const extras = b.gears.length;

  return (
    <button
      onClick={onClick}
      className="group text-left surface rounded-2xl p-3 md:p-4 focus:outline-none focus:ring-2 focus:ring-brand-yellow/60 transition-transform hover:-translate-y-0.5 flex flex-col gap-3"
    >
      <div className="flex items-center gap-3">
        {/* Brawlify "border" PNG already has its own rounded shape baked in,
            so we render it on a transparent wrapper to avoid the dark square
            leaking through the PNG's transparent corners. */}
        <Img
          src={cdn.brawlerBorder(b.id)}
          alt={b.name}
          wrapperClassName="shrink-0 w-14 h-14"
          fallback={
            <span className="display text-brand-yellow text-sm">
              {b.name.slice(0, 2)}
            </span>
          }
        />
        <div className="min-w-0 flex-1">
          <div className="display text-base truncate">{b.name}</div>
          <div className="text-text-dim text-xs">#{b.id}</div>
        </div>
        <div className="text-right shrink-0">
          <div className="display text-xl text-brand-yellow leading-none">
            {fmtNum(b.trophies)}
          </div>
          <div className="text-text-dim text-[10px]">
            max {fmtNum(b.highestTrophies)}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Badge tone={isMaxed ? "yellow" : "neutral"}>P{b.power}</Badge>
        <Badge tone={isFullyRanked ? "magenta" : "neutral"}>R{b.rank}</Badge>
        <Badge tone="cyan">{b.starPowers.length}/2 SP</Badge>
        <Badge tone="cyan">{b.gadgets.length}/3 GA</Badge>
      </div>

      {/* Kit row: star powers + gadgets shown as icons, gears as compact "+N" indicator */}
      <div className="flex items-center gap-1.5 pt-2 border-t border-white/5 min-h-[28px]">
        {b.starPowers.map((sp) => (
          <Img
            key={`sp-${sp.id}`}
            src={cdn.starPower(sp.id)}
            alt={sp.name}
            title={`★ ${sp.name}`}
            wrapperClassName="w-7 h-7 rounded-md bg-brand-yellow/10 ring-1 ring-brand-yellow/30 p-0.5"
          />
        ))}
        {b.gadgets.map((g) => (
          <Img
            key={`ga-${g.id}`}
            src={cdn.gadget(g.id)}
            alt={g.name}
            title={`⚡ ${g.name}`}
            wrapperClassName="w-7 h-7 rounded-md bg-brand-cyan/10 ring-1 ring-brand-cyan/30 p-0.5"
          />
        ))}
        {extras > 0 && (
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-brand-violet/15 ring-1 ring-brand-violet/30 text-brand-violet text-[10px] font-bold px-2 py-0.5">
            +{extras}
            <span aria-hidden>⚙</span>
          </span>
        )}
        {b.starPowers.length === 0 && b.gadgets.length === 0 && extras === 0 && (
          <span className="text-text-dim text-[10px] italic">
            Aucun équipement
          </span>
        )}
        <span
          aria-hidden
          className="ml-auto text-[10px] uppercase tracking-wider text-text-dim opacity-0 group-hover:opacity-100 transition-opacity"
        >
          Détails →
        </span>
      </div>

      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-brand-yellow to-brand-magenta rounded-full"
          style={{ width: `${(slots / 8) * 100}%` }}
        />
      </div>
    </button>
  );
}
