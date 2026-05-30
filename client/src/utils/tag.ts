/**
 * Mirror of proxy/src/config/tags.ts — kept in sync so the client can
 * reject obviously bad input *before* hitting the network.
 */
const TAG_ALPHABET = /^[0289PYLQGRJCUV]+$/;
const TAG_LENGTH_RANGE: [number, number] = [3, 15];

export function normalizeTag(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/^#/, "")
    .replace(/O/g, "0")
    .replace(/\s+/g, "");
}

export interface TagValidation {
  ok: boolean;
  normalized: string;
  reason?: string;
}

export function validateTag(raw: string): TagValidation {
  const normalized = normalizeTag(raw);
  if (normalized.length === 0) {
    return { ok: false, normalized, reason: "Entrez un tag." };
  }
  if (
    normalized.length < TAG_LENGTH_RANGE[0] ||
    normalized.length > TAG_LENGTH_RANGE[1]
  ) {
    return {
      ok: false,
      normalized,
      reason: `Le tag doit faire entre ${TAG_LENGTH_RANGE[0]} et ${TAG_LENGTH_RANGE[1]} caractères.`,
    };
  }
  if (!TAG_ALPHABET.test(normalized)) {
    return {
      ok: false,
      normalized,
      reason: "Caractères autorisés : 0 2 8 9 P Y L Q G R J C U V.",
    };
  }
  return { ok: true, normalized };
}

export const displayTag = (tag: string): string =>
  tag.startsWith("#") ? tag : `#${normalizeTag(tag)}`;
