import { useMemo, useState } from "react";
import type { Player } from "../../types/brawlstars";
import { Img } from "../ui/Img";
import { cdn } from "../../utils/cdn";
import { cn } from "../../utils/cn";
import { fmtNum } from "../../utils/format";
import { prettyBrawlerName } from "../../utils/brawlerName";
import { IconTrophy, IconBolt, IconMedal, type IconProps } from "../ui/icons";

type SortKey = "trophies" | "power" | "rank" | "name";

const SORTS: { key: SortKey; label: string; Icon?: (p: IconProps) => React.ReactNode }[] = [
  { key: "trophies", label: "Trophées", Icon: IconTrophy },
  { key: "power", label: "Power", Icon: IconBolt },
  { key: "rank", label: "Rank", Icon: IconMedal },
  { key: "name", label: "A-Z" },
];

export function BrawlersTab({
  player,
  onOpenBrawler,
}: {
  player: Player;
  onOpenBrawler: (id: number) => void;
}) {
  const [sort, setSort] = useState<SortKey>("trophies");

  const brawlers = useMemo(() => {
    const list = [...player.brawlers];
    list.sort((a, b) => {
      switch (sort) {
        case "power":
          return b.power - a.power || b.trophies - a.trophies;
        case "rank":
          return b.rank - a.rank || b.trophies - a.trophies;
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return b.trophies - a.trophies;
      }
    });
    return list;
  }, [player.brawlers, sort]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {SORTS.map((s) => (
            <button
              key={s.key}
              onClick={() => setSort(s.key)}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[12px] font-semibold transition-colors",
                sort === s.key
                  ? "border-gold/40 bg-gold/12 text-gold"
                  : "border-line bg-surface text-text-2 hover:text-text",
              )}
            >
              {s.Icon && <s.Icon size={13} />}
              {s.label}
            </button>
          ))}
        </div>
        <span className="hidden shrink-0 text-[12px] text-dim sm:block">
          {player.brawlers.length} brawlers
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
        {brawlers.map((b) => (
          <button
            key={b.id}
            onClick={() => onOpenBrawler(b.id)}
            className="relative flex flex-col items-center gap-1.5 rounded-2xl border border-line bg-surface p-2.5 card-hover"
          >
            <span className="absolute right-2 top-2 rounded-md bg-black/40 px-1.5 py-0.5 font-mono text-[9px] font-bold text-gold">
              P{b.power}
            </span>
            <Img
              src={cdn.brawlerBorderless(b.id)}
              alt={b.name}
              wrapperClassName="h-14 w-14"
              fallback={
                <span className="display text-xs text-gold">
                  {b.name.slice(0, 2)}
                </span>
              }
            />
            <div className="w-full truncate text-center text-[11px] font-bold text-text">
              {prettyBrawlerName(b.name)}
            </div>
            <div className="display inline-flex items-center gap-0.5 text-[13px] text-gold">
              <IconTrophy size={12} />{fmtNum(b.trophies)}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
