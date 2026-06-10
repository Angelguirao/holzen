# Marketing site split (Astro + product SPA)

**Status:** Phase 1 — unified `holzen.app` deploy (one URL, path-based routing).

## Recommendation: one domain

Use **a single Vercel project on `holzen.app`**. Astro serves static marketing HTML at explicit paths; everything else falls through to the React SPA (`spa.html`).

| Why one URL | |
| --- | --- |
| Simpler for users | One brand, one bookmark |
| Auth | Supabase session stays same-origin — no cross-subdomain `ref` handoff |
| Ops | One DNS target, one production deploy |
| Fits Holzen today | App Home stays at `/`; landing moves to static `/welcome` without renumbering routes |

A separate `app.holzen.app` subdomain is optional later if you want hard isolation — not required.

## Topology

| Surface | Location | URL | Responsibility |
| --- | --- | --- | --- |
| Marketing (static) | `apps/site/` | `/welcome`, future `/about`, `/blog`, legal | SEO HTML, fast first paint |
| Product (SPA) | Repo root `src/` | `/`, `/auth`, `/archive`, `/pause`, … | Auth, ritual, authenticated shell |
| Backend | `supabase/` | — | Shared Postgres + edge functions |

### How routing works on Vercel

1. **Build** `npm run build:unified` → Vite `dist/spa.html` + Astro pages copied into `dist/`.
2. **Static files win** — e.g. `dist/welcome/index.html` is served for `/welcome`.
3. **Fallback rewrite** — any path without a static file → `/spa.html` (React router).

Logged-out user hits `/` → SPA boots → `ProtectedRoute` → `/welcome` → **Astro static** (once merged).  
Logged-in user hits `/` → SPA → Home.

## Route ownership

### Astro (static, merged into `dist/`)

| Route | Notes |
| --- | --- |
| `/welcome` | Primary marketing landing (replaces SPA `LandingScreen` when merged) |
| `/about`, `/terms`, `/privacy`, `/blog`, `/blog/:slug` | Port from SPA in phase 2 |

### Product SPA (`spa.html`)

| Route | Notes |
| --- | --- |
| `/` | Home (authenticated) |
| `/auth`, `/reset-password`, `/unsubscribe` | Auth / utility |
| `/archive`, `/journey`, `/settings`, `/pause`, `/companion/*`, `/admin/*`, `/onboarding` | Shipped product |
| `/welcome` | SPA fallback until Astro path exists in `dist/` |

### Legacy (404)

| Route | Location |
| --- | --- |
| `/roadmap`, `/reserve` | `src/legacy/marketing-roadmap-reserve/` |

## Integration contracts

### Auth CTAs (same origin)

```
/auth?view=sign-up
/auth?view=sign-in&ref=<code>
```

`ref` can use `localStorage` on the SPA side as today — no cross-domain pass-through needed.

### Design tokens

`packages/design-tokens/tokens.css` — keep aligned with `src/index.css` Nox variables.

### Analytics

- Astro: `marketing.*` events when instrumented → [event-taxonomy.md](./event-taxonomy.md)
- SPA: existing product events unchanged

## Vercel (single project)

| Setting | Value |
| --- | --- |
| Root directory | `.` (repo root) |
| Build command | `npm run build:unified` |
| Output directory | `dist` |
| Domain | `holzen.app` (+ `www` → apex) |

`vercel.json` rewrites unmatched paths to `/spa.html`. Static marketing files are served first.

`apps/site/vercel.json` is for **standalone Astro preview only** — not used in production.

## Migration checklist

- [x] Scaffold `apps/site` + `packages/design-tokens`
- [x] Unified build (`build:unified` + `merge-marketing-dist.mjs`)
- [x] Quarantine `/roadmap` + `/reserve` to legacy
- [ ] Enable `build:unified` on production Vercel project (replace `npm run build`)
- [ ] Port full landing content from `LandingScreen.tsx` → `welcome.astro`
- [ ] Port about, legal, blog to Astro; remove duplicate SPA routes
- [ ] Optional later: move marketing to `/` and app Home to `/home` (only if SEO needs apex landing)

## Commands

```bash
npm run dev           # Product SPA :8080
npm run dev:site      # Astro marketing :4321 (isolated dev)
npm run build:unified # Production: SPA + Astro → dist/
```

Local dev does not merge both apps — use separate ports until preview/deploy.
