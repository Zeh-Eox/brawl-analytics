import { useMemo, type ReactNode } from "react";
import type { BattleLogItem, PlayerBrawler } from "../../types/brawlstars";
import { Sheet } from "../ui/Sheet";
import { Img } from "../ui/Img";
import { CdnIcon } from "../ui/CdnIcon";
import { TrophyCurve, type CurvePoint } from "../ui/TrophyCurve";
import { cdn, cdnChain } from "../../utils/cdn";
import { fmtNum, fmtPercent } from "../../utils/format";
import { prettyBrawlerName } from "../../utils/brawlerName";
import { useAccumulatedBattles } from "../../hooks/useAccumulatedBattles";
import { accentHex, accentText, accentBgSoft, accentBorderSoft, type Accent } from "../ui/accent";
import { BRAWLER_INFO, type BrawlerAbility } from "../../data/brawlerInfo";
import { IconTrophy, IconStar, IconWrench, IconGear, type IconProps } from "../ui/icons";

const MAX_POWER = 11;

const RARITY_HEX: Record<string, string> = {
  "Starting Brawler": "#b0b7d0",
  Rare: "#2ad35a",
  "Super Rare": "#24a2ff",
  Epic: "#b768ff",
  Mythic: "#f9484d",
  Legendary: "#ffc61a",
};
const rarityHex = (r?: string) => (r && RARITY_HEX[r]) || "#9aa3c7";
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const cat = (v?: string) => {
  if (!v) return undefined;
  const m = /\(([^)]+)\)/.exec(v);
  return m ? m[1] : v;
};
/** Stat au niveau de power donné : base * (1 + 0.1*(power-1)). Niveau 11 = 2× base. */
const scale = (base: number, power: number) =>
  Math.round(base * (1 + 0.1 * (Math.max(1, power) - 1)));

function ownBrawlerId(item: BattleLogItem, myTag: string): number | null {
  for (const t of item.battle.teams ?? [])
    for (const p of t) if (p.tag === myTag) return p.brawler.id;
  for (const p of item.battle.players ?? [])
    if (p.tag === myTag) return p.brawler.id;
  return null;
}
function toIso(bt: string): string {
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/.exec(bt);
  if (!m) return bt;
  const [, y, mo, d, h, mi, s] = m;
  return `${y}-${mo}-${d}T${h}:${mi}:${s}Z`;
}

