const nfCompact = new Intl.NumberFormat("fr-FR", { notation: "compact" });
const nf = new Intl.NumberFormat("fr-FR");

export const fmtNum = (n: number): string => nf.format(n);

export const fmtCompact = (n: number): string => nfCompact.format(n);

export const fmtPercent = (ratio: number, decimals = 1): string =>
  `${(ratio * 100).toFixed(decimals)}%`;

export const fmtDuration = (seconds: number | null): string => {
  if (seconds === null || Number.isNaN(seconds)) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
};

/** Durée en heures uniquement : "957 h", "3 h". */
export const fmtHours = (seconds: number | null): string =>
  !seconds || seconds <= 0 || Number.isNaN(seconds)
    ? "—"
    : `${nf.format(Math.round(seconds / 3600))} h`;

/** Durée longue (temps de jeu) : "3 j 4 h", "12 h 30", "45 min". */
export const fmtPlaytime = (seconds: number | null): string => {
  if (!seconds || seconds <= 0 || Number.isNaN(seconds)) return "—";
  const totalMin = Math.floor(seconds / 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h >= 24) {
    const d = Math.floor(h / 24);
    return `${d} j ${h % 24} h`;
  }
  if (h > 0) return `${h} h ${m.toString().padStart(2, "0")}`;
  return `${m} min`;
};

const MODE_LABELS: Record<string, string> = {
  brawlBall: "Brawl Ball",
  gemGrab: "Gem Grab",
  heist: "Heist",
  bounty: "Bounty",
  siege: "Siege",
  hotZone: "Hot Zone",
  knockout: "Knockout",
  duels: "Duels",
  soloShowdown: "Solo Showdown",
  duoShowdown: "Duo Showdown",
  bigGame: "Big Game",
  bossFight: "Boss Fight",
  roboRumble: "Robo Rumble",
  takedown: "Takedown",
  loneStar: "Lone Star",
  paintBrawl: "Paint Brawl",
  volleyBrawl: "Volley Brawl",
  basketBrawl: "Basket Brawl",
  payload: "Payload",
  wipeout: "Wipeout",
  brawlBall5v5: "Brawl Ball 5v5",
  knockout5v5: "Knockout 5v5",
  gemGrab5v5: "Gem Grab 5v5",
};

export const fmtMode = (raw: string): string =>
  MODE_LABELS[raw] ??
  raw
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();

/** Convert YYYYMMDDTHHMMSS.000Z to a localized date string. */
export const fmtBattleTime = (raw: string): string => {
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/.exec(raw);
  if (!m) return raw;
  const [, y, mo, d, h, mi, s] = m;
  const date = new Date(
    `${y}-${mo}-${d}T${h}:${mi}:${s}Z`,
  );
  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const relativeTime = (iso: string): string => {
  const date = new Date(iso);
  const diff = date.getTime() - Date.now();
  const abs = Math.abs(diff);
  const minutes = Math.round(abs / 60_000);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);
  const rtf = new Intl.RelativeTimeFormat("fr-FR", { numeric: "auto" });
  if (minutes < 60) return rtf.format(Math.sign(diff) * minutes, "minute");
  if (hours < 24) return rtf.format(Math.sign(diff) * hours, "hour");
  return rtf.format(Math.sign(diff) * days, "day");
};
