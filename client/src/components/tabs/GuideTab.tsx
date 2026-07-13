import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "../../utils/cn";
import {
  IconSearch,
  IconStar,
  IconSwords,
  IconShare,
  IconOverview,
  IconBrawlers,
  IconBattles,
  IconAnalytics,
  IconGlobe,
  IconBroadcast,
  IconDownload,
  IconTrophy,
  IconController,
  IconArrowRight,
  IconCheck,
  IconWarning,
  IconBook,
} from "../ui/icons";

interface Chapter {
  id: string;
  Icon: (p: { size?: number }) => ReactNode;
  title: string;
  tagline: string;
  demo?: ReactNode;
  points: ReactNode[];
  cta?: { label: string; run: () => void };
}

export function GuideTab({
  onNavigateTab,
}: {
  onNavigateTab: (id: string) => void;
}) {
  const navigate = useNavigate();
  const [active, setActive] = useState("intro");

  const chapters: Chapter[] = useMemo(
    () => [
      {
        id: "intro",
        Icon: IconBook,
        title: "Bienvenue sur NOVA",
        tagline: "Tes stats Brawl Stars, sans blabla ni landing.",
        demo: (
          <PreviewFrame label="Aperçu">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-gold/12 text-gold">
                <IconTrophy size={22} />
              </div>
              <div>
                <div className="display text-base text-white">Colle ton tag, vois tout</div>
                <div className="text-[12px] text-text-2">
                  Profil, brawlers, combats, progression, classements, comparaison.
                </div>
              </div>
            </div>
          </PreviewFrame>
        ),
        points: [
          "Ce guide t'explique chaque écran de l'app, avec un aperçu à l'appui.",
          "Utilise la navigation à gauche (ou les puces en haut sur mobile) pour sauter à une section.",
          <>Chaque section a un bouton <b className="text-gold">Ouvrir</b> qui t'y emmène directement.</>,
        ],
      },
      {
        id: "search",
        Icon: IconSearch,
        title: "Recherche & accueil",
        tagline: "Le point d'entrée : ton tag de joueur.",
        demo: (
          <PreviewFrame label="Barre de recherche">
            <div className="flex items-center gap-2 rounded-xl border border-line-strong bg-surface-2 px-3 py-2.5">
              <span className="display text-gold">#</span>
              <span className="font-mono text-[13px] uppercase tracking-wider text-dim">
                TON TAG
              </span>
              <span className="ml-auto grid h-7 w-7 place-items-center rounded-lg bg-gold text-app">
                <IconArrowRight size={15} />
              </span>
            </div>
          </PreviewFrame>
        ),
        points: [
          <>Ton tag se trouve dans Brawl Stars, sous ton pseudo (il commence par <span className="font-mono text-gold">#</span>).</>,
          "Les joueurs consultés récemment et tes favoris épinglés s'affichent sur l'accueil pour y revenir en un clic.",
          "La saisie est validée en direct : un tag invalide est signalé avant l'envoi.",
        ],
        cta: { label: "Aller à l'accueil", run: () => navigate("/") },
      },
      {
        id: "profile",
        Icon: IconStar,
        title: "En-tête de profil",
        tagline: "Trophées, record, niveau — et les actions rapides.",
        demo: (
          <PreviewFrame label="Actions du profil">
            <div className="flex gap-2">
              <ActionChip icon={<IconStar size={16} filled />} label="Épingler" tone="gold" />
              <ActionChip icon={<IconSwords size={16} />} label="Comparer" />
              <ActionChip icon={<IconShare size={16} />} label="Partager" />
            </div>
          </PreviewFrame>
        ),
        points: [
          <><b className="text-gold">Épingler</b> ajoute le joueur à tes favoris (accueil).</>,
          <><b className="text-text">Comparer</b> ouvre un face-à-face avec un autre joueur.</>,
          <><b className="text-text">Partager</b> génère une carte de stats (PNG) et un lien direct copiable.</>,
        ],
      },
      {
        id: "overview",
        Icon: IconOverview,
        title: "Onglet Overview",
        tagline: "La synthèse : l'essentiel en un écran.",
        demo: (
          <PreviewFrame label="Depuis ta dernière visite">
            <div className="grid grid-cols-2 gap-3">
              <MiniStat value="+140" label="Trophées" tone="text-success" />
              <MiniStat value="6 / 2" label="V / D" tone="text-text" />
            </div>
          </PreviewFrame>
        ),
        points: [
          <><b className="text-gold">Depuis ta dernière visite</b> : le delta de trophées, victoires et brawlers depuis ton dernier passage (≥ 30 min).</>,
          "Victoires 3v3 / solo / duo, collection & détail du kit, brawler du moment, records personnels.",
          "Bloc temps de jeu : temps suivi (réel, cumulé) + estimation à vie (grossière, l'API ne donne pas le vrai temps de jeu).",
        ],
        cta: { label: "Ouvrir Overview", run: () => onNavigateTab("overview") },
      },
      {
        id: "brawlers",
        Icon: IconBrawlers,
        title: "Brawlers & fiche détail",
        tagline: "Ta collection, et le détail de chaque brawler.",
        demo: (
          <PreviewFrame label="Grille de brawlers">
            <div className="flex gap-2">
              {["SP", "CO", "AM", "ED"].map((s) => (
                <div
                  key={s}
                  className="grid h-11 w-11 place-items-center rounded-xl border border-line bg-surface-2 text-[11px] font-bold text-gold"
                >
                  {s}
                </div>
              ))}
            </div>
          </PreviewFrame>
        ),
        points: [
          "Grille triable ; clique un brawler pour ouvrir sa fiche détaillée.",
          "La fiche montre rareté/classe, une barre de power, et les stats numériques scalées à ton niveau réel (santé/attaque/super).",
          <>Descriptions officielles (attaque, super, hypercharge, star powers, gadgets). La fiche est <b className="text-gold">partageable par lien</b> (<span className="font-mono text-[11px]">?brawler=&lt;id&gt;</span>).</>,
        ],
        cta: { label: "Ouvrir Brawlers", run: () => onNavigateTab("brawlers") },
      },
      {
        id: "battles",
        Icon: IconBattles,
        title: "Battles : filtres & sessions",
        tagline: "Tes combats façon BATTLE LOG, filtrables.",
        demo: <BattlesFilterDemo />,
        points: [
          "Affichage type jeu : layout VS avec portraits, icône de mode + vignette de map, durée, star player.",
          <>Filtre par <b className="text-text">résultat</b>, <b className="text-text">mode</b> ou <b className="text-text">brawler</b> joué (essaie les puces ci-dessus).</>,
          <>Bascule <b className="text-gold">Sessions</b> : regroupe les combats par session de jeu, avec récap V-D, delta trophées et durée.</>,
        ],
        cta: { label: "Ouvrir Battles", run: () => onNavigateTab("battles") },
      },
      {
        id: "analytics",
        Icon: IconAnalytics,
        title: "Analytics & progression",
        tagline: "Les tendances + la courbe de trophées.",
        demo: (
          <PreviewFrame label="Progression">
            <div className="flex items-end gap-1.5">
              {[30, 44, 38, 56, 62, 50, 72].map((h, i) => (
                <div
                  key={i}
                  className="w-4 rounded-t bg-gold/70"
                  style={{ height: `${h}px` }}
                />
              ))}
            </div>
          </PreviewFrame>
        ),
        points: [
          "Win rate, plus longue série, Star Player, Δ trophées, perf par brawler, meilleures/pires maps, winrate par mode, insights auto.",
          <>En haut : la <b className="text-gold">progression des trophées dans le temps</b> (ex-onglet Historique, désormais intégré ici) avec plages 7 j / 30 j / tout et deltas 24 h & 7 j.</>,
          "Le bloc temps de jeu détaille le suivi et l'estimation à vie.",
        ],
        cta: { label: "Ouvrir Analytics", run: () => onNavigateTab("analytics") },
      },
      {
        id: "tracking",
        Icon: IconBroadcast,
        title: "Suivi en arrière-plan",
        tagline: "L'historique qui grandit même hors connexion.",
        demo: (
          <PreviewFrame label="Statut du suivi">
            <div className="flex items-center gap-3">
              <span className="text-success">
                <IconBroadcast size={20} />
              </span>
              <div>
                <div className="text-[13px] font-bold text-text">Suivi actif</div>
                <div className="text-[11px] text-text-2">
                  128 points capturés · dernière capture il y a 8 min
                </div>
              </div>
            </div>
          </PreviewFrame>
        ),
        points: [
          "L'API ne renvoie que 25 combats et aucun historique de trophées. Le serveur (proxy) capture régulièrement tes combats et tes trophées pour combler ce trou.",
          <>S'active tout seul quand tu ouvres un profil ; le statut est visible en haut de <b className="text-text">Analytics</b>.</>,
          <span className="text-text-2"><IconWarning size={13} className="mr-1 inline align-[-2px] text-gold" />La capture n'avance <b className="text-text">que si le proxy tourne</b> et depuis l'IP autorisée par ta clé API.</span>,
        ],
        cta: { label: "Voir le suivi (Analytics)", run: () => onNavigateTab("analytics") },
      },
      {
        id: "discover",
        Icon: IconGlobe,
        title: "Découvrir & Comparer",
        tagline: "Au-delà de ton profil.",
        demo: (
          <PreviewFrame label="Ailleurs dans l'app">
            <div className="flex gap-2">
              <ActionChip icon={<IconGlobe size={16} />} label="Découvrir" />
              <ActionChip icon={<IconSwords size={16} />} label="Comparer" />
            </div>
          </PreviewFrame>
        ),
        points: [
          <><b className="text-text">Découvrir</b> : rotation d'événements en cours (modes + maps) et classements joueurs/clubs par pays.</>,
          <><b className="text-text">Comparer</b> : face-à-face de deux joueurs — cartes avec meneur, scoreboard « domination » et écarts chiffrés.</>,
          "Dans un combat, clique n'importe quel joueur pour ouvrir son profil.",
        ],
        cta: { label: "Ouvrir Découvrir", run: () => navigate("/discover") },
      },
      {
        id: "pwa",
        Icon: IconDownload,
        title: "Installer NOVA (PWA)",
        tagline: "Sur ton écran d'accueil, et hors-ligne.",
        demo: (
          <PreviewFrame label="Installation">
            <div className="flex items-center gap-3 text-[13px] text-text-2">
              <IconDownload size={20} className="text-gold" />
              Menu du navigateur →{" "}
              <b className="text-text">Installer l'application</b>
            </div>
          </PreviewFrame>
        ),
        points: [
          "NOVA est une PWA : installe-la depuis le menu de ton navigateur (mobile ou desktop) pour l'ouvrir comme une app.",
          "Les images (brawlers, maps…) et l'interface sont mises en cache : navigation plus rapide et consultation possible hors-ligne.",
          "Les données de combat restent en direct : elles nécessitent une connexion au proxy.",
        ],
      },
    ],
    [navigate, onNavigateTab],
  );

  const chapter = chapters.find((c) => c.id === active) ?? chapters[0]!;
  const index = chapters.findIndex((c) => c.id === chapter.id);

  // Recentre la puce active dans la barre de chapitres (mobile : défilement
  // horizontal). On scrolle uniquement la barre — jamais la page verticalement.
  const navRef = useRef<HTMLElement>(null);
  const activeChipRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const nav = navRef.current;
    const chip = activeChipRef.current;
    if (!nav || !chip) return;
    const navRect = nav.getBoundingClientRect();
    const chipRect = chip.getBoundingClientRect();
    const delta =
      chipRect.left - navRect.left + chip.clientWidth / 2 - nav.clientWidth / 2;
    nav.scrollBy({ left: delta, behavior: "smooth" });
  }, [active]);

  return (
    <div className="lg:grid lg:grid-cols-[220px_1fr] lg:items-start lg:gap-5">
      {/* Navigation des chapitres */}
      <nav
        ref={navRef}
        className="mb-4 flex gap-2 overflow-x-auto no-scrollbar pb-1 lg:mb-0 lg:flex-col lg:overflow-visible lg:pb-0 lg:sticky lg:top-4"
      >
        {chapters.map((c) => (
          <button
            key={c.id}
            ref={c.id === chapter.id ? activeChipRef : undefined}
            onClick={() => setActive(c.id)}
            className={cn(
              "flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13px] font-bold transition-colors lg:w-full",
              c.id === chapter.id
                ? "bg-gold/12 text-gold"
                : "text-text-2 hover:bg-white/5 hover:text-text",
            )}
          >
            <c.Icon size={17} />
            <span className="whitespace-nowrap">{c.title}</span>
          </button>
        ))}
      </nav>

      {/* Contenu du chapitre */}
      <AnimatePresence mode="wait">
        <motion.div
          key={chapter.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18 }}
          className="rounded-2xl border border-line bg-surface p-5"
        >
          <div className="mb-4 flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gold/12 text-gold">
              <chapter.Icon size={22} />
            </div>
            <div>
              <div className="display text-lg text-white">{chapter.title}</div>
              <div className="text-[13px] text-text-2">{chapter.tagline}</div>
            </div>
            <span className="ml-auto shrink-0 rounded-lg bg-white/6 px-2 py-1 font-mono text-[11px] text-dim">
              {index + 1}/{chapters.length}
            </span>
          </div>

          {chapter.demo && <div className="mb-4">{chapter.demo}</div>}

          <ul className="space-y-2.5">
            {chapter.points.map((p, i) => (
              <li key={i} className="flex gap-2.5 text-[13.5px] leading-relaxed text-text-2">
                <span className="mt-0.5 shrink-0 text-gold">
                  <IconCheck size={15} />
                </span>
                <span>{p}</span>
              </li>
            ))}
          </ul>

          <div className="mt-5 flex items-center gap-2">
            {chapter.cta && (
              <button
                onClick={chapter.cta.run}
                className="inline-flex items-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-[13px] font-black text-app"
              >
                {chapter.cta.label}
                <IconArrowRight size={16} />
              </button>
            )}
            <div className="ml-auto flex gap-2">
              <NavArrow
                disabled={index === 0}
                onClick={() => setActive(chapters[index - 1]!.id)}
                label="Précédent"
              />
              <NavArrow
                disabled={index === chapters.length - 1}
                onClick={() => setActive(chapters[index + 1]!.id)}
                label="Suivant"
                next
              />
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Aperçus & briques réutilisables                                     */
/* ------------------------------------------------------------------ */

