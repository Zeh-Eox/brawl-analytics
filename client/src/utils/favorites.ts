/** Joueurs épinglés (favoris), persistés dans localStorage. */
const KEY = "nova:favorites";
const LEGACY_KEY = "brawlstats:favorites";
const MAX = 12;

// Migration douce depuis l'ancienne clé de marque (BrawlStats → NOVA).
try {
  if (!localStorage.getItem(KEY)) {
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      localStorage.setItem(KEY, legacy);
      localStorage.removeItem(LEGACY_KEY);
    }
  }
} catch {
  /* localStorage indisponible */
}

export interface FavoritePlayer {
  tag: string; // normalisé, sans #
  name: string;
  iconId?: number;
  trophies?: number;
}

export function loadFavorites(): FavoritePlayer[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as unknown;
    return Array.isArray(arr) ? (arr as FavoritePlayer[]) : [];
  } catch {
    return [];
  }
}

function save(list: FavoritePlayer[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
  } catch {
    /* noop */
  }
}

const norm = (tag: string) => tag.replace(/^#/, "").toUpperCase();

export function isFavorite(tag: string): boolean {
  const t = norm(tag);
  return loadFavorites().some((f) => f.tag === t);
}

export function toggleFavorite(fav: FavoritePlayer): FavoritePlayer[] {
  const t = norm(fav.tag);
  const cur = loadFavorites();
  const exists = cur.some((f) => f.tag === t);
  const next = exists
    ? cur.filter((f) => f.tag !== t)
    : [{ ...fav, tag: t }, ...cur.filter((f) => f.tag !== t)];
  save(next);
  return next;
}
