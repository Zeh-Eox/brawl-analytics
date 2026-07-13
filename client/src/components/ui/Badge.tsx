import type { ReactNode } from "react";
import { cn } from "../../utils/cn";
import { accentText, accentBgSoft, accentBorderSoft, type Accent } from "./accent";

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: Accent;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-bold",
        accentText[tone],
        accentBgSoft[tone],
        accentBorderSoft[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
