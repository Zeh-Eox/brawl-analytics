import { Link } from "react-router-dom";

export function Logo({ to = "/" }: { to?: string }) {
  return (
    <Link
      to={to}
      className="group inline-flex items-center gap-2.5 leading-none select-none"
    >
      <span className="relative grid place-items-center w-9 h-9 rounded-lg bg-gradient-to-br from-brand-yellow to-brand-magenta text-bg-base font-black text-lg shadow-[0_4px_18px_-2px_rgba(255,192,21,0.55)] group-hover:scale-105 transition-transform">
        BA
      </span>
      <span className="display text-xl tracking-tight">
        <span className="text-gradient-y">BRAWL</span>
        <span className="text-text-base">ANALYTICS</span>
      </span>
    </Link>
  );
}