export function BrawlerSheet({
  brawler,
  tag,
  open,
  onClose,
}: {
  brawler: PlayerBrawler | null;
  tag: string;
  open: boolean;
  onClose: () => void;
}) {
  const acc = useAccumulatedBattles(tag);
  const myTag = `#${tag}`;

  const perf = useMemo(() => {
    const empty = { played: 0, wins: 0, losses: 0, winRate: 0, trophyDelta: 0, curve: [] as CurvePoint[] };
    if (!brawler) return empty;
    const seq = acc.items
      .filter((it) => ownBrawlerId(it, myTag) === brawler.id)
      .sort((a, b) => a.battleTime.localeCompare(b.battleTime));
    if (seq.length === 0) return empty;
    const changes = seq.map((it) => it.battle.trophyChange ?? 0);
    const total = changes.reduce((a, b) => a + b, 0);
    const base = brawler.trophies - total;
    let run = base;
    const curve: CurvePoint[] = [{ t: toIso(seq[0]!.battleTime), trophies: base }];
    let wins = 0;
    let losses = 0;
    for (let i = 0; i < seq.length; i += 1) {
      run += changes[i]!;
      curve.push({ t: toIso(seq[i]!.battleTime), trophies: run });
      const r = seq[i]!.battle.result;
      if (r === "victory") wins += 1;
      else if (r === "defeat") losses += 1;
    }
    const decided = wins + losses;
    return { played: seq.length, wins, losses, winRate: decided ? wins / decided : 0, trophyDelta: total, curve };
  }, [brawler, acc.items, myTag]);

  const info = brawler ? BRAWLER_INFO[brawler.id] : undefined;
  const power = brawler?.power ?? MAX_POWER;

  const dmgText = (a?: BrawlerAbility) => {
    if (!a?.damage) return undefined;
    const d = fmtNum(scale(a.damage, power));
    return a.hits && a.hits > 1 ? `${a.hits} × ${d}` : d;
  };

  return (
    <Sheet open={open} onClose={onClose} size="lg">
      {brawler && (
        <div className="space-y-4">
          {/* ============ EN-TÊTE ============ */}
          <div
            className="relative overflow-hidden rounded-2xl border border-line-strong bg-app"
            style={{
              backgroundImage:
                "linear-gradient(180deg, rgba(8,9,14,0.35) 0%, rgba(8,9,14,0.5) 55%, rgba(8,9,14,0.8) 100%), url('/brawler-bg.png')",
              backgroundSize: "cover",
              backgroundPosition: "center 78%",
              backgroundRepeat: "no-repeat",
            }}
          >
            <div className="flex items-end gap-3 p-4">
              <Img
                src={cdn.brawlerModel(brawler.id)}
                alt={brawler.name}
                fit="contain"
                wrapperClassName="h-28 w-28 shrink-0"
                fallback={
                  <Img
                    src={cdn.brawlerBorderless(brawler.id)}
                    alt={brawler.name}
                    wrapperClassName="h-20 w-20"
                    fallback={<span className="display text-2xl text-gold">{brawler.name.slice(0, 2)}</span>}
                  />
                }
              />
              <div className="min-w-0 flex-1 pb-1">
                <div className="display text-2xl text-white drop-shadow">{prettyBrawlerName(brawler.name)}</div>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <span className="rounded-md bg-gold/15 px-2 py-0.5 font-mono text-[11px] font-bold text-gold">POWER {brawler.power}</span>
                  <span className="rounded-md bg-violet/20 px-2 py-0.5 font-mono text-[11px] font-bold text-violet">RANK {brawler.rank}</span>
                  {info?.rarity && (
                    <span className="rounded-md px-2 py-0.5 text-[10px] font-bold uppercase" style={{ color: rarityHex(info.rarity), background: `${rarityHex(info.rarity)}26` }}>
                      {info.rarity}
                    </span>
                  )}
                  {info?.class && (
                    <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase text-text-2">{info.class}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* trophées + power bar */}
          <div className="flex items-center gap-2.5">
            <div className="flex shrink-0 gap-2">
              <div className="rounded-xl border border-gold/20 bg-gold/8 px-3 py-1.5 text-center">
                <div className="display inline-flex items-center gap-1 text-base text-gold"><IconTrophy size={15} />{fmtNum(brawler.trophies)}</div>
                <div className="text-[8px] font-semibold uppercase text-muted">Actuel</div>
              </div>
              <div className="rounded-xl border border-line bg-surface px-3 py-1.5 text-center">
                <div className="display text-base text-text">{fmtNum(brawler.highestTrophies)}</div>
                <div className="text-[8px] font-semibold uppercase text-muted">Record</div>
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center justify-between text-[9px] font-bold uppercase tracking-wide">
                <span className="text-muted">Power</span>
                <span className={power >= MAX_POWER ? "text-gold" : "text-text-2"}>
                  {power >= MAX_POWER ? "MAX" : `${power}/${MAX_POWER}`}
                </span>
              </div>
              <div className="flex gap-1">
                {Array.from({ length: MAX_POWER }).map((_, i) => (
                  <div key={i} className={`h-2 flex-1 rounded-sm ${i < power ? "bg-gradient-to-r from-gold to-gold-deep" : "bg-white/8"}`} />
                ))}
              </div>
            </div>
          </div>

          {/* description */}
          {info?.description && (
            <p className="rounded-2xl border border-line bg-surface/60 p-4 text-[13.5px] italic leading-relaxed text-text-2">
              « {info.description} »
            </p>
          )}

          {/* ============ STATISTIQUES ============ */}
          {info && (info.health || info.attack || info.super) && (
            <section>
              <SectionLabel>Statistiques (niveau {power})</SectionLabel>
              <div className="mb-3 grid grid-cols-3 gap-2">
                {info.health && <MiniStat label="Santé" value={fmtNum(scale(info.health, power))} color="text-success" picto="/picto-health.png" />}
                {cat(info.movementSpeed) && <MiniStat label="Vitesse" value={cat(info.movementSpeed)!} color="text-cyan" />}
                {cat(info.reload) && <MiniStat label="Recharge" value={cat(info.reload)!} color="text-text" />}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {info.attack && (
                  <AbilityCard
                    label="Attaque" picto="/picto-attack.png" tone="danger" ability={info.attack}
                    stats={[{ label: "Dégâts", value: dmgText(info.attack) }, { label: "Portée", value: cat(info.attackRange) }]}
                  />
                )}
                {info.super && (
                  <AbilityCard
                    label="Super" picto="/picto-super.png" tone="gold" ability={info.super}
                    stats={[{ label: "Dégâts", value: dmgText(info.super) }, { label: "Portée", value: cat(info.superRange) }]}
                  />
                )}
              </div>
              {info.hypercharge && <div className="mt-3"><AbilityCard label="Hypercharge" picto="/picto-hypercharge.png" tone="violet" ability={info.hypercharge} /></div>}
            </section>
          )}

          {/* ============ KIT ============ */}
          <section className="space-y-4">
            <div>
              <SectionLabel>Kit débloqué</SectionLabel>
              <KitSection
                title="Star Powers" accent="text-gold" Icon={IconStar} count={brawler.starPowers.length} max={2}
                items={brawler.starPowers.map((sp) => ({ id: sp.id, name: prettyBrawlerName(sp.name), srcs: cdnChain.starPower(sp.id), desc: info?.abilities?.[norm(sp.name)] }))}
              />
            </div>
            <KitSection
              title="Gadgets" accent="text-success" Icon={IconWrench} count={brawler.gadgets.length} max={2}
              items={brawler.gadgets.map((g) => ({ id: g.id, name: prettyBrawlerName(g.name), srcs: cdnChain.gadget(g.id), desc: info?.abilities?.[norm(g.name)] }))}
            />
            <KitSection
              title="Équipements" accent="text-cyan" Icon={IconGear} count={brawler.gears.length} max={6}
              items={brawler.gears.map((g) => ({ id: g.id, name: `${prettyBrawlerName(g.name)}${g.level ? ` · niv. ${g.level}` : ""}`, srcs: cdnChain.gear(g.id) }))}
            />
          </section>

          {/* ============ PERFORMANCE ============ */}
          <section>
            <SectionLabel>Tes stats avec {prettyBrawlerName(brawler.name)}</SectionLabel>
            {perf.played > 0 ? (
              <div className="rounded-2xl border border-line bg-surface p-4">
                <div className="mb-3 grid grid-cols-3 gap-3">
                  <PerfStat value={`${perf.played}`} label="Matchs" color="text-text" />
                  <PerfStat value={fmtPercent(perf.winRate, 0)} label={`${perf.wins}V · ${perf.losses}D`} color={perf.winRate >= 0.5 ? "text-success" : "text-danger"} />
                  <PerfStat value={`${perf.trophyDelta >= 0 ? "+" : ""}${perf.trophyDelta}`} label="Δ trophées" color={perf.trophyDelta >= 0 ? "text-success" : "text-danger"} />
                </div>
                <TrophyCurve data={perf.curve} height={160} color={perf.trophyDelta >= 0 ? accentHex.success : accentHex.danger} />
                <div className="mt-1 text-[10px] text-dim">
                  Trophées du brawler sur tes {perf.played} combats récents (reconstruit depuis l'historique).
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-line bg-white/3 px-4 py-6 text-center text-[13px] text-text-2">
                Pas encore de combats récents avec ce brawler. Joue avec lui puis reviens.
              </div>
            )}
          </section>
        </div>
      )}
    </Sheet>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2.5 flex items-center gap-2">
      <span className="text-[11px] font-bold uppercase tracking-widest text-muted">{children}</span>
      <div className="h-px flex-1 bg-line" />
    </div>
  );
}

function MiniStat({ label, value, color, picto }: { label: string; value: string; color: string; picto?: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface px-2 py-2 text-center">
      <div className="text-[9px] font-semibold uppercase tracking-wide text-muted">{label}</div>
      <div className={`mt-0.5 flex items-center justify-center gap-1.5 text-[13px] font-bold ${color}`}>
        {picto && <img src={picto} alt="" className="h-4 w-4 object-contain" />}
        {value}
      </div>
    </div>
  );
}

function AbilityCard({
  label, picto, tone, ability, stats,
}: {
  label: string; picto: string; tone: Accent; ability: BrawlerAbility;
  stats?: { label: string; value?: string }[];
}) {
  const shown = (stats ?? []).filter((s) => s.value);
  return (
    <div className={`rounded-2xl border p-4 ${accentBgSoft[tone]} ${accentBorderSoft[tone]}`}>
      <div className="mb-1.5 flex items-center gap-2">
        <img src={picto} alt="" className="h-6 w-6 shrink-0 object-contain" />
        <span className={`text-[10px] font-bold uppercase tracking-widest ${accentText[tone]}`}>{label}</span>
      </div>
      <div className="display text-lg text-white">{ability.name}</div>
      <p className="mt-1 text-[13px] leading-relaxed text-text-2">{ability.description}</p>
      {shown.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {shown.map((s) => (
            <span key={s.label} className="rounded-lg bg-black/25 px-2.5 py-1 text-[11px]">
              <span className="text-muted">{s.label} </span>
              <span className="font-bold text-text">{s.value}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function PerfStat({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div className="rounded-xl border border-line bg-white/3 px-2 py-2.5 text-center">
      <div className={`display text-xl ${color}`}>{value}</div>
      <div className="mt-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted">{label}</div>
    </div>
  );
}

function KitSection({
  title, accent, Icon, count, max, items,
}: {
  title: string; accent: string; Icon: (p: IconProps) => ReactNode; count: number; max: number;
  items: { id: number; name: string; srcs: string[]; desc?: string }[];
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-widest text-muted">{title}</span>
        <span className={`text-[11px] font-bold ${count >= max ? "text-success" : accent}`}>{count}/{max}</span>
      </div>
      {items.length > 0 ? (
        <div className="space-y-2">
          {items.map((it) => (
            <div key={it.id} className="flex items-start gap-3 rounded-xl border border-line bg-surface px-3 py-2.5">
              <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface-2">
                <CdnIcon srcs={it.srcs} alt={it.name} wrapperClassName="h-7 w-7" fallback={<span className="text-text-2"><Icon size={16} /></span>} />
              </div>
              <div className="min-w-0">
                <div className="text-[13px] font-bold text-text">{it.name}</div>
                {it.desc && <div className="mt-0.5 text-[11.5px] leading-snug text-text-2">{it.desc}</div>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-line bg-white/3 px-3 py-2.5 text-[12px] text-dim">Aucun débloqué.</div>
      )}
    </div>
  );
}
