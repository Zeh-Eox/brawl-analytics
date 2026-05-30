import { motion } from "framer-motion";
import { SearchBar } from "../components/SearchBar";

export function HomePage() {
  return (
    <section className="relative mx-auto max-w-5xl px-4 md:px-6 min-h-[calc(100vh-7rem)] flex flex-col items-center justify-center text-center">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-widest text-text-muted mb-6">
          <span className="pulse-dot text-brand-yellow w-1.5 h-1.5 rounded-full bg-brand-yellow" />
          Stats en direct
        </div>

        <h1 className="display text-5xl md:text-7xl lg:text-8xl leading-[0.95] mb-4">
          <span className="block text-gradient-y">COLLE TON TAG.</span>
          <span className="block text-gradient-m">DÉCOUVRE TES STATS.</span>
        </h1>
        <p className="text-text-muted text-base md:text-lg max-w-xl mx-auto mb-8">
          Trophées, win rate, brawler favori, séries de victoires — tout sur ton
          profil Brawl Stars, instantanément.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.15 }}
        className="w-full flex justify-center"
      >
        <SearchBar variant="hero" autoFocus />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.45 }}
        className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-text-dim"
      >
        <span>Astuce&nbsp;: ton tag est dans ton profil en jeu, après le&nbsp;</span>
        <span className="display text-brand-yellow text-base">#</span>
        <span>—&nbsp;ex.&nbsp;</span>
        <span className="display text-brand-yellow tracking-wider">
          #LGVY0QGP9
        </span>
      </motion.div>
    </section>
  );
}
