import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <section className="mx-auto max-w-xl px-4 py-24 text-center">
      <div className="display mb-2 text-7xl text-gold">404</div>
      <p className="mb-6 text-text-2">
        Cette page n'existe pas. Retourne à l'accueil pour chercher un joueur.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 rounded-xl bg-gold px-5 py-2.5 font-black text-app hover:bg-gold-soft"
      >
        ← Accueil
      </Link>
    </section>
  );
}
