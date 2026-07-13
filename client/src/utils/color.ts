/**
 * Brawl Stars encode `nameColor` en "0xAARRGGBB" (alpha dans l'octet haut).
 * On retire l'alpha pour obtenir une couleur CSS utilisable.
 */
export function nameColorToCss(raw: string | undefined): string {
  if (!raw) return "#e8ebff";
  const m = /^0x([0-9a-fA-F]{8})$/.exec(raw);
  if (!m) return raw;
  return `#${m[1]!.slice(2)}`;
}
