import type { ReactNode } from "react";

/**
 * Jeu d'icônes SVG maison (stroke, currentColor) — remplace les emojis.
 * Chaque icône hérite de la couleur du texte (ex. dans un `text-gold`).
 */
export interface IconProps {
  size?: number;
  className?: string;
}

function Svg({
  size = 20,
  className,
  children,
  fill = "none",
  strokeWidth = 1.8,
}: IconProps & { children: ReactNode; fill?: string; strokeWidth?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

/* ---- Navigation / onglets ---- */
export const IconOverview = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 20V13M9 20V8M14 20v-6M19 20V5" />
    <path d="M3 20h18" />
  </Svg>
);
export const IconBrawlers = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" />
    <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" />
    <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" />
    <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" />
  </Svg>
);
export const IconBattles = (p: IconProps) => (
  <Svg {...p}>
    <path d="M14.5 4.5 20 3l-1.5 5.5-8 8L8 19l-3-3 2.5-2.5 8-8Z" />
    <path d="m3 3 5.5 1.5 3 3M17 14l4 4-2 2-4-4M14.5 9.5 16 11M5.5 16 8 18.5" />
  </Svg>
);
export const IconAnalytics = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 3v18h18" />
    <path d="M7 14l3.5-4 3 2.5L20 6" />
  </Svg>
);
export const IconClub = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3l7 3v5.5c0 4.4-3 7.4-7 8.5-4-1.1-7-4.1-7-8.5V6l7-3Z" />
  </Svg>
);

