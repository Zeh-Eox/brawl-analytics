import { useId } from "react";
import { cn } from "../../utils/cn";

/**
 * Logomark NOVA : nova à 4 branches, noyau blanc-or incandescent, dégradé
 * or → or profond. `glow` ajoute le halo (accueil / grands formats).
 */
export function NovaMark({
  size = 24,
  glow = false,
  spark = false,
  className,
}: {
  size?: number;
  glow?: boolean;
  /** Petit éclat secondaire (grands formats uniquement). */
  spark?: boolean;
  className?: string;
}) {
  const uid = useId().replace(/[:]/g, "");
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id={`nv-fill-${uid}`}
          x1="4"
          y1="3"
          x2="20"
          y2="21"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FFD34D" />
          <stop offset="0.5" stopColor="#FFC015" />
          <stop offset="1" stopColor="#FF9B00" />
        </linearGradient>
        <radialGradient id={`nv-core-${uid}`} cx="0.5" cy="0.5" r="0.5">
          <stop stopColor="#FFFDF5" />
          <stop offset="0.55" stopColor="#FFE9A8" />
          <stop offset="1" stopColor="#FFC015" stopOpacity="0" />
        </radialGradient>
        {glow && (
          <radialGradient id={`nv-glow-${uid}`} cx="0.5" cy="0.5" r="0.5">
            <stop stopColor="#FFB020" stopOpacity="0.5" />
            <stop offset="1" stopColor="#FFB020" stopOpacity="0" />
          </radialGradient>
        )}
      </defs>
      {glow && <circle cx="12" cy="12" r="12" fill={`url(#nv-glow-${uid})`} />}
      <path
        d="M12 0.5C12.6 6.8 17.2 11.4 23.5 12 17.2 12.6 12.6 17.2 12 23.5 11.4 17.2 6.8 12.6 0.5 12 6.8 11.4 11.4 6.8 12 0.5Z"
        fill={`url(#nv-fill-${uid})`}
      />
      <circle cx="12" cy="12" r="4.6" fill={`url(#nv-core-${uid})`} />
      {spark && (
        <path
          d="M19.2 3C19.4 4.5 19.8 4.9 21.3 5.1 19.8 5.3 19.4 5.7 19.2 7.2 19 5.7 18.6 5.3 17.1 5.1 18.6 4.9 19 4.5 19.2 3Z"
          fill="#FFE07A"
        />
      )}
    </svg>
  );
}

/** Le « O » de NOVA : anneau doré à noyau incandescent, calé sur les capitales. */
function NovaO() {
  return (
    <span
      className="relative inline-grid place-items-center"
      style={{
        width: "0.74em",
        height: "0.74em",
        margin: "0 0.05em",
        // léger relèvement pour matcher le centre optique des capitales
        transform: "translateY(-0.05em)",
      }}
    >
      <span className="absolute inset-0 rounded-full border-[0.12em] border-gold" />
      <span
        className="rounded-full bg-gold"
        style={{
          width: "0.2em",
          height: "0.2em",
          boxShadow: "0 0 0.32em var(--color-gold)",
        }}
      />
    </span>
  );
}

/** Lockup horizontal de la marque : logomark + wordmark « NOVA ». */
export function BrandMark({
  size = "md",
  wordmark = true,
  className,
}: {
  size?: "sm" | "md" | "lg";
  wordmark?: boolean;
  className?: string;
}) {
  const mark = size === "lg" ? 34 : size === "sm" ? 22 : 28;
  const word =
    size === "lg" ? "text-2xl" : size === "sm" ? "text-base" : "text-xl";
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <NovaMark size={mark} spark={size === "lg"} />
      {wordmark && (
        <span
          className={cn(
            "display inline-flex items-center font-bold leading-none tracking-[0.055em] text-white",
            word,
          )}
        >
          N<NovaO />VA
        </span>
      )}
    </div>
  );
}
