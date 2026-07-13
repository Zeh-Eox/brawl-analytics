# NOVA

> Colle ton tag, vois tout. Stats Brawl Stars sans blabla ni landing : profil,
> brawlers, combats, classements, événements en direct, comparaison de joueurs
> et temps de jeu — le tout dans une interface « dashboard esports » near-noir.

*NOVA (anciennement « Brawl Analytics » / « BrawlStats »). Le rebrand est en
place : logomark nova (étoile 4 branches), wordmark « N**O**VA » à noyau, favicon
et manifest PWA.*

Deux paquets indépendants (pas de monorepo root — chaque paquet a son
`package.json`) :

| Package | Rôle | Stack |
| --- | --- | --- |
| **`proxy/`** | Backend qui fronte l'API officielle Brawl Stars. Garde le JWT Supercell côté serveur, ajoute cache, rate-limit, endpoints d'analytics calculées et **capture en arrière-plan** (poller + store disque). | Express 5 · TypeScript (ESM) · Zod · Pino · LRU-cache · Helmet |
| **`client/`** | SPA React (installable en **PWA**) qui consomme le proxy. Recherche par tag, 6 onglets profil, pages Découvrir & Comparer, charts, persistance locale. | React 19 · Vite · Tailwind v4 · TanStack Query v5 · React Router v7 · Recharts · Framer Motion |

## Démarrage rapide

```bash
# 1. Récupère un JWT sur https://developer.brawlstars.com
#    ⚠️ verrouille-le sur l'IP publique depuis laquelle tournera le proxy.
cp proxy/.env.example proxy/.env
# Édite proxy/.env → renseigne BRAWL_STARS_API_KEY

# 2. Lance le proxy (port 5000 par défaut)
cd proxy && npm install && npm run dev

# 3. Dans un autre terminal, lance le client (port 5173)
cd client && npm install && npm run dev
```

Ouvre <http://localhost:5173>. Vite forwarde `/api/*` → `http://localhost:5000`
automatiquement — pas de CORS à configurer en dev.

> Si l'API répond `403 accessDenied.invalidIp`, ce n'est pas un bug : l'IP
> publique du proxy ne correspond pas à celle enregistrée sur la clé. Mets-la à
> jour (`curl https://api.ipify.org` pour la connaître).

## Fonctionnalités

### Côté proxy

**Passthrough typé de l'API officielle** (validation Zod des tags et country
codes) :

| Route | Description |
| --- | --- |
| `GET /players/:tag` | Profil joueur |
| `GET /players/:tag/battlelog` | 25 dernières batailles (limite Supercell) |
| `GET /clubs/:tag` · `GET /clubs/:tag/members` | Club + membres (paginé) |
| `GET /brawlers` · `GET /brawlers/:id` | Catalogue / brawler |
| `GET /rankings/:country/players` · `/clubs` · `/brawlers/:id` | Classements |
| `GET /events/rotation` | Rotation d'événements en cours |

**Endpoints analytics calculées** :

