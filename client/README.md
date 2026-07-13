# NOVA — client

SPA React 19 (Vite · TypeScript · Tailwind v4) de l'app de stats Brawl Stars
**NOVA**. Consomme le proxy (`../proxy`). Voir le [README racine](../README.md)
pour la vue d'ensemble, l'architecture et les sources de données.

## Dev

```bash
npm install
npm run dev        # http://localhost:5173 (Vite forwarde /api/* → :5000)
```

Le proxy doit tourner en parallèle (`cd ../proxy && npm run dev`).

## Scripts

```bash
npm run dev        # Vite + HMR
npm run build      # tsc -b && vite build → dist/
npm run preview    # sert le build
npm run lint       # ESLint
```

## Config

| Variable | Défaut | Description |
| --- | --- | --- |
| `VITE_PROXY_URL` | *(→ `/api`)* | URL du proxy en prod. En dev, inutile (Vite proxifie `/api/*`). |

## Repères

- `src/index.css` — thème Tailwind v4 (`@theme`) : palette near-noir + or, fonts.
- `src/components/ui/icons.tsx` — jeu d'icônes SVG maison (pas d'emoji).
- `src/data/brawlerInfo.ts` — dataset statique brawlers (descriptions/stats,
  scrapé du wiki Fandom).
- `src/utils/` — persistance locale (`battleStore`, `profileHistory`,
  `favorites`, `recents`), formatage, CDN helpers.
- `public/` — pictos (santé/attaque/super/hypercharge), fond de brawler,
  favicon.

Assets images : [Brawlify CDN](https://github.com/Brawlify/CDN). Projet non
affilié à Supercell.
