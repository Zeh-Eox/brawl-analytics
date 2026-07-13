import { accentHex, type Accent } from "./accent";

/** Jauge circulaire (winrate…). `value` dans [0, 1]. */
export function RadialGauge({
  value,
  label,
  center,
  accent = "success",
  size = 104,
}: {
  value: number;
  label?: string;
  center?: string;
  accent?: Accent;
  size?: number;
}) {
  const r = 42;
  const circ = 2 * Math.PI * r;
  const dash = Math.max(0, Math.min(1, value)) * circ;
  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="10"
        />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={accentHex[accent]}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="display text-2xl text-text">{center}</div>
        {label && (
          <div className="text-[9px] font-semibold uppercase tracking-wide text-muted">
            {label}
          </div>
        )}
      </div>
    </div>
  );
}
