import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { usePlayerCompare } from "../api/queries";
import type { PlayerSummary } from "../types/analytics";
import { Avatar } from "../components/ui/Avatar";
import { Skeleton } from "../components/ui/Skeleton";
import { ErrorState } from "../components/ui/ErrorState";
import { cn } from "../utils/cn";
import { fmtNum, fmtPercent } from "../utils/format";
import { displayTag, validateTag } from "../utils/tag";
import { IconSwords, IconTrophy } from "../components/ui/icons";

export function ComparePage() {
  const { tagA: pA, tagB: pB } = useParams();
  const [params, setParams] = useSearchParams();

  const [a, setA] = useState(pA ?? params.get("a") ?? "");
  const [b, setB] = useState(pB ?? params.get("b") ?? "");

  const va = validateTag(a);
  const vb = validateTag(b);
  const [submitted, setSubmitted] = useState<{ a?: string; b?: string }>({
    a: va.ok ? va.normalized : undefined,
    b: vb.ok ? vb.normalized : undefined,
  });

  useEffect(() => {
    // Seed depuis l'URL au montage.
    if (params.get("a") && va.ok) setSubmitted((s) => ({ ...s, a: va.normalized }));
    if (params.get("b") && vb.ok) setSubmitted((s) => ({ ...s, b: vb.normalized }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const compare = usePlayerCompare(submitted.a, submitted.b);

  function run() {
    if (!va.ok || !vb.ok) return;
    setSubmitted({ a: va.normalized, b: vb.normalized });
    const next = new URLSearchParams();
    next.set("a", va.normalized);
    next.set("b", vb.normalized);
    setParams(next, { replace: true });
  }

  return (
    <section className="space-y-5">
      <h1 className="display flex items-center gap-2 text-2xl text-white md:text-3xl"><IconSwords size={24} /> Comparaison</h1>

      {/* Formulaire */}
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <TagInput label="Joueur A" value={a} onChange={setA} valid={va.ok || a === ""} />
        <TagInput label="Joueur B" value={b} onChange={setB} valid={vb.ok || b === ""} />
        <button
          onClick={run}
          disabled={!va.ok || !vb.ok}
          className="rounded-xl bg-gold px-6 py-3 text-sm font-black text-app disabled:opacity-40"
        >
          Comparer
        </button>
      </div>

      {!submitted.a || !submitted.b ? (
        <div className="rounded-2xl border border-dashed border-line-strong bg-surface/40 px-6 py-12 text-center text-sm text-text-2">
          Entre deux tags pour voir la comparaison côte à côte.
        </div>
      ) : compare.isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-72" />
        </div>
      ) : compare.isError ? (
        <ErrorState error={compare.error} onRetry={() => void compare.refetch()} />
      ) : compare.data ? (
        <ComparisonView
          a={compare.data.players[0]}
          b={compare.data.players[1]}
        />
      ) : null}
    </section>
  );
}

function TagInput({
  label,
  value,
  onChange,
  valid,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  valid: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-muted">
        {label}
      </label>
      <div
        className={cn(
          "flex items-center gap-2 rounded-xl border-2 bg-surface px-3 h-12",
          valid ? "border-line" : "border-danger",
        )}
      >
        <span className="display text-gold">#</span>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="8QRPPCLR"
          spellCheck={false}
          className="flex-1 bg-transparent font-mono text-sm font-semibold uppercase tracking-wider text-text outline-none placeholder:text-dim"
        />
      </div>
    </div>
  );
}

interface Metric {
  label: string;
  a: number;
  b: number;
  fmt?: (n: number) => string;
}

function ComparisonView({ a, b }: { a: PlayerSummary; b: PlayerSummary }) {
  const pct = (r: number) => fmtPercent(r, 0);
  const dec = (n: number) => n.toFixed(1);
  const round = (n: number) => fmtNum(Math.round(n));

  const metrics: Metric[] = [
    { label: "Trophées", a: a.trophies, b: b.trophies },
    { label: "Record", a: a.highestTrophies, b: b.highestTrophies },
    { label: "Niveau", a: a.expLevel, b: b.expLevel },
    { label: "Victoires", a: a.totalVictories, b: b.totalVictories },
    { label: "Meilleur brawler", a: a.brawlers.bestBrawlerTrophies, b: b.brawlers.bestBrawlerTrophies },
    { label: "Brawlers possédés", a: a.brawlers.owned, b: b.brawlers.owned },
    { label: "Power 11", a: a.brawlers.maxedOut, b: b.brawlers.maxedOut },
    { label: "Power moyen", a: a.brawlers.averagePower, b: b.brawlers.averagePower, fmt: dec },
    { label: "Trophées moy./brawler", a: a.brawlers.averageTrophies, b: b.brawlers.averageTrophies, fmt: round },
    { label: "Complétion du kit", a: a.completion.overall, b: b.completion.overall, fmt: pct },
    { label: "Star Powers", a: a.brawlers.totalStarPowers, b: b.brawlers.totalStarPowers },
    { label: "Gadgets", a: a.brawlers.totalGadgets, b: b.brawlers.totalGadgets },
    { label: "Gears", a: a.brawlers.totalGears, b: b.brawlers.totalGears },
  ];

  let aWins = 0;
  let bWins = 0;
  for (const m of metrics) {
    if (m.a > m.b) aWins += 1;
    else if (m.b > m.a) bWins += 1;
  }
  const leader = aWins > bWins ? 0 : bWins > aWins ? 1 : -1;

  return (
    <div className="space-y-4">
      {/* cartes joueurs */}
      <div className="grid grid-cols-2 gap-3">
        {[a, b].map((p, i) => (
          <div
            key={i}
            className={cn(
              "relative flex flex-col items-center gap-2 rounded-2xl border p-4 text-center",
              leader === i ? "border-gold/40 bg-gold/5" : "border-line bg-surface",
            )}
          >
            {leader === i && (
              <span className="absolute right-3 top-3 rounded-md bg-gold/15 px-1.5 py-0.5 text-[9px] font-bold text-gold">
                MÈNE
              </span>
            )}
            <Avatar name={p.name} className="h-14 w-14" />
            <div className="w-full truncate text-sm font-bold text-text">{p.name}</div>
            <div className="font-mono text-[10px] text-dim">{displayTag(p.tag)}</div>
            <div className="display inline-flex items-center gap-1 text-lg text-gold">
              <IconTrophy size={16} />
              {fmtNum(p.trophies)}
            </div>
          </div>
        ))}
      </div>

      {/* scoreboard */}
      <div className="rounded-2xl border border-line bg-surface p-4">
        <div className="mb-2 flex items-center justify-between text-[12px] font-bold">
          <span className={leader === 0 ? "text-gold" : "text-text-2"}>
            {aWins} {aWins > 1 ? "catégories" : "catégorie"}
          </span>
          <span className="text-[10px] uppercase tracking-widest text-dim">Domination</span>
          <span className={leader === 1 ? "text-gold" : "text-text-2"}>
            {bWins} {bWins > 1 ? "catégories" : "catégorie"}
          </span>
        </div>
        <div className="flex h-2.5 overflow-hidden rounded-full bg-white/6">
          <div className="h-full bg-gold/80" style={{ width: `${bar(aWins, bWins)}%` }} />
          <div className="h-full flex-1 bg-cyan/70" />
        </div>
      </div>

      {/* métriques */}
      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        {metrics.map((m) => {
          const fmt = m.fmt ?? fmtNum;
          const aWin = m.a > m.b;
          const bWin = m.b > m.a;
          const total = m.a + m.b || 1;
          const aShare = (m.a / total) * 100;
          const gap = Math.abs(m.a - m.b);
          return (
            <div key={m.label} className="border-b border-line px-4 py-3 last:border-0">
              <div className="mb-1.5 flex items-center gap-2">
                <span className={cn("flex-1 text-left text-[15px]", aWin ? "font-extrabold text-success" : "font-bold text-text-2")}>
                  {fmt(m.a)}
                </span>
                <div className="text-center">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-dim">{m.label}</div>
                  {gap > 0 && (
                    <div className="text-[9px] text-dim">écart {fmt(gap)}</div>
                  )}
                </div>
                <span className={cn("flex-1 text-right text-[15px]", bWin ? "font-extrabold text-success" : "font-bold text-text-2")}>
                  {fmt(m.b)}
                </span>
              </div>
              <div className="flex h-1.5 gap-0.5">
                <div
                  className={cn("h-full rounded-l-full", aWin ? "bg-success" : "bg-white/12")}
                  style={{ width: `${aShare}%` }}
                />
                <div
                  className={cn("h-full flex-1 rounded-r-full", bWin ? "bg-success" : "bg-white/12")}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const bar = (a: number, b: number) => (a + b > 0 ? (a / (a + b)) * 100 : 50);
