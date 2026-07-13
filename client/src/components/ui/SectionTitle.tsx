import type { ReactNode } from "react";
import { cn } from "../../utils/cn";

export function SectionTitle({
  children,
  className,
  action,
}: {
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 mb-3">
      <h3
        className={cn(
          "text-[11px] font-bold uppercase tracking-[0.14em] text-muted",
          className,
        )}
      >
        {children}
      </h3>
      {action}
    </div>
  );
}
