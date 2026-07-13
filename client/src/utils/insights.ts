/**
 * Insights auto : petites phrases en français dérivées des analytics de combat.
 * Rien d'inventé — uniquement des reformulations des chiffres calculés.
 */
import type { BattlelogAnalytics } from "../types/analytics";
import { fmtMode } from "./format";
import { prettyBrawlerName } from "./brawlerName";

export function buildInsights(a: BattlelogAnalytics | null): string[] {
  if (!a || a.countedBattles === 0) return [];
  const out: string[] = [];

  // Mode fort vs mode faible (parmi ceux avec assez de matchs).
  const modes = a.modes.filter((m) => m.battles >= 3);
  if (modes.length >= 2) {
    const best = [...modes].sort((x, y) => y.winRate - x.winRate)[0]!;
    const worst = [...modes].sort((x, y) => x.winRate - y.winRate)[0]!;
    if (best.mode !== worst.mode) {
      out.push(
        `${Math.round(best.winRate * 100)} % de winrate en ${fmtMode(best.mode)}, ton mode fort — mais seulement ${Math.round(worst.winRate * 100)} % en ${fmtMode(worst.mode)}.`,
      );
    }
  } else if (modes.length === 1) {
    const m = modes[0]!;
    out.push(
      `${Math.round(m.winRate * 100)} % de winrate en ${fmtMode(m.mode)} sur ${m.battles} matchs.`,
    );
  }

  // Meilleur brawler du moment (par winrate, min 3 matchs).
  const brawlers = a.brawlers.filter((b) => b.battles >= 3);
  if (brawlers.length) {
    const top = [...brawlers].sort(
      (x, y) => y.winRate - x.winRate || y.trophyChange - x.trophyChange,
    )[0]!;
    const trophyBit =
      top.trophyChange > 0 ? `, ${top.trophyChange > 0 ? "+" : ""}${top.trophyChange} trophées` : "";
    out.push(
      `Ton meilleur brawler récent : ${prettyBrawlerName(top.name)} (${Math.round(top.winRate * 100)} % sur ${top.battles} matchs${trophyBit}).`,
    );
  }

  // Δ trophées moyen.
  if (a.averageTrophyChange !== 0) {
    const sign = a.averageTrophyChange > 0 ? "+" : "";
    out.push(
      `Δ trophées moyen par combat : ${sign}${a.averageTrophyChange.toFixed(1)} sur les ${a.countedBattles} derniers matchs comptés.`,
    );
  }

  // Série en cours.
  if (a.currentStreak.type === "victory" && a.currentStreak.length >= 2) {
    out.push(`Tu es sur une série de ${a.currentStreak.length} victoires d'affilée.`);
  } else if (a.currentStreak.type === "defeat" && a.currentStreak.length >= 3) {
    out.push(
      `Série de ${a.currentStreak.length} défaites — change de mode ou de brawler pour casser la spirale.`,
    );
  }

  return out.slice(0, 4);
}
