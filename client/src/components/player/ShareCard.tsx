import { useState } from "react";
import type { PlayerProfileAnalytics } from "../../types/analytics";
import { Sheet } from "../ui/Sheet";
import { Avatar } from "../ui/Avatar";
import { fmtNum, fmtPercent } from "../../utils/format";
import { displayTag } from "../../utils/tag";
import { nameColorToCss } from "../../utils/color";
import { cn } from "../../utils/cn";
import { IconTrophy, IconClub, IconDownload, IconCheck, IconLink } from "../ui/icons";
import { BrandMark } from "../ui/BrandMark";

/** Lien direct partageable vers ce profil (sans les paramètres d'onglet/brawler). */
function profileShareUrl(tag: string): string {
  const clean = tag.replace(/^#/, "").toUpperCase();
  return `${window.location.origin}/player/${clean}`;
}

const escapeXml = (s: string) =>
  s.replace(/[<>&'"]/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!,
  );

/** Construit une carte SVG autonome (sans image externe → export PNG propre). */
function buildSvg(p: PlayerProfileAnalytics): string {
  const { player, summary, battlelog } = p;
  const name = escapeXml(player.name);
  const nameColor = nameColorToCss(player.nameColor);
  const club =
    "tag" in player.club ? escapeXml(player.club.name) : "";
  const wr = battlelog ? fmtPercent(battlelog.winRate, 0) : "—";
  const initials = player.name
    .replace(/[^\p{L}\p{N}]/gu, "")
    .slice(0, 2)
    .toUpperCase();
  const stat = (x: number, val: string, color: string, label: string) => `
    <text x="${x}" y="300" text-anchor="middle" font-family="Lilita One, sans-serif" font-size="34" fill="${color}">${val}</text>
    <text x="${x}" y="322" text-anchor="middle" font-family="Inter, sans-serif" font-weight="700" font-size="12" letter-spacing="1" fill="#8189b3">${label}</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#1a1147"/>
        <stop offset="0.55" stop-color="#0A0D1B"/>
      </linearGradient>
    </defs>
    <rect width="640" height="360" rx="26" fill="url(#bg)"/>
    <rect x="1" y="1" width="638" height="358" rx="25" fill="none" stroke="#FFC015" stroke-opacity="0.3"/>
    <g transform="translate(40,41) scale(1.08)">
      <path d="M12 0.5C12.6 6.8 17.2 11.4 23.5 12 17.2 12.6 12.6 17.2 12 23.5 11.4 17.2 6.8 12.6 0.5 12 6.8 11.4 11.4 6.8 12 0.5Z" fill="#FFC015"/>
      <circle cx="12" cy="12" r="4.4" fill="#FFF7DA"/>
    </g>
    <text x="80" y="61" font-family="Space Grotesk, Inter, sans-serif" font-weight="700" font-size="21" letter-spacing="1.5" fill="#fff">N<tspan fill="#FFC015">O</tspan>VA</text>
    <text x="600" y="58" text-anchor="end" font-family="JetBrains Mono, monospace" font-size="13" fill="#6b7099">${escapeXml(displayTag(player.tag))}</text>
    <circle cx="80" cy="150" r="40" fill="#1C2147"/>
    <text x="80" y="162" text-anchor="middle" font-family="Lilita One, sans-serif" font-size="30" fill="#FFC015">${escapeXml(initials)}</text>
    <text x="140" y="145" font-family="Lilita One, sans-serif" font-size="34" fill="${nameColor}">${name}</text>
    <text x="140" y="172" font-family="Inter, sans-serif" font-weight="600" font-size="15" fill="#28D2FF">${club}</text>
    ${stat(150, fmtNum(player.trophies), "#FFC015", "TROPHÉES")}
    ${stat(320, wr, "#2BD672", "WIN RATE")}
    ${stat(490, fmtNum(summary.brawlers.owned), "#28D2FF", "BRAWLERS")}
  </svg>`;
}

function downloadPng(svg: string, filename: string) {
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.onload = () => {
    const scale = 2;
    const canvas = document.createElement("canvas");
    canvas.width = 640 * scale;
    canvas.height = 360 * scale;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = filename;
      a.click();
    }
    URL.revokeObjectURL(url);
  };
  img.onerror = () => URL.revokeObjectURL(url);
  img.src = url;
}

export function ShareCard({
  open,
  onClose,
  profile,
}: {
  open: boolean;
  onClose: () => void;
  profile: PlayerProfileAnalytics;
}) {
  const { player, summary, battlelog } = profile;
  const club = "tag" in player.club ? player.club : null;
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileShareUrl(player.tag));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard indisponible (contexte non sécurisé) — on ignore */
    }
  };

  return (
    <Sheet open={open} onClose={onClose}>
      {/* Aperçu visuel (DOM) */}
      <div className="overflow-hidden rounded-2xl border border-gold/30 bg-gradient-to-br from-violet/25 to-app p-5 glow-gold">
        <div className="mb-4 flex items-center justify-between">
          <BrandMark size="sm" />
          <span className="font-mono text-[10px] text-dim">
            {displayTag(player.tag)}
          </span>
        </div>
        <div className="mb-5 flex items-center gap-3">
          <Avatar
            iconId={player.icon?.id}
            name={player.name}
            className="h-16 w-16 shrink-0"
          />
          <div className="min-w-0">
            <div
              className="display truncate text-2xl"
              style={{ color: nameColorToCss(player.nameColor) }}
            >
              {player.name}
            </div>
            {club && (
              <div className="inline-flex items-center gap-1 text-[12px] font-semibold text-cyan">
                <IconClub size={13} /> {club.name}
              </div>
            )}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <ShareStat value={<span className="inline-flex items-center gap-1"><IconTrophy size={18} />{fmtNum(player.trophies)}</span>} label="Trophées" color="text-gold" />
          <ShareStat
            value={battlelog ? fmtPercent(battlelog.winRate, 0) : "—"}
            label="Win rate"
            color="text-success"
          />
          <ShareStat
            value={fmtNum(summary.brawlers.owned)}
            label="Brawlers"
            color="text-cyan"
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={onClose}
          className="shrink-0 rounded-xl border border-line-strong bg-white/5 px-5 py-3 text-[13px] font-bold text-text hover:bg-white/10"
        >
          Fermer
        </button>
        <button
          onClick={copyLink}
          className={cn(
            "shrink-0 inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-[13px] font-bold transition-colors",
            copied
              ? "border-success/40 bg-success/10 text-success"
              : "border-line-strong bg-white/5 text-text hover:bg-white/10",
          )}
        >
          {copied ? <IconCheck size={16} /> : <IconLink size={16} />}
          {copied ? "Lien copié" : "Copier le lien"}
        </button>
        <button
          onClick={() =>
            downloadPng(
              buildSvg(profile),
              `nova-${player.name.replace(/[^\w]/g, "")}.png`,
            )
          }
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-gold to-gold-deep py-3 text-[13px] font-black text-app"
        >
          <IconDownload size={16} /> Télécharger l'image
        </button>
      </div>
    </Sheet>
  );
}

function ShareStat({
  value,
  label,
  color,
}: {
  value: React.ReactNode;
  label: string;
  color: string;
}) {
  return (
    <div>
      <div className={`display text-2xl ${color}`}>{value}</div>
      <div className="text-[9px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </div>
    </div>
  );
}