| Route | Description |
| --- | --- |
| `GET /analytics/players/:tag/summary` | Complétion du kit, distributions rank/power/trophy, meilleur brawler |
| `GET /analytics/players/:tag/brawlers` | Vue enrichie par brawler |
| `GET /analytics/players/:tag/battlelog` | Win rate, streaks, breakdowns mode/brawler/map |
| `GET /analytics/players/:tag/profile` | Tout-en-un : player + summary + battlelog (2 appels upstream en parallèle) |
| `GET /analytics/players/:tag/compare/:otherTag` | Diff side-by-side de deux joueurs |
| `GET /analytics/clubs/:tag/summary` | Avg/median/min/max/std-dev trophées, rôles, top contributors |
| `GET /health` | Probe (ne tape pas l'upstream) |

**Capture en arrière-plan (tracker)** — un poller interroge périodiquement
chaque tag *actif* et persiste, par tag, une **archive de combats dédupliquée**
(bien au-delà de la fenêtre de 25) et une **timeline de trophées**. Stockage en
fichiers JSON sous `DATA_DIR/tracker/<TAG>.json` (écriture atomique, zéro
dépendance native). Un tag devient actif via `POST /tracker/:tag` (appelé par le
client à l'ouverture d'un profil) ; inactif > `TRACKER_INACTIVE_DAYS` → arrêté.

| Route | Description |
| --- | --- |
| `POST /tracker/:tag` | Active / rafraîchit la capture (déclenche un poll immédiat au 1er appel) |
| `GET /tracker/:tag` | Statut : compteurs, dernier poll, dernière erreur |
| `GET /tracker/:tag/battles` | Archive de combats capturée (dépasse les 25) |
| `GET /tracker/:tag/timeline` | Timeline de trophées capturée |

> ⚠️ La capture n'avance **que si le proxy tourne** et **depuis l'IP autorisée**
> par la clé (JWT verrouillé sur IP). Sur un serveur, réautorise l'IP.

**Sécurité & robustesse** : JWT jamais exposé au navigateur · rate-limit à deux
niveaux (`globalLimiter` + `analyticsLimiter`) · `helmet` + CORS allowlist ·
validation Zod stricte des tags · cache LRU avec TTL par ressource · **coalescing
des requêtes identiques en vol** (anti-burst) · **serve-stale-on-error** (ressert
le dernier cache sur 429/5xx/timeout) · timeout upstream (`AbortController`) ·
logs Pino avec redaction · graceful shutdown (poller inclus).

### Côté client

Direction visuelle **« near-noir + un seul accent doré »** : fond quasi-noir
`#08090E`, or `#FFC015` dominant, accents secondaires (magenta/cyan/violet)
parcimonieux. Typo display *Space Grotesk*. **Bibliothèque d'icônes SVG maison**
(`ui/icons.tsx`) — zéro emoji dans l'UI (hors drapeaux pays du sélecteur natif).

**Shell responsive** (`AppShell`) : sidebar sur desktop, top-bar + barre du bas
d'onglets sur mobile.

- **Accueil** (`/`) — hero « Colle ton tag », recherche avec validation
  côté client, favoris épinglés + recherches récentes (localStorage), aperçu
  décoratif.
- **Profil** (`/player/:tag`) — header (avatar, pseudo coloré, tag, club,
  championship, épingler / comparer / partager) + 6 onglets :
  - **Overview** — bloc « depuis ta dernière visite », victoires (3v3 / solo /
    duo + répartition), collection + détail du kit, aperçu combat, brawler du
    moment, top brawlers, records personnels, **temps de jeu**.
  - **Brawlers** — grille triable, portraits CDN, **feuille détail** au clic.
  - **Battles** — style *BATTLE LOG* du jeu : layout **VS** avec portraits des
    brawlers, icône de mode + vignette de map, durée, star player, joueurs
    cliquables, badge « Amical » pour les `type: friendly`. **Filtres**
    (résultat / mode / brawler) et bascule **Liste ↔ Sessions** (regroupe les
    combats par session, avec récap V-D / delta trophées / durée).
  - **Analytics** — en tête, la **progression des trophées dans le temps**
    (`TrophyProgress` : timeline serveur si la capture est active, sinon
    snapshots locaux ; plages 7 j / 30 j / tout ; Δ 24 h & Δ 7 j ; bandeau de
    suivi + bouton « Activer »). Puis winrate radial, breakdowns par mode,
    **perf par brawler**, meilleures/pires maps, **temps de jeu** (suivi +
    estimation à vie), répartition de la collection, insights auto.
  - **Club** — identité, stats, membres/rôles cliquables.
  - **Guide** — guide interactif : navigation par chapitres, aperçus vivants de
    chaque écran, et boutons qui ouvrent réellement la section décrite.
- **Découvrir** (`/discover`) — événements en cours (icônes de mode + maps) +
  classements joueurs/clubs (sélecteur pays).
- **Comparer** (`/compare`) — face-à-face de deux joueurs : cartes avec leader,
  scoreboard « domination », barres de comparaison + écart chiffré.

**Feuille détail brawler** (`BrawlerSheet`) — illustration (fond image), rareté
& classe, barre de POWER, trophées, **stats numériques scalées au niveau réel**
(santé / attaque / super via la formule `base × (1 + 0,1·(power−1))`),
**descriptions officielles** de l'attaque / super / hypercharge / star powers /
gadgets, kit avec icônes CDN, et **tes stats perso** avec ce brawler (matchs,
winrate, courbe de trophées reconstruite). Pictos santé/attaque/super/hypercharge
personnalisés dans `public/`.

**Partage & deep-link** — carte de stats en **export PNG autonome** (SVG→canvas,
sans dépendance) + bouton **« Copier le lien »**. La feuille détail d'un brawler
est **partageable par URL directe** (`?brawler=<id>`).

**Onboarding & états vides** — bande « Comment ça marche » masquable sur
l'accueil (localStorage), et composant `EmptyState` réutilisé sur tous les
écrans « pas encore de données ».

**PWA / offline** — service worker fait main (`public/sw.js`, pas de
`vite-plugin-pwa`) : navigations *network-first* avec repli sur le shell en
cache, images Brawlify *cache-first*, assets *stale-while-revalidate*. Manifest
`public/manifest.webmanifest` → app installable (nom **NOVA**, thème near-noir).
Enregistré en production uniquement (le dev garde le HMR).

### Sources de données

| Source | Usage | Accès |
| --- | --- | --- |
| [API officielle Brawl Stars](https://developer.brawlstars.com/) | Toutes les stats (via le proxy) | JWT verrouillé sur IP |
| [Brawlify CDN](https://github.com/Brawlify/CDN) | **Images** : brawlers, profile-icons, gadgets, star powers, gears, maps, game-modes, club-badges | Public, fonctionne |
| [Brawl Stars Wiki (Fandom)](https://brawlstars.fandom.com) | **Descriptions + stats + rareté/classe** des 106 brawlers | Scrapé une fois via l'API MediaWiki → snapshot statique `client/src/data/brawlerInfo.ts` |

> ⚠️ L'**API JSON de Brawlify** (`api.brawlify.com`) est bloquée par un
> challenge Cloudflare (403). Seules les **images** du CDN sont accessibles.
> C'est pourquoi les descriptions viennent d'un dataset statique issu du wiki.
> Régénérer : voir `Régénérer le dataset brawlers` plus bas.

Les icônes de mode utilisent la formule fiable `cdn.gameMode(48000000 + modeId)`
(le battlelog/la rotation exposent `event.modeId`).

### Persistance locale (navigateur)

L'API Brawl Stars est **hard-cappée à 25 batailles** par requête et **n'expose
aucun temps de jeu ni historique**. Le client compense côté navigateur
(localStorage, par tag) :

- **Archive de combats** (`battleStore.ts`) — capée à 200 entrées, dédup par
  `battleTime + mode + map`. Win rate et analytics recalculés sur l'archive.
- **Compteur de temps de jeu cumulé** — chaque combat n'est compté **qu'une
  fois** (à sa première apparition), et le total **survit à l'éviction** des
  vieux matchs de l'archive.
- **Snapshots de profil** (`profileHistory.ts`) — trophées/brawlers/niveau à
  chaque visite → courbe de trophées + bloc « depuis ta dernière visite ».
- **Favoris & récents** (`favorites.ts`, `recents.ts`).

> Limite assumée : ces suivis locaux ne capturent que ce qui est vu **pendant
> tes visites** (fenêtre de 25 combats). Le « temps suivi » est donc une borne
> basse ; l'« estimation à vie » (victoires ÷ winrate × durée moyenne + surcoût
> menus/matchmaking) est clairement étiquetée « grossière ».

Quand la **capture en arrière-plan** (proxy) est active, l'onglet Historique
privilégie la **timeline serveur** — plus complète, car elle grandit même
lorsque tu n'es pas sur le site (tant que le proxy tourne). L'archive locale
reste le repli hors-ligne.

## Configuration

### Variables d'environnement — proxy

| Variable | Défaut | Description |
| --- | --- | --- |
| `BRAWL_STARS_API_KEY` | *(requis)* | JWT developer.brawlstars.com, **verrouillé sur l'IP du proxy** |
| `BRAWL_STARS_API_URL` | `https://api.brawlstars.com/v1` | Base URL upstream |
| `PORT` | `5000` | Port d'écoute |
| `NODE_ENV` | `development` | `development` \| `production` \| `test` |
| `LOG_LEVEL` | `info` | `fatal` … `trace` |
| `UPSTREAM_TIMEOUT_MS` | `10000` | Timeout fetch vers Supercell |
| `CORS_ORIGINS` | `*` | `*` (dev) ou liste virgule-séparée en prod |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Fenêtre du rate-limit |
| `RATE_LIMIT_MAX` | `120` | Requêtes max par IP par fenêtre |
| `CACHE_MAX_ITEMS` | `2000` | Taille du LRU cache |
| `DATA_DIR` | `./data` | Dossier de persistance de la capture (tracker) |
| `TRACKER_ENABLED` | `true` | Active/désactive le poller d'arrière-plan |
| `TRACKER_POLL_INTERVAL_MS` | `600000` | Intervalle de balayage (10 min) |
| `TRACKER_POLL_SPACING_MS` | `1500` | Pause entre deux tags dans un balayage |
| `TRACKER_MAX_TAGS` | `50` | Nombre max de tags suivis (LRU par dernière demande) |
| `TRACKER_INACTIVE_DAYS` | `14` | Un tag non demandé depuis X jours cesse d'être suivi |
| `TRACKER_BATTLE_CAP` | `500` | Combats archivés max par tag |
| `TRACKER_TIMELINE_CAP` | `2000` | Points de timeline max par tag |

### Variables d'environnement — client

| Variable | Défaut | Description |
| --- | --- | --- |
| `VITE_PROXY_URL` | *(non défini → `/api`)* | URL du proxy en prod. En dev, Vite forwarde `/api/*`. |

## Scripts

```bash
# proxy/
npm run dev         # nodemon + tsx, reload auto
npm start           # node dist/server.js (après build)
npm run build       # tsc -> dist/
npm run typecheck   # tsc --noEmit

# client/
npm run dev         # Vite + HMR
npm run build       # tsc -b && vite build
npm run preview     # sert le dist/
npm run lint        # ESLint
```

## Docker (proxy)

Le proxy se conteneurise via `proxy/Dockerfile` (multi-stage, `node:22-alpine`,
image runtime sans devDeps, `USER node`, `HEALTHCHECK` sur `/health`, `VOLUME
/app/data` pour persister la capture).

```bash
cd proxy
docker build -t nova-proxy .
docker run --rm -p 5000:5000 --env-file .env -v nova-data:/app/data nova-proxy
```

Exemple `docker-compose.yml` (à la racine) :

```yaml
services:
  proxy:
    build: ./proxy
    ports: ["5000:5000"]
    env_file: ./proxy/.env
    volumes:
      - nova-data:/app/data   # conserve l'archive de capture entre redémarrages
    restart: unless-stopped

volumes:
  nova-data:
```

> Le **client** est une SPA statique : `cd client && npm run build` produit
> `client/dist/`, servable par n'importe quel hébergeur statique (Vercel,
> Netlify, Nginx…). En prod, définis `VITE_PROXY_URL` vers l'URL publique du
> proxy avant de builder.
>
> ⚠️ Rappel IP : la clé Supercell est verrouillée sur une IP. Sur une nouvelle
> machine/hébergeur, régénère le token avec la bonne IP sinon `403`.

## Architecture

### Proxy

```
proxy/src/
├── server.ts                 # Express app, middleware, graceful shutdown, poller
├── config/                   # env (Zod fail-fast, + vars TRACKER_*), logger (Pino),
│                             #   cache (LRU+TTL), errors, tags, countries (ISO-3166)
├── middleware/               # security, rateLimit, validate, errorHandler
├── services/
│   ├── brawlstars.ts         # Fetch typé (coalescing + serve-stale-on-error)
│   ├── analytics.ts          # Pure functions: summarisePlayer, analyseBattlelog, …
│   └── tracker.ts            # Capture arrière-plan : poller + store fichiers JSON
├── routes/                   # players, clubs, brawlers, rankings, events,
│                             #   tracker, analytics
└── types/                    # brawlstars (officiel) + analytics (calculé)

proxy/data/tracker/           # Persistance de la capture (créé au runtime, gitignore)
```

### Client

```
client/src/
├── main.tsx                  # BrowserRouter + QueryClientProvider + enreg. du SW
├── App.tsx                   # Routes: / | /player/:tag | /discover | /compare | *
├── index.css                 # Tailwind v4 + @theme (palette near-noir, or, fonts)
├── api/                      # apiFetch + hooks TanStack Query (dont tracker + mutation)
├── data/brawlerInfo.ts       # Dataset statique brawlers (Fandom) : descriptions, stats
├── pages/                    # Home (+ onboarding), Player (+ deep-link brawler),
│                             #   Discover, Compare, NotFound
├── components/
│   ├── AppShell.tsx          # sidebar desktop + top-bar/bottom-nav mobile
│   ├── SearchBar.tsx         # variant hero|compact, favoris + récents
│   ├── ui/                   # Card, Stat, Badge, Sheet, Avatar, ProgressBar,
│   │                         #   RadialGauge, TrophyCurve, CdnIcon, BrandMark
│   │                         #   (NovaMark + wordmark), EmptyState, SectionTitle,
│   │                         #   Skeleton, Img, ErrorState, accent.ts, icons.tsx
│   ├── player/               # PlayerHeader, ProfileNav, BrawlerSheet, ShareCard,
│   │                         #   TrophyProgress (progression, dans Analytics)
│   └── tabs/                 # Overview, Brawlers, Battles, Analytics, Club, Guide
├── hooks/useAccumulatedBattles.ts
├── types/                    # brawlstars + analytics + tracker (mirror du proxy)
└── utils/                    # tag, cdn (+cdnChain), color, cn, format, brawlerName,
                              #   insights, playtime, battleStore (+ temps cumulé),
                              #   battleStats, profileHistory, timeline, sessions,
                              #   favorites, recents

client/public/               # favicon.svg (nova), manifest.webmanifest, sw.js,
                             #   pictos, brawler-bg, NOVA Logo.pdf
```

## Régénérer le dataset brawlers

`client/src/data/brawlerInfo.ts` est un snapshot scrapé du wiki Fandom (via
l'API MediaWiki : template `{{Quote|…}}` pour les descriptions, champs
`|rarity=` / `|class=` / stats de l'infobox). Quand de nouveaux brawlers
sortent, relancer le scraper (script conservé dans le scratchpad de dev) qui
récupère le catalogue via le proxy `GET /brawlers` puis interroge le wiki.

## Limites connues (API Supercell)

L'API publique **ne retourne pas** : temps de jeu · inventaire des skins ·
points de fame · rank/Elo en Ranked · historique au-delà des 25 dernières
batailles. NOVA est transparent là-dessus (labels « estimation », borne basse,
etc.) et compense l'historique par **deux mécanismes complémentaires** :
l'accumulation locale (localStorage, hors-ligne) et la **capture serveur en
arrière-plan** (plus complète tant que le proxy tourne depuis l'IP autorisée).

## Stack technique

**Proxy** : Node 22 · Express 5 · TypeScript (ESM `nodenext`) · Zod · Pino ·
LRU-cache · Helmet · express-rate-limit · compression

**Client** : React 19 · Vite · TypeScript · Tailwind v4 (`@theme`) · React
Router v7 · TanStack Query v5 · Recharts v3 · Framer Motion · clsx

## Disclaimer

Projet non affilié à Supercell, Brawlify ou Fandom. *Brawl Stars* est une marque
de Supercell. Les images sont servies par le CDN public Brawlify ; les
descriptions proviennent du wiki Fandom (CC-BY-SA). Leur disponibilité dépend de
ces tiers.

## Licence

À définir.
