import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <section className="mx-auto max-w-xl px-4 py-24 text-center">
      <div className="display text-8xl text-gradient-m mb-2">404</div>
      <p className="text-text-muted mb-6">
        Cette page n'existe pas. Retourne à l'accueil pour chercher un joueur.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 rounded-full bg-brand-yellow text-bg-base font-bold px-5 py-2.5 hover:bg-brand-yellow-soft transition-colors"
      >
        ← Accueil
      </Link>
    </section>
  );
}
