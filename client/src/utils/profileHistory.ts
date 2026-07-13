/**
 * Historique de profil reconstruit localement.
 *
 * L'API Supercell ne fournit AUCUN historique de trophées. On en construit un
 * en prenant un instantané (trophées, brawlers, niveau) à chaque visite d'un
 * profil. La courbe est donc partielle et grandit avec le temps — à la 1re
 * visite elle est quasi vide.
 *
 * Stockage par tag dans localStorage, capé.
 */
const PREFIX = "profile-history:";
const MAX_SNAPSHOTS = 90;
/** En-dessous de ce délai, un rechargement ne crée pas un nouveau point. */
const MIN_GAP_MS = 30 * 60_000; // 30 min

export interface ProfileSnapshot {
  t: string; // ISO
  trophies: number;
  brawlers: number;
  level: number;
}

const key = (tag: string) => `${PREFIX}${tag.replace(/^#/, "").toUpperCase()}`;

export function loadSnapshots(tag: string): ProfileSnapshot[] {
  try {
    const raw = localStorage.getItem(key(tag));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as ProfileSnapshot[]) : [];
  } catch {
    return [];
  }
}

function save(tag: string, list: ProfileSnapshot[]): void {
  try {
    localStorage.setItem(key(tag), JSON.stringify(list.slice(-MAX_SNAPSHOTS)));
  } catch {
    /* localStorage plein/désactivé */
  }
}

/**
 * L'instantané "visite précédente" : le plus récent point antérieur d'au moins
 * MIN_GAP_MS. Sert au bloc « depuis ta dernière visite » (on ne veut pas d'un
 * delta nul si l'utilisateur recharge la page).
 */
export function previousVisit(
  tag: string,
  now = Date.now(),
): ProfileSnapshot | null {
  const snaps = loadSnapshots(tag);
  for (let i = snaps.length - 1; i >= 0; i -= 1) {
    const s = snaps[i]!;
    if (now - new Date(s.t).getTime() >= MIN_GAP_MS) return s;
  }
  return null;
}

/**
 * Enregistre la visite courante. Ajoute un point si c'est la première visite,
 * si les trophées ont changé, ou si le dernier point date d'assez longtemps.
 * Retourne la liste à jour.
 */
export function recordVisit(
  tag: string,
  cur: Omit<ProfileSnapshot, "t">,
): ProfileSnapshot[] {
  const snaps = loadSnapshots(tag);
  const last = snaps[snaps.length - 1];
  const now = Date.now();
  const shouldAppend =
    !last ||
    last.trophies !== cur.trophies ||
    now - new Date(last.t).getTime() >= MIN_GAP_MS;
  if (!shouldAppend) return snaps;
  const next = [...snaps, { t: new Date(now).toISOString(), ...cur }];
  save(tag, next);
  return next;
}

export function clearHistory(tag: string): void {
  try {
    localStorage.removeItem(key(tag));
  } catch {
    /* noop */
  }
}