/* ---- Actions / génériques ---- */
export const IconStar = (p: IconProps & { filled?: boolean }) => (
  <Svg {...p} fill={p.filled ? "currentColor" : "none"}>
    <path d="M12 2.5l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.8 6.2 20.9l1.1-6.5L2.6 9.3l6.5-.9z" />
  </Svg>
);
export const IconSwords = (p: IconProps) => IconBattles(p);
export const IconShare = (p: IconProps) => (
  <Svg {...p}>
    <path d="M8 16 17 7M17 7H9M17 7v8" />
    <path d="M4 12v6a2 2 0 0 0 2 2h6" />
  </Svg>
);
export const IconTrophy = (p: IconProps) => (
  <Svg {...p}>
    <path d="M8 21h8M12 17v4M6 4h12v5a6 6 0 0 1-12 0V4Z" />
    <path d="M6 5H3.5v1.5A3.5 3.5 0 0 0 6 10M18 5h2.5v1.5A3.5 3.5 0 0 1 18 10" />
  </Svg>
);
export const IconMedal = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="15" r="5" />
    <path d="M12 15v.01M8.5 10.5 6 3h12l-2.5 7.5" />
  </Svg>
);
export const IconFire = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3c.5 3 3 4 3 7.5a3 3 0 0 1-6 0c0-1 .3-1.7.6-2.3C10 10 11 10.5 12 10c.5-2-1-3.5 0-7Z" />
    <path d="M12 21a6 6 0 0 0 6-6c0-4-3-6-4-9 .5 4-3 5-3 8 0-1.5-1-2.5-1-4-1.5 1.5-4 3-4 5a6 6 0 0 0 6 6Z" />
  </Svg>
);
export const IconSparkles = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6z" />
    <path d="M18.5 14l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z" />
  </Svg>
);
export const IconBulb = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9 18h6M10 21h4" />
    <path d="M12 3a6 6 0 0 0-3.8 10.7c.5.4.8 1 .8 1.8v.5h6v-.5c0-.8.3-1.4.8-1.8A6 6 0 0 0 12 3Z" />
  </Svg>
);
export const IconCheck = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 12.5 9 17.5 20 6.5" />
  </Svg>
);
export const IconWarning = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3 2 20h20L12 3Z" />
    <path d="M12 9v5M12 17.5v.01" />
  </Svg>
);
export const IconTarget = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
  </Svg>
);
export const IconClock = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5V12l3 2" />
  </Svg>
);
export const IconGlobe = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.7 2.7 2.7 15.3 0 18M12 3c-2.7 2.7-2.7 15.3 0 18" />
  </Svg>
);
export const IconController = (p: IconProps) => (
  <Svg {...p}>
    <rect x="2" y="7" width="20" height="10" rx="4.5" />
    <path d="M7 11v3M5.5 12.5h3M15.5 11.5v.01M18 13.5v.01" />
  </Svg>
);
export const IconArrowRight = (p: IconProps) => (
  <Svg {...p} strokeWidth={2.2}>
    <path d="M5 12h13M13 6l6 6-6 6" />
  </Svg>
);
export const IconArrowUpRight = (p: IconProps) => (
  <Svg {...p} strokeWidth={2}>
    <path d="M7 17 17 7M8 7h9v9" />
  </Svg>
);
export const IconBolt = (p: IconProps) => (
  <Svg {...p} fill="currentColor" strokeWidth={1.2}>
    <path d="M13 2 4 13.5h6L9 22l9-11.5h-6L13 2Z" />
  </Svg>
);
export const IconCrown = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 18h16M4.5 8.5l3.8 3L12 5l3.7 6.5 3.8-3-1.6 8.5H6.1L4.5 8.5Z" />
  </Svg>
);
export const IconRobot = (p: IconProps) => (
  <Svg {...p}>
    <rect x="4" y="8" width="16" height="11" rx="3" />
    <path d="M12 4v4M9 13v.01M15 13v.01M9 16h6" />
  </Svg>
);
export const IconDownload = (p: IconProps) => (
  <Svg {...p} strokeWidth={2}>
    <path d="M12 3v12M8 11l4 4 4-4M5 20h14" />
  </Svg>
);
export const IconWrench = (p: IconProps) => (
  <Svg {...p}>
    <path d="M15 5a4 4 0 0 0-5.2 5.2L4 16v4h4l5.8-5.8A4 4 0 0 0 19 9l-2.5 2.5-2-2L17 7z" />
  </Svg>
);
export const IconGear = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
  </Svg>
);
export const IconSearch = (p: IconProps) => (
  <Svg {...p} strokeWidth={2}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </Svg>
);
export const IconPlug = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9 2v6M15 2v6M7 8h10v2a5 5 0 0 1-10 0V8ZM12 15v4M12 22h.01" />
  </Svg>
);
export const IconHistory = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
    <path d="M3 3v5h5M12 7.5V12l3.5 2" />
  </Svg>
);
export const IconFilter = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 5h18l-7 8.5V20l-4 1v-7.5L3 5Z" />
  </Svg>
);
export const IconLink = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9.5 14.5 14.5 9.5" />
    <path d="M8 12 6 14a3 3 0 0 0 4 4l2-2M16 12l2-2a3 3 0 0 0-4-4l-2 2" />
  </Svg>
);
export const IconLayers = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3 21 8l-9 5-9-5 9-5Z" />
    <path d="M3 13l9 5 9-5M3 17.5l9 5 9-5" />
  </Svg>
);
export const IconBook = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H19a1 1 0 0 1 1 1v13H6a2 2 0 0 0-2 2V4.5Z" />
    <path d="M6 17a2 2 0 0 0-2 2 2 2 0 0 0 2 2h14M9 7h7M9 10.5h5" />
  </Svg>
);
export const IconPointer = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 3l14 7-6 2-2 6-6-15Z" />
  </Svg>
);
export const IconList = (p: IconProps) => (
  <Svg {...p} strokeWidth={2}>
    <path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" />
  </Svg>
);
export const IconBroadcast = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none" />
    <path d="M8.5 8.5a5 5 0 0 0 0 7M15.5 8.5a5 5 0 0 1 0 7M5.8 5.8a9 9 0 0 0 0 12.4M18.2 5.8a9 9 0 0 1 0 12.4" />
  </Svg>
);
