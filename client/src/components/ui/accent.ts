/**
 * Table d'accents partagée. Les classes sont écrites en toutes lettres pour que
 * le compilateur Tailwind les détecte.
 */
export type Accent =
  | "gold"
  | "magenta"
  | "cyan"
  | "violet"
  | "success"
  | "danger"
  | "neutral";

export const accentText: Record<Accent, string> = {
  gold: "text-gold",
  magenta: "text-magenta",
  cyan: "text-cyan",
  violet: "text-violet",
  success: "text-success",
  danger: "text-danger",
  neutral: "text-text",
};

export const accentFill: Record<Accent, string> = {
  gold: "bg-gold",
  magenta: "bg-magenta",
  cyan: "bg-cyan",
  violet: "bg-violet",
  success: "bg-success",
  danger: "bg-danger",
  neutral: "bg-white/40",
};

export const accentBgSoft: Record<Accent, string> = {
  gold: "bg-gold/10",
  magenta: "bg-magenta/10",
  cyan: "bg-cyan/10",
  violet: "bg-violet/10",
  success: "bg-success/10",
  danger: "bg-danger/10",
  neutral: "bg-white/5",
};

export const accentBorderSoft: Record<Accent, string> = {
  gold: "border-gold/25",
  magenta: "border-magenta/25",
  cyan: "border-cyan/25",
  violet: "border-violet/25",
  success: "border-success/25",
  danger: "border-danger/25",
  neutral: "border-line",
};

/** Valeurs hex brutes (pour SVG / styles inline). */
export const accentHex: Record<Accent, string> = {
  gold: "#FFC015",
  magenta: "#FF2D87",
  cyan: "#28D2FF",
  violet: "#8A5CFF",
  success: "#2BD672",
  danger: "#FF4D6D",
  neutral: "#9aa3c7",
};
