/**
 * L'API renvoie les noms de brawlers en MAJUSCULES ("SHELLY", "EL PRIMO",
 * "8-BIT", "MR. P"). On les met en casse de titre pour l'affichage.
 */
export function prettyBrawlerName(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/(^|[\s\-.])(\p{L})/gu, (_m, sep: string, ch: string) => sep + ch.toUpperCase());
}