/** Cadre « aperçu » façon fenêtre, pour illustrer un morceau d'UI. */
function PreviewFrame({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-app/50">
      <div className="flex items-center gap-1.5 border-b border-line px-3 py-1.5">
        <span className="h-2 w-2 rounded-full bg-danger/60" />
        <span className="h-2 w-2 rounded-full bg-gold/60" />
        <span className="h-2 w-2 rounded-full bg-success/60" />
        <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-dim">
          {label}
        </span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function ActionChip({
  icon,
  label,
  tone,
}: {
  icon: ReactNode;
  label: string;
  tone?: "gold";
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[12px] font-bold",
        tone === "gold"
          ? "border-gold/40 bg-gold/12 text-gold"
          : "border-line bg-surface-2 text-text-2",
      )}
    >
      {icon}
      {label}
    </div>
  );
}

function MiniStat({ value, label, tone }: { value: string; label: string; tone: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-center">
      <div className={cn("display text-xl", tone)}>{value}</div>
      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </div>
    </div>
  );
}

function NavArrow({
  disabled,
  onClick,
  label,
  next,
}: {
  disabled: boolean;
  onClick: () => void;
  label: string;
  next?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="grid h-9 w-9 place-items-center rounded-xl border border-line bg-surface-2 text-text-2 transition-colors hover:text-text disabled:opacity-30"
    >
      <IconArrowRight
        size={16}
        className={next ? undefined : "rotate-180"}
      />
    </button>
  );
}

