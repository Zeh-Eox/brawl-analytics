import type { HTMLAttributes } from "react";
import { cn } from "../../utils/cn";

interface Props extends HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
  padding?: "sm" | "md" | "lg";
}

const PADDING: Record<NonNullable<Props["padding"]>, string> = {
  sm: "p-3",
  md: "p-4 md:p-5",
  lg: "p-5 md:p-7",
};

export function Card({
  elevated = false,
  padding = "md",
  className,
  children,
  ...rest
}: Props) {
  return (
    <div
      className={cn(
        elevated ? "surface-elevated" : "surface",
        PADDING[padding],
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
