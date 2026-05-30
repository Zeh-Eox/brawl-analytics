import { useEffect } from "react";
import { motion } from "framer-motion";
import type { PlayerBrawler } from "../../types/brawlstars";
import { Badge } from "../ui/Badge";
import { Img } from "../ui/Img";
import { cdn } from "../../utils/cdn";
import { fmtNum, fmtPercent } from "../../utils/format";

interface Props {
  brawler: PlayerBrawler;
  onClose: () => void;
}

const MAX_RANK = 35;
const MAX_POWER = 11;

export function BrawlerDetailModal({ brawler: b, onClose }: Props) {
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

  const slots = b.starPowers.length + b.gadgets.length + b.gears.length;
  const kitCompletion = slots / 8;
  const isMaxed = b.power >= MAX_POWER;
  const isFullyRanked = b.rank >= MAX_RANK;
  const trophyProgress = Math.min(1, b.trophies / Math.max(1, b.highestTrophies));

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
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto surface-elevated rounded-2xl"
      >
        {/* Hero — big portrait + name */}
        <div className="relative p-5 md:p-7 border-b border-white/5">
          <div
            aria-hidden
            className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-brand-yellow/20 blur-3xl"
          />
          <div
            aria-hidden
            className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-brand-magenta/20 blur-3xl"
          />
          <div className="relative flex items-center gap-4 md:gap-5">
            <div className="shrink-0 w-24 h-24 md:w-28 md:h-28">
              <Img
                src={cdn.brawlerBorder(b.id)}
                alt={b.name}
                wrapperClassName="w-full h-full"
                fallback={
                  <span className="display text-brand-yellow text-3xl">
                    {b.name.slice(0, 2)}
                  </span>
                }
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                {isMaxed && <Badge tone="yellow">P11 ★</Badge>}
                {isFullyRanked && <Badge tone="magenta">R35 ★</Badge>}
                <Badge tone="neutral">#{b.id}</Badge>
              </div>
              <h2 className="display text-3xl md:text-4xl truncate">{b.name}</h2>
              <div className="text-text-muted text-sm mt-1">
                {slots}/8 slots débloqués · {fmtPercent(kitCompletion, 0)} complet
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Fermer"
              className="absolute top-0 right-0 w-9 h-9 grid place-items-center rounded-full bg-white/5 hover:bg-white/10 text-text-muted hover:text-text-base"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-5 md:p-6">
          <BigStat label="Trophées" value={fmtNum(b.trophies)} accent="yellow" />
          <BigStat
            label="Record"
            value={fmtNum(b.highestTrophies)}
            accent="magenta"
          />
          <BigStat label="Power" value={`P${b.power}`} accent="cyan" />
          <BigStat label="Rang" value={`R${b.rank}`} accent="violet" />
        </div>

        {/* Trophy bar */}
        <div className="px-5 md:px-6 pb-4">
          <div className="flex justify-between items-baseline mb-1.5">
            <span className="text-text-muted text-sm">
              Progression vs record
            </span>
            <span className="font-mono text-text-base text-sm">
              {fmtPercent(trophyProgress, 1)}
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-yellow to-brand-magenta transition-all"
              style={{ width: `${trophyProgress * 100}%` }}
            />
          </div>
        </div>

        {/* Kit sections */}
        <div className="px-5 md:px-6 pb-6 space-y-4">
          <KitSection
            title="Star Powers"
            count={b.starPowers.length}
            max={2}
            accent="yellow"
          >
            {b.starPowers.length === 0 ? (
              <Empty label="Aucun star power débloqué." />
            ) : (
              b.starPowers.map((sp) => (
                <KitItem
                  key={sp.id}
                  src={cdn.starPower(sp.id)}
                  name={sp.name}
                  accent="yellow"
                />
              ))
            )}
          </KitSection>

          <KitSection
            title="Gadgets"
            count={b.gadgets.length}
            max={3}
            accent="cyan"
          >
            {b.gadgets.length === 0 ? (
              <Empty label="Aucun gadget débloqué." />
            ) : (
              b.gadgets.map((g) => (
                <KitItem
                  key={g.id}
                  src={cdn.gadget(g.id)}
                  name={g.name}
                  accent="cyan"
                />
              ))
            )}
          </KitSection>

          <KitSection
            title="Gears"
            count={b.gears.length}
            max={3}
            accent="violet"
          >
            {b.gears.length === 0 ? (
              <Empty label="Aucun gear équipé." />
            ) : (
              b.gears.map((g) => (
                <KitItem
                  key={g.id}
                  src={cdn.gear(g.id)}
                  name={g.name}
                  meta={`Niveau ${g.level}`}
                  accent="violet"
                />
              ))
            )}
          </KitSection>
        </div>
      </motion.div>
    </div>
  );
}

// ------------------------------------------------------------------

function BigStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: "yellow" | "magenta" | "cyan" | "violet";
}) {
  const color = {
    yellow: "text-brand-yellow",
    magenta: "text-brand-magenta",
    cyan: "text-brand-cyan",
    violet: "text-brand-violet",
  }[accent];
  return (
    <div className="surface rounded-xl p-3 text-center">
      <div className="text-[10px] uppercase tracking-wider text-text-dim">
        {label}
      </div>
      <div className={`display text-2xl mt-1 ${color}`}>{value}</div>
    </div>
  );
}

function KitSection({
  title,
  count,
  max,
  accent,
  children,
}: {
  title: string;
  count: number;
  max: number;
  accent: "yellow" | "cyan" | "violet";
  children: React.ReactNode;
}) {
  const accentText = {
    yellow: "text-brand-yellow",
    cyan: "text-brand-cyan",
    violet: "text-brand-violet",
  }[accent];
  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <h3 className={`display text-base uppercase tracking-wider ${accentText}`}>
          {title}
        </h3>
        <span className="text-text-muted text-xs font-mono">
          {count}/{max}
        </span>
      </div>
      <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        {children}
      </div>
    </section>
  );
}

function KitItem({
  src,
  name,
  meta,
  accent,
}: {
  src: string;
  name: string;
  meta?: string;
  accent: "yellow" | "cyan" | "violet";
}) {
  const ring = {
    yellow: "ring-brand-yellow/30 bg-brand-yellow/10",
    cyan: "ring-brand-cyan/30 bg-brand-cyan/10",
    violet: "ring-brand-violet/30 bg-brand-violet/10",
  }[accent];
  return (
    <div className="surface rounded-xl p-2.5 flex items-center gap-2.5">
      <div
        className={`shrink-0 w-10 h-10 rounded-lg ring-1 ${ring} grid place-items-center`}
      >
        <Img src={src} alt={name} wrapperClassName="w-8 h-8" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-semibold text-sm truncate">{name}</div>
        {meta && <div className="text-text-dim text-[10px]">{meta}</div>}
      </div>
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="surface rounded-xl p-3 text-center text-text-dim text-xs col-span-full">
      {label}
    </div>
  );
}
