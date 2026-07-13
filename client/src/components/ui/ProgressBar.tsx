import { cn } from "../../utils/cn";
import { accentFill, type Accent } from "./accent";

/** Barre de progression. `value` dans [0, 1]. */
export function ProgressBar({
  value,
  accent = "gold",
  className,
  gradient = false,
}: {
  value: number;
  accent?: Accent;
  className?: string;
  gradient?: boolean;
}) {
  const pct = Math.max(0, Math.min(100, value * 100));
  return (
    <div
      className={cn("h-2 overflow-hidden rounded-full bg-white/7", className)}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-500",
          gradient
            ? "bg-gradient-to-r from-gold to-magenta"
            : accentFill[accent],
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
