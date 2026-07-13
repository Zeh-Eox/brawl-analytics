import type { ReactNode } from "react";
import { cn } from "../../utils/cn";
import {
  IconOverview,
  IconBrawlers,
  IconBattles,
  IconAnalytics,
  IconClub,
  IconBook,
  type IconProps,
} from "../ui/icons";

export interface ProfileTab {
  id: string;
  label: string;
  Icon: (p: IconProps) => ReactNode;
}

export const PROFILE_TABS: ProfileTab[] = [
  { id: "overview", label: "Overview", Icon: IconOverview },
  { id: "brawlers", label: "Brawlers", Icon: IconBrawlers },
  { id: "battles", label: "Battles", Icon: IconBattles },
  { id: "analytics", label: "Analytics", Icon: IconAnalytics },
  { id: "club", label: "Club", Icon: IconClub },
  { id: "guide", label: "Guide", Icon: IconBook },
];

export function ProfileNav({
  active,
  onChange,
}: {
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <>
      {/* Tablette : segmenté horizontal (sur desktop, les onglets passent dans la sidebar) */}
      <div className="hidden gap-1 rounded-2xl border border-line bg-surface/60 p-1.5 md:flex lg:hidden">
        {PROFILE_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors",
              active === t.id
                ? "bg-gold/12 text-gold"
                : "text-text-2 hover:bg-white/5 hover:text-text",
            )}
          >
            <t.Icon size={18} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Mobile : barre du bas fixe */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-app/95 px-1.5 pb-[max(env(safe-area-inset-bottom),8px)] pt-2 backdrop-blur-md md:hidden">
        {PROFILE_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 rounded-lg py-1",
              active === t.id ? "text-gold" : "text-dim",
            )}
          >
            <t.Icon size={20} />
            <span className="text-[9.5px] font-bold tracking-tight">
              {t.label}
            </span>
          </button>
        ))}
      </nav>
    </>
  );
}
