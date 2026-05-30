import type { ReactNode } from "react";
import { cn } from "../../utils/cn";

type Tone = "neutral" | "yellow" | "magenta" | "cyan" | "violet" | "success" | "danger" | "warning";

const TONES: Record<Tone, string> = {
  neutral: "bg-white/8 text-text-muted border-white/10",
  yellow:
    "bg-brand-yellow/12 text-brand-yellow-soft border-brand-yellow/40",
  magenta:
    "bg-brand-magenta/15 text-brand-magenta border-brand-magenta/40",
  cyan: "bg-brand-cyan/12 text-brand-cyan border-brand-cyan/40",
  violet:
    "bg-brand-violet/15 text-brand-violet border-brand-violet/40",
  success: "bg-success/15 text-success border-success/40",
  danger: "bg-danger/15 text-danger border-danger/40",
  warning: "bg-warning/15 text-warning border-warning/40",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide leading-none",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
