import { Img } from "./Img";
import { cn } from "../../utils/cn";
import { cdn } from "../../utils/cdn";

/** Avatar joueur : icône CDN Brawlify avec repli sur les initiales. */
export function Avatar({
  iconId,
  name,
  className,
  rounded = "rounded-2xl",
}: {
  iconId?: number;
  name: string;
  className?: string;
  rounded?: string;
}) {
  const initials = name.replace(/[^\p{L}\p{N}]/gu, "").slice(0, 2).toUpperCase();
  return (
    <Img
      src={iconId ? cdn.playerIcon(iconId) : undefined}
      alt={name}
      fit="cover"
      wrapperClassName={cn(
        "bg-surface-2 grid place-items-center",
        rounded,
        className,
      )}
      fallback={
        <span className="display text-gold text-[0.9em]">{initials || "?"}</span>
      }
    />
  );
}
