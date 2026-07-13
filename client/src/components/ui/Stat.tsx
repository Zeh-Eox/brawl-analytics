import type { ReactNode } from "react";
import { cn } from "../../utils/cn";
import { accentText, type Accent } from "./accent";

/** Bloc statistique : gros chiffre display + label. */
export function Stat({
  value,
  label,
  sub,
  accent = "neutral",
  align = "left",
  size = "md",
  icon,
  className,
}: {
  value: ReactNode;
  label: ReactNode;
  sub?: ReactNode;
  accent?: Accent;
  align?: "left" | "center";
  size?: "sm" | "md" | "lg";
  icon?: ReactNode;
  className?: string;
}) {
  const valueSize =
    size === "lg" ? "text-4xl" : size === "sm" ? "text-xl" : "text-2xl";
  return (
    <div className={cn(align === "center" && "text-center", className)}>
      {icon && (
        <div
          className={cn(
            "mb-1 flex",
            align === "center" ? "justify-center" : "justify-start",
          )}
        >
          {icon}
        </div>
      )}
      <div className={cn("display leading-none", valueSize, accentText[accent])}>
        {value}
      </div>
      <div className="mt-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </div>
      {sub && <div className="mt-0.5 text-[11px] text-dim">{sub}</div>}
    </div>
  );
}
