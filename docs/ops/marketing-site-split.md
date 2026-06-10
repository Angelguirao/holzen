# Marketing site split (Astro + product SPA)

**Status:** Phase 1 scaffold — `apps/site` Astro landing; product SPA remains at repo root.

## Topology

| Surface | Location | Domain | Responsibility |
| --- | --- | --- | --- |
| Marketing | `apps/site/` | `holzen.app`, `www.holzen.app` | Static HTML, SEO, blog/legal (future), landing CTAs |
| Product app | Repo root `src/` (future `apps/app/`) | `app.holzen.app` | Auth, pause ritual, authenticated shell |
| Backend | `supabase/` | — | Shared Postgres + edge functions |

## Route ownership

### Astro (`apps/site`)

| Route | Notes |
| --- | --- |
| `/` | Primary marketing entry |
| `/welcome` | 301 → `/` (Vercel redirect in `apps/site/vercel.json`) |
| `/about`, `/terms`, `/privacy`, `/blog`, `/blog/:slug` | Port from SPA in phase 2 |

### Product SPA (active)

| Route | Notes |
| --- | --- |
| `/welcome` | Keep until domain cutover; then remove or redirect at app host |
| `/auth`, `/reset-password`, `/unsubscribe` | Auth/session flows stay here |
| `/`, `/archive`, `/journey`, `/settings`, `/pause`, `/companion/*` | Shipped product |

### Legacy (not routed)

| Route | Location |
| --- | --- |
| `/roadmap` | `src/legacy/marketing-roadmap-reserve/RoadmapScreen.tsx` |
| `/reserve` | `src/legacy/marketing-roadmap-reserve/ReserveScreen.tsx` |

`/roadmap` and `/reserve` are **404** in the active SPA. Re-enable via [marketing-roadmap-reserve README](../../src/legacy/marketing-roadmap-reserve/README.md) or a future Astro page.

## Integration contracts

### Auth CTAs

Marketing links must use the app origin explicitly:

```
https://app.holzen.app/auth?view=sign-up
https://app.holzen.app/auth?view=sign-in&ref=<code>
```

Astro reads `PUBLIC_APP_URL` (see `apps/site/.env.example`). **Do not** rely on `localStorage` for `ref` across domains.

### Design tokens

`packages/design-tokens/tokens.css` — keep aligned with `src/index.css` Nox variables.

### Analytics

- Astro: `marketing.*` events (add to [event-taxonomy.md](./event-taxonomy.md) when instrumented)
- SPA: existing product events unchanged

## Vercel projects

| Project | Root directory | Build | Output |
| --- | --- | --- | --- |
| `holzen-site` | `apps/site` | `npm run build` | `dist` |
| `holzen-app` | `.` (repo root) | `npm run build` | `dist` |

**Env (site):** `PUBLIC_APP_URL=https://app.holzen.app`

**Env (app):** existing `VITE_*` Supabase + observability vars unchanged.

## Migration checklist

- [x] Scaffold `apps/site` + `packages/design-tokens`
- [x] Quarantine `/roadmap` + `/reserve` to `src/legacy/marketing-roadmap-reserve/`
- [x] Remove roadmap/reserve from active SPA routes and footer links
- [ ] Port full landing content from `LandingScreen.tsx` to Astro
- [ ] Port about, legal, blog to Astro
- [ ] Point `holzen.app` DNS to site project; `app.holzen.app` to SPA project
- [ ] Remove `/welcome` from SPA after marketing domain cutover
- [ ] Optional: move SPA to `apps/app/` (physical monorepo layout)

## Commands

```bash
npm run dev:site      # Astro on :4321
npm run build:site    # Static marketing build
npm run dev           # Product SPA on :8080
```
