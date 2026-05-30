import { useState, type ImgHTMLAttributes } from "react";
import { cn } from "../../utils/cn";

interface Props extends Omit<ImgHTMLAttributes<HTMLImageElement>, "className"> {
  /** Class applied to the wrapper (sizing/positioning). */
  wrapperClassName?: string;
  /** Class applied to the <img>. Only set if `fit` doesn't cover your need. */
  className?: string;
  /** Fallback content rendered when the image fails to load. */
  fallback?: React.ReactNode;
  /** object-fit mode. `contain` keeps every pixel visible; `cover` fills. */
  fit?: "contain" | "cover";
}

/**
 * Image with shimmer placeholder while loading and a graceful fallback when
 * the upstream asset 404s (some brawler/skin IDs aren't on the CDN yet).
 */
export function Img({
  src,
  alt,
  wrapperClassName,
  className,
  fallback,
  loading = "lazy",
  fit = "contain",
  ...rest
}: Props) {
  const [state, setState] = useState<"loading" | "loaded" | "error">(
    src ? "loading" : "error",
  );

  return (
    <div className={cn("relative overflow-hidden", wrapperClassName)}>
      {state === "loading" && (
        <div className="absolute inset-0 shimmer bg-white/5" />
      )}
      {state !== "error" && src ? (
        <img
          src={src}
          alt={alt ?? ""}
          loading={loading}
          decoding="async"
          onLoad={() => setState("loaded")}
          onError={() => setState("error")}
          className={cn(
            "w-full h-full transition-opacity duration-200",
            fit === "cover" ? "object-cover" : "object-contain",
            state === "loaded" ? "opacity-100" : "opacity-0",
            className,
          )}
          {...rest}
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center text-text-dim text-xs select-none">
          {fallback ?? "—"}
        </div>
      )}
    </div>
  );
}