/** Démo fonctionnelle des filtres de l'onglet Battles. */
const SAMPLE = [
  { id: 1, mode: "Brawl Ball", out: "victory" as const },
  { id: 2, mode: "Gem Grab", out: "defeat" as const },
  { id: 3, mode: "Knockout", out: "victory" as const },
  { id: 4, mode: "Showdown", out: "victory" as const },
  { id: 5, mode: "Bounty", out: "defeat" as const },
];

function BattlesFilterDemo() {
  const [f, setF] = useState<"all" | "victory" | "defeat">("all");
  const rows = SAMPLE.filter((s) => f === "all" || s.out === f);
  const chips: { id: typeof f; label: string }[] = [
    { id: "all", label: "Tous" },
    { id: "victory", label: "Victoires" },
    { id: "defeat", label: "Défaites" },
  ];
  return (
    <PreviewFrame label="Filtres (interactif)">
      <div className="mb-3 flex rounded-xl border border-line bg-surface-2 p-0.5">
        {chips.map((c) => (
          <button
            key={c.id}
            onClick={() => setF(c.id)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-[12px] font-bold transition-colors",
              f === c.id
                ? c.id === "victory"
                  ? "bg-success/15 text-success"
                  : c.id === "defeat"
                    ? "bg-danger/15 text-danger"
                    : "bg-gold/15 text-gold"
                : "text-dim hover:text-text-2",
            )}
          >
            {c.label}
          </button>
        ))}
      </div>
      <div className="space-y-1.5">
        {rows.map((r) => (
          <div
            key={r.id}
            className="flex items-center gap-2.5 rounded-lg bg-white/3 px-2.5 py-2"
            style={{
              borderLeft: `3px solid ${r.out === "victory" ? "var(--color-success)" : "var(--color-danger)"}`,
            }}
          >
            <span className="text-text-2">
              <IconController size={15} />
            </span>
            <span className="text-[12.5px] font-semibold text-text">{r.mode}</span>
            <span
              className={cn(
                "ml-auto text-[11px] font-extrabold uppercase",
                r.out === "victory" ? "text-success" : "text-danger",
              )}
            >
              {r.out === "victory" ? "Victoire" : "Défaite"}
            </span>
          </div>
        ))}
        {rows.length === 0 && (
          <div className="py-3 text-center text-[12px] text-dim">Aucun combat.</div>
        )}
      </div>
    </PreviewFrame>
  );
}
