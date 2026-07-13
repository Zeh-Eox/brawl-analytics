/** Recherches récentes (tag + pseudo si connu), persistées dans localStorage. */
const KEY = "nova:recents";
const LEGACY_KEY = "brawlstats:recents";
const MAX = 8;

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

export interface RecentPlayer {
  tag: string; // normalisé, sans #
  name?: string;
}

const norm = (tag: string) => tag.replace(/^#/, "").toUpperCase();

export function loadRecents(): RecentPlayer[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as unknown;
    return Array.isArray(arr) ? (arr as RecentPlayer[]) : [];
  } catch {
    return [];
  }
}

export function pushRecent(entry: RecentPlayer): RecentPlayer[] {
  const t = norm(entry.tag);
  const cur = loadRecents().filter((r) => r.tag !== t);
  const next = [{ ...entry, tag: t }, ...cur].slice(0, MAX);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* noop */
  }
  return next;
}
