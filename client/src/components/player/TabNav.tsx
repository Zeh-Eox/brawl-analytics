import { motion } from "framer-motion";
import { cn } from "../../utils/cn";

export interface Tab {
  id: string;
  label: string;
  hint?: string;
}

export function TabNav({
  tabs,
  active,
  onChange,
}: {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <nav className="sticky top-16 z-10 -mx-4 md:-mx-6 px-4 md:px-6 bg-gradient-to-b from-bg-base/95 to-bg-base/70 backdrop-blur-md border-b border-white/5">
      <div
        role="tablist"
        aria-label="Sections du profil"
        className="flex gap-1 overflow-x-auto no-scrollbar py-2"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              className={cn(
                "relative shrink-0 px-4 py-2 rounded-full text-sm font-semibold uppercase tracking-wider transition-colors",
                isActive
                  ? "text-bg-base"
                  : "text-text-muted hover:text-text-base",
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="active-tab-pill"
                  className="absolute inset-0 rounded-full bg-brand-yellow glow-yellow"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative inline-flex items-center gap-2">
                {tab.label}
                {tab.hint && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 text-[10px] font-bold",
                      isActive
                        ? "bg-bg-base/15 text-bg-base"
                        : "bg-white/10 text-text-muted",
                    )}
                  >
                    {tab.hint}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
