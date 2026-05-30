import { useLocation } from "react-router-dom";
import { Logo } from "./ui/Logo";
import { SearchBar } from "./SearchBar";

export function TopBar() {
  const { pathname } = useLocation();
  // Hide the inline search on the landing page — it's already the hero.
  const isHome = pathname === "/";

  return (
    <header className="sticky top-0 z-20 backdrop-blur-md bg-bg-base/70 border-b border-white/5">
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-3 flex items-center gap-4">
        <Logo />
        {!isHome && (
          <div className="ml-auto flex-1 max-w-md hidden sm:block">
            <SearchBar variant="compact" />
          </div>
        )}
      </div>
    </header>
  );
}
