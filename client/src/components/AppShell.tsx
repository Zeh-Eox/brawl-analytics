import type { ReactNode } from "react";
import {
  Link,
  useLocation,
  useMatch,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { BrandMark } from "./ui/BrandMark";
import { SearchBar } from "./SearchBar";
import { PROFILE_TABS } from "./player/ProfileNav";
import { cn } from "../utils/cn";

const S = {
  stroke: 1.8,
  props: {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  },
};

const IconHome = () => (
  <svg {...S.props}>
    <path d="M3 10.2 12 3l9 7.2" />
    <path d="M5 9.5V21h5v-6h4v6h5V9.5" />
  </svg>
);
const IconCompass = () => (
  <svg {...S.props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M15.5 8.5 13 13l-4.5 2.5L11 11z" />
  </svg>
);
const IconCompare = () => (
  <svg {...S.props}>
    <path d="M4 7h11M4 7l3-3M4 7l3 3" />
    <path d="M20 17H9m11 0-3-3m3 3-3 3" />
  </svg>
);

interface NavItem {
  to: string;
  label: string;
  Icon: () => ReactNode;
  match: (path: string) => boolean;
}

const NAV: NavItem[] = [
  { to: "/", label: "Accueil", Icon: IconHome, match: (p) => p === "/" || p.startsWith("/player") },
  { to: "/discover", label: "Découvrir", Icon: IconCompass, match: (p) => p.startsWith("/discover") },
  { to: "/compare", label: "Comparer", Icon: IconCompare, match: (p) => p.startsWith("/compare") },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // Sur desktop, les onglets du profil vivent dans la sidebar (une seule
  // colonne de navigation) — pilotés par l'URL, comme dans PlayerPage.
  const playerMatch = useMatch("/player/:tag");
  const [params, setParams] = useSearchParams();
  const activeTab =
    PROFILE_TABS.find((t) => t.id === params.get("tab"))?.id ?? "overview";
  const setTab = (id: string) => {
    const next = new URLSearchParams(params);
    if (id === "overview") next.delete("tab");
    else next.set("tab", id);
    setParams(next, { replace: true });
  };

  return (
    <div className="min-h-full lg:pl-64">
      {/* ---------- Sidebar (desktop) ---------- */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col overflow-y-auto border-r border-line bg-app/60 px-4 py-6 backdrop-blur-xl lg:flex">
        <Link to="/" className="px-1.5">
          <BrandMark size="lg" />
        </Link>

        <div className="mt-6">
          <SearchBar variant="compact" />
        </div>

        <div className="mb-2 mt-7 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-dim">
          Navigation
        </div>
        <nav className="flex flex-col gap-1">
          {NAV.map(({ to, label, Icon, match }) => {
            const active = match(pathname);
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-semibold transition-colors",
                  active
                    ? "bg-gold/10 text-gold"
                    : "text-text-2 hover:bg-white/[0.04] hover:text-text",
                )}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r bg-gold" />
                )}
                <span className={active ? "text-gold" : "text-muted group-hover:text-text"}>
                  <Icon />
                </span>
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Sections du profil (uniquement sur une page joueur) */}
        {playerMatch && (
          <>
            <div className="mb-2 mt-6 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-dim">
              Profil
            </div>
            <nav className="flex flex-col gap-1">
              {PROFILE_TABS.map((t) => {
                const active = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-semibold transition-colors",
                      active
                        ? "bg-gold/10 text-gold"
                        : "text-text-2 hover:bg-white/[0.04] hover:text-text",
                    )}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r bg-gold" />
                    )}
                    <span
                      className={
                        active ? "text-gold" : "text-muted group-hover:text-text"
                      }
                    >
                      <t.Icon size={20} />
                    </span>
                    {t.label}
                  </button>
                );
              })}
            </nav>
          </>
        )}

        <div className="mt-auto border-t border-line pt-4 text-[11px] leading-relaxed text-dim">
          Données via l'API Brawl Stars.
          <br />
          Projet non affilié à Supercell.
        </div>
      </aside>

      {/* ---------- Top bar (mobile) ---------- */}
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-app/85 px-4 py-3 backdrop-blur-md lg:hidden">
        <Link to="/" className="shrink-0">
          <BrandMark wordmark={false} />
        </Link>
        <div className="min-w-0 flex-1">
          <SearchBar variant="compact" />
        </div>
        <button
          aria-label="Découvrir"
          onClick={() => navigate("/discover")}
          className={cn(
            "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
            pathname.startsWith("/discover")
              ? "bg-gold/12 text-gold"
              : "bg-white/5 text-text-2",
          )}
        >
          <IconCompass />
        </button>
      </header>

      {/* ---------- Content ---------- */}
      <main className="mx-auto w-full max-w-6xl px-4 py-6 pb-24 md:px-6 lg:pb-12">
        {children}
      </main>
    </div>
  );
}
