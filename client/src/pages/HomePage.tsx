import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { SearchBar } from "../components/SearchBar";
import { Avatar } from "../components/ui/Avatar";
import { loadFavorites } from "../utils/favorites";
import { loadRecents } from "../utils/recents";
import { displayTag } from "../utils/tag";
import { fmtCompact } from "../utils/format";
import {
  IconTrophy,
  IconTarget,
  IconBolt,
  IconFire,
  IconMedal,
  IconSearch,
  IconBroadcast,
  IconSwords,
} from "../components/ui/icons";

const ONBOARD_KEY = "nova:onboarding-dismissed";

export function HomePage() {
  const navigate = useNavigate();
  const favorites = loadFavorites();
  const recents = loadRecents();
  const hasHistory = favorites.length > 0 || recents.length > 0;
  const [showOnboarding, setShowOnboarding] = useState(
    () => localStorage.getItem(ONBOARD_KEY) !== "1",
  );
  const dismissOnboarding = () => {
    localStorage.setItem(ONBOARD_KEY, "1");
    setShowOnboarding(false);
  };

  return (
    <section className="py-4 lg:py-10">
      <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
        {/* ---- Colonne gauche : accroche + recherche ---- */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="pill mb-5 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-text-2">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-gold [animation:pulse-dot_1.8s_ease-in-out_infinite]" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-gold" />
            </span>
            Stats en direct
          </div>

          <h1 className="display text-[2.6rem] leading-[1.04] tracking-tight text-white md:text-6xl">
            Colle ton tag.
            <br />
            <span className="text-gold-grad">Vois tout.</span>
          </h1>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-text-2">
            Profil, brawlers, combats, classements & événements en direct. Pas
            de blabla — juste tes stats.
          </p>

          <div className="mt-7">
            <SearchBar variant="hero" autoFocus />
          </div>

          <div className="mt-7">
            {hasHistory ? (
              <div className="flex flex-col gap-4">
                {favorites.length > 0 && (
                  <div>
                    <Label>Épinglés</Label>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {favorites.slice(0, 4).map((f) => (
                        <button
                          key={f.tag}
                          onClick={() => navigate(`/player/${f.tag}`)}
                          className="flex items-center gap-3 rounded-xl border border-gold/15 bg-gradient-to-r from-gold/8 to-transparent px-3 py-2 text-left card-hover"
                        >
                          <Avatar
                            iconId={f.iconId}
                            name={f.name}
                            rounded="rounded-lg"
                            className="h-9 w-9 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-[13px] font-bold text-text">
                              {f.name}
                            </div>
                            <div className="font-mono text-[11px] text-dim">
                              {displayTag(f.tag)}
                            </div>
                          </div>
                          {typeof f.trophies === "number" && (
                            <span className="display text-[13px] text-gold">
                              <span className="inline-flex items-center gap-0.5"><IconTrophy size={13} />{fmtCompact(f.trophies)}</span>
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {recents.length > 0 && (
                  <div>
                    <Label>Récents</Label>
                    <div className="flex flex-wrap gap-2">
                      {recents.map((r) => (
                        <button
                          key={r.tag}
                          onClick={() => navigate(`/player/${r.tag}`)}
                          className="flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 card-hover"
                        >
                          {r.name && (
                            <span className="text-[13px] font-semibold text-text">
                              {r.name}
                            </span>
                          )}
                          <span className="font-mono text-[11px] text-dim">
                            {displayTag(r.tag)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex max-w-md gap-3 rounded-2xl border border-dashed border-line-strong bg-surface/40 p-4">
                <div className="text-gold"><IconTarget size={24} /></div>
                <div>
                  <div className="mb-1 text-sm font-bold text-text">
                    Où trouver ton tag ?
                  </div>
                  <div className="text-[12.5px] leading-relaxed text-text-2">
                    Dans Brawl Stars → touche ton profil en haut à gauche. Le
                    tag est sous ton pseudo (il commence par{" "}
                    <span className="font-mono text-gold">#</span>).
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* ---- Colonne droite : aperçu décoratif (desktop) ---- */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
          className="relative hidden lg:block"
        >
          <HeroPreview />
        </motion.div>
      </div>

      {showOnboarding && (
        <Onboarding onDismiss={dismissOnboarding} />
      )}
    </section>
  );
}

/** Bande explicative « comment ça marche », masquable. */
function Onboarding({ onDismiss }: { onDismiss: () => void }) {
  const steps = [
    {
      Icon: IconSearch,
      title: "Colle ton tag",
      text: "Ton profil complet en un instant : brawlers, combats, classements.",
    },
    {
      Icon: IconBroadcast,
      title: "L'historique grandit",
      text: "Chaque visite enrichit tes stats — la capture serveur les suit même hors ligne.",
    },
    {
      Icon: IconSwords,
      title: "Compare & partage",
      text: "Confronte deux joueurs et partage une carte de stats en un clic.",
    },
  ];
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="relative mt-10 rounded-2xl border border-line bg-surface/50 p-5 lg:mt-14"
    >
      <button
        onClick={onDismiss}
        aria-label="Masquer"
        className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-lg text-dim hover:bg-white/5 hover:text-text"
      >
        ✕
      </button>
      <div className="mb-4 text-[11px] font-bold uppercase tracking-widest text-dim">
        Comment ça marche
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {steps.map((s, i) => (
          <div key={s.title} className="flex gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-line bg-surface-2 text-gold">
              <s.Icon size={19} />
            </div>
            <div className="min-w-0">
              <div className="text-[13px] font-bold text-text">
                <span className="text-dim">{i + 1}. </span>
                {s.title}
              </div>
              <div className="mt-0.5 text-[12px] leading-relaxed text-text-2">
                {s.text}
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/** Panneau décoratif : faux aperçu de profil pour remplir la colonne droite. */
function HeroPreview() {
  return (
    <div className="relative mx-auto max-w-sm">
      <div className="pointer-events-none absolute -left-8 -top-6 h-40 w-40 rounded-full bg-violet/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-8 -right-6 h-44 w-44 rounded-full bg-gold/15 blur-3xl" />

      <div className="surface relative rotate-[-2deg] p-5 [animation:float-slow_6s_ease-in-out_infinite]">
        <div className="flex items-center gap-3">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-cyan to-violet text-app">
            <IconBolt size={26} />
          </div>
          <div>
            <div className="display text-lg text-white">Pro Player</div>
            <div className="font-mono text-[11px] text-dim">#8QRPPCLR</div>
          </div>
          <span className="ml-auto inline-flex items-center gap-1 rounded-md bg-gold/12 px-2 py-1 text-[9px] font-bold text-gold">
            <IconMedal size={11} /> CHAMP
          </span>
        </div>

        <div className="mt-4 rounded-2xl border border-gold/25 bg-gradient-to-br from-gold/14 to-transparent p-4">
          <div className="text-[10px] font-bold uppercase tracking-widest text-gold">
            Trophées
          </div>
          <div className="display flex items-center gap-2 text-4xl text-gold"><IconTrophy size={30} /> 73 743</div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          {[
            { v: "64%", l: "Winrate", c: "text-success" },
            { v: "104", l: "Brawlers", c: "text-cyan" },
            { v: "262", l: "Niveau", c: "text-violet" },
          ].map((s) => (
            <div
              key={s.l}
              className="rounded-xl border border-line bg-app/60 px-2 py-2.5 text-center"
            >
              <div className={`display text-lg ${s.c}`}>{s.v}</div>
              <div className="text-[9px] font-semibold uppercase tracking-wide text-muted">
                {s.l}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="surface absolute -bottom-6 -left-6 w-40 rotate-[3deg] p-3 [animation:float-slow_7s_ease-in-out_infinite]">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-magenta/20 text-magenta">
            <IconFire size={16} />
          </div>
          <div>
            <div className="display text-sm text-magenta">Série de 5</div>
            <div className="text-[9px] text-dim">victoires d'affilée</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2.5 flex items-center gap-2">
      <span className="text-[11px] font-bold uppercase tracking-widest text-dim">
        {children}
      </span>
      <div className="h-px flex-1 bg-line" />
    </div>
  );
}
