# Brawl Analytics

> Visualise tes stats Brawl Stars sans landing inutile : tu colles ton tag, tu vois ton profil. Profile, brawlers, batailles et analytics calculées sur ton historique.

Deux paquets indépendants :

| Package | Rôle | Stack |
| --- | --- | --- |
| **`proxy/`** | Backend qui fronte l'API officielle Brawl Stars. Garde le JWT Supercell côté serveur, ajoute du cache, du rate-limit et des endpoints d'analytics calculées. | Express 5 · TypeScript · Zod · Pino · LRU-cache · Helmet |
| **`client/`** | SPA "gaming" qui consomme le proxy. Recherche par tag, onglets Overview / Brawlers / Battles / Analytics, charts, historique persistant. | React 19 · Vite · Tailwind v4 · TanStack Query · React Router v7 · Recharts · Framer Motion |

Pas de monorepo root — chaque paquet a son propre `package.json`.

## Démarrage rapide

```bash
# 1. Récupère un JWT sur https://developer.brawlstars.com
#    (verrouille-le sur l'IP depuis laquelle tournera le proxy).
cp proxy/.env.example proxy/.env
# Edite proxy/.env, renseigne BRAWL_STARS_API_KEY

# 2. Lance le proxy (port 5000 par défaut)
cd proxy && npm install && npm run dev

# 3. Dans un autre terminal, lance le client (port 5173)
cd client && npm install && npm run dev
```

Ouvre <http://localhost:5173>. Vite forwarde automatiquement `/api/*` vers `http://localhost:5000` — pas besoin de configurer CORS en dev.

## Fonctionnalités

### Côté proxy

**Passthrough complet de l'API officielle** (toutes les routes typées, validation Zod sur tags et country codes) :

| Route | Description |
| --- | --- |
| `GET /players/:tag` | Profil joueur |
| `GET /players/:tag/battlelog` | 25 dernières batailles (limite Supercell) |
| `GET /clubs/:tag` | Détails du club |
| `GET /clubs/:tag/members` | Membres (paginé) |
| `GET /brawlers` | Catalogue de tous les brawlers |
| `GET /brawlers/:id` | Brawler spécifique |
| `GET /rankings/:country/players` | Classement joueurs |
| `GET /rankings/:country/clubs` | Classement clubs |
| `GET /rankings/:country/brawlers/:id` | Top players pour un brawler |
| `GET /events/rotation` | Rotation d'événements en cours |

**Endpoints analytics calculées** (inspirés de brawlytix.com) :

| Route | Description |
| --- | --- |
| `GET /analytics/players/:tag/summary` | Complétion du kit, distributions rank/power/trophy, meilleur brawler |
| `GET /analytics/players/:tag/brawlers` | Vue enrichie par brawler (slots débloqués, P11, R35) |
| `GET /analytics/players/:tag/battlelog` | Win rate, streaks, breakdowns mode/brawler/map |
| `GET /analytics/players/:tag/profile` | Tout-en-un : player + summary + battlelog (2 appels upstream en parallèle) |
| `GET /analytics/players/:tag/compare/:otherTag` | Diff side-by-side de deux joueurs |
| `GET /analytics/clubs/:tag/summary` | Avg/median/min/max/std-dev des trophées, distribution des rôles, top contributors |

**Sécurité & robustesse** :
- JWT Supercell jamais exposé au navigateur
- Rate-limit à deux niveaux (`globalLimiter` + `analyticsLimiter` plus strict)
- Headers `helmet`, CORS allowlist (`CORS_ORIGINS`)
- Validation Zod stricte des tags (alphabet Supercell, dédup `O→0`) et country codes
- Cache LRU avec TTL par ressource (5 min pour rankings/events, 60 s pour player/battlelog, 1 h pour brawlers)
- Timeout upstream via `AbortController`
- Logger Pino avec redaction des headers sensibles
- Graceful shutdown SIGTERM/SIGINT

### Côté client

- **Pas de landing page** — `/` est directement la barre de recherche en hero, focus auto. Validation tag côté client avant tout appel réseau.
- **Recherches récentes** stockées en localStorage.
- **Overview** : identité, trophées (chiffres complets, jamais tronqués), niveau XP, victoires séparées (3v3 / Solo / Duo Showdown), collection (P11 / R35 / kit completion), meilleur brawler, top 6, records personnels (best Robo Rumble, best Big Brawler, etc.), cosmétiques avec note transparente sur les limites API.
- **Brawlers** : grille filtrable/triable, image CDN par brawler, Star Powers + Gadgets visibles, indicateur `+N ⚙` pour les gears, **modal détail au clic** avec tout le kit nommé.
- **Battles** : grille de cards carrées paginées (12/page) avec filtre par résultat. **Modal au clic** avec équipes complètes, portraits, map, durée, trophées, star player.
- **Analytics** : win rate, streaks, breakdowns par mode/brawler/map, distributions rang/trophées (Recharts), radar de complétion du kit, top maps récentes.

### Images & cosmétiques

