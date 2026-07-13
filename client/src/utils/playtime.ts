/**
 * Estimation (grossière) du temps de jeu à vie.
 *
 * L'API ne donne ni le temps de jeu ni le nombre total de parties. On estime :
 *   parties ≈ victoires / winrate
 *   temps   ≈ parties × (durée moyenne en match + surcoût hors-match)
 *
 * Le surcoût hors-match couvre ce que l'API ignore totalement : matchmaking,
 * retour au menu, écran de fin, chargement, et le clic « rejouer » entre
 * chaque partie. C'est une hypothèse — d'où le côté « grossier » assumé.
 */
export const MATCH_OVERHEAD_SEC = 45;

export function estimateLifetimeSeconds(
  totalVictories: number,
  winRate?: number,
  avgMatchSec?: number | null,
): number {
  const wr = winRate && winRate > 0.05 ? winRate : 0.5;
  const avg = avgMatchSec && avgMatchSec > 0 ? avgMatchSec : 120;
  const matches = totalVictories / wr;
  return matches * (avg + MATCH_OVERHEAD_SEC);
}
