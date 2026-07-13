import { useEffect, useState, type ReactNode } from "react";
import { cn } from "../../utils/cn";

/**
 * Image qui essaie plusieurs URLs (chaîne de repli) avant d'afficher un
 * fallback. Pas de fade d'opacité (qui laissait des vides sur les images en
 * cache) : on affiche l'image directement et on passe à la source suivante
 * seulement en cas d'erreur.
 */
export function CdnIcon({
  srcs,
  alt,
  wrapperClassName,
  fallback,
  fit = "contain",
}: {
  srcs: string[];
  alt: string;
  wrapperClassName?: string;
  fallback: ReactNode;
  fit?: "contain" | "cover";
}) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    setIdx(0);
  }, [srcs.join("|")]);

  const src = srcs[idx];

  return (
    <div className={cn("relative overflow-hidden", wrapperClassName)}>
      {src ? (
        <img
          key={src}
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onError={() => setIdx((i) => i + 1)}
          className={cn(
            "h-full w-full",
            fit === "cover" ? "object-cover" : "object-contain",
          )}
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center">
          {fallback}
        </div>
      )}
    </div>
  );
}