Tous les assets visuels (brawlers, profile-icons, gadgets, star powers, gears, maps) sont servis par le [Brawlify CDN](https://github.com/Brawlify/CDN). Le composant `<Img>` gère le shimmer de chargement et un fallback texte si l'asset n'existe pas (les brawlers fraîchement releasés peuvent lag).

### Historique des batailles

L'API Brawl Stars est **hard-cappée à 25 batailles par requête** — aucun cursor ne remonte plus loin. Pour pallier, le client maintient un **archive localStorage par tag** (cap 200 entrées, dédup par `battleTime + mode + map`) qui grandit à chaque visite. Le win rate et les analytics sont recalculées sur l'archive complet, pas seulement sur les 25 dernières.

## Configuration

### Variables d'environnement proxy

| Variable | Défaut | Description |
| --- | --- | --- |
| `BRAWL_STARS_API_KEY` | *(requis)* | JWT depuis developer.brawlstars.com, **verrouillé sur l'IP du proxy** |
| `BRAWL_STARS_API_URL` | `https://api.brawlstars.com/v1` | Base URL upstream |
| `PORT` | `5000` | Port d'écoute |
| `NODE_ENV` | `development` | `development` \| `production` \| `test` |
| `LOG_LEVEL` | `info` | `fatal` \| `error` \| `warn` \| `info` \| `debug` \| `trace` |
| `UPSTREAM_TIMEOUT_MS` | `10000` | Timeout fetch vers Supercell |
| `CORS_ORIGINS` | `*` | `*` (dev) ou liste virgule-séparée d'origines en prod |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Fenêtre du rate-limit |
| `RATE_LIMIT_MAX` | `120` | Requêtes max par IP par fenêtre |
| `CACHE_MAX_ITEMS` | `2000` | Taille du LRU cache |

### Variables d'environnement client

| Variable | Défaut | Description |
| --- | --- | --- |
| `VITE_PROXY_URL` | *(non défini → utilise `/api`)* | URL du proxy en production. En dev, Vite forwarde `/api/*` automatiquement. |

## Scripts

### `proxy/`

```bash
npm run dev         # nodemon + tsx, reload auto
npm run server      # alias de dev
npm start           # node dist/server.js (après build)
npm run build       # tsc -> dist/
npm run typecheck   # tsc --noEmit
```

### `client/`

```bash
npm run dev         # Vite avec HMR
npm run build       # tsc -b && vite build
npm run preview     # sert le dist/
npm run lint        # ESLint
```

## Architecture

### Proxy

```
proxy/src/
├── server.ts                 # Express app, middleware stack, graceful shutdown
├── config/                   # Cross-cutting (env, logger, cache, errors, validators)
│   ├── config.ts             # Zod-validated env (fail-fast au boot)
│   ├── logger.ts             # Pino + redaction
│   ├── cache.ts              # LRU + TTL table
│   ├── errors.ts             # HttpError + helpers
│   ├── tags.ts               # Normalisation tag Supercell
│   └── countries.ts          # Validation ISO-3166 + "global"
├── middleware/               # security, rateLimit, validate, errorHandler
├── services/
│   ├── brawlstars.ts         # Client fetch typé vers api.brawlstars.com
│   └── analytics.ts          # Pure functions: summarisePlayer, analyseBattlelog, …
├── routes/                   # players, clubs, brawlers, rankings, events, analytics
└── types/                    # brawlstars (officiel) + analytics (calculé)
```

### Client

```
client/src/
├── main.tsx                  # BrowserRouter + QueryClientProvider
├── App.tsx                   # Routes: / | /player/:tag | *
├── index.css                 # Tailwind v4 + @theme tokens (palette, fonts, surfaces, glows)
├── api/                      # apiFetch + TanStack Query hooks
├── pages/                    # HomePage (hero search), PlayerPage (tabs), NotFoundPage
├── components/
│   ├── SearchBar.tsx         # variant hero|compact, recents localStorage
│   ├── TopBar.tsx
│   ├── ui/                   # Card, Skeleton, Badge, ErrorState, Img, Logo
│   ├── player/               # PlayerHeader, TabNav, BrawlerDetailModal, BattleDetailModal
│   └── tabs/                 # OverviewTab, BrawlersTab, BattlesTab, AnalyticsTab
├── hooks/
│   └── useAccumulatedBattles.ts
├── types/                    # brawlstars + analytics (mirror du proxy)
└── utils/                    # tag, cdn, battleStore, battleStats, format, cn
```

## Limites connues (côté API Supercell)

L'API publique Brawl Stars **ne retourne pas** :
- Inventaire des skins par joueur (ni leur rareté, ni leur valeur en gemmes)
- Points de fame
- Rank et Elo en Ranked
- Historique au-delà des 25 dernières batailles

Le client est transparent là-dessus — la section "Cosmétiques" de l'Overview affiche une notice explicite. L'historique étendu est compensé par l'accumulation localStorage décrite plus haut.

⚠️ Le JWT Brawl Stars est **verrouillé sur une plage CIDR** lors de sa génération. Si tu déploies le proxy sur une nouvelle machine, régénère le token avec la bonne IP sinon Supercell répond `403`.

## Stack technique

**Proxy** : Node 20+ · Express 5 · TypeScript (ESM `nodenext`) · Zod · Pino · LRU-cache · Helmet · express-rate-limit · compression

**Client** : React 19 · Vite · TypeScript · Tailwind v4 (`@theme` tokens) · React Router v7 · TanStack Query v5 · Recharts v3 · Framer Motion · clsx

**Sources data** : [API officielle Brawl Stars](https://developer.brawlstars.com/) · [Brawlify CDN](https://github.com/Brawlify/CDN) pour tous les assets visuels.

## Disclaimer

Projet non affilié à Supercell ni à Brawlify. *Brawl Stars* est une marque de Supercell. Les assets sont servis par le CDN public Brawlify ; leur disponibilité dépend de Brawlify.

## Licence

À définir.
