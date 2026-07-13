import type { ReactNode } from "react";
import { cn } from "../../utils/cn";

const PAD = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-5",
} as const;

export function Card({
  children,
  className,
  padding = "md",
  hover = false,
}: {
  children: ReactNode;
  className?: string;
  padding?: keyof typeof PAD;
  hover?: boolean;
}) {
  return (
    <div
      className={cn("surface", PAD[padding], hover && "card-hover", className)}
    >
      {children}
    </div>
  );
}
