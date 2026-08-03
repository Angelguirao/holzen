# Marketing site + product app — how it works

**Status:** Waitlist landing is SPA (Figma Make port). Astro owns thin public pages (about, legal, blog). One URL (`holzen.app`), one Vercel project, two frontends merged at build.

**Audience:** Anyone who wants to understand *why* we split marketing HTML from the product app, *what* gets built, and *what happens* when a user opens a link.

---

## Start here (60 seconds)

Holzen is still **one website** for users: `https://holzen.app`.

| Piece | Technology | Lives in repo | Example URLs |
| --- | --- | --- | --- |
| **Waitlist landing** | React SPA (Make port) | `src/screens/marketing/welcome/` | `/` (legacy `/welcome` → `/`) |
| **Thin marketing** | Astro (static HTML) | `apps/site/` | `/about`, `/terms`, `/privacy`, `/blog` |
| **Product** | React + Vite (SPA) | `src/` | `/home`, `/auth`, `/archive`, `/pause` |
| **Backend** | Supabase | `supabase/` | (API — not a page you browse) |

On deploy, Astro + Vite are **combined into one `dist/` folder**. Vercel serves real HTML when it exists; everything else loads the React app (`spa.html`).

There is **no** edge redirect that steals `/` from the SPA. Signed-out visitors see the waitlist landing at `/`. Signed-in visitors hitting `/` are client-redirected to Home at `/home`.

---

## Why we did this

### Before (everything in React)

All public pages — landing, about, blog, auth, home — lived in the same React app (`src/screens/marketing/`, `src/App.tsx`).

That works, but marketing pages pay the cost of the full app bundle (React, router, TanStack Query, auth provider…) even when someone only wants to read the landing page. SEO and first paint are heavier than necessary.

### After (marketing in Astro, product in React)

- **Marketing** → pre-built HTML (fast, crawlable, small JS).
- **Product** → same React SPA you already have (auth, pause, shell).

Users still see **one domain**. Developers still work in **one repo**. Only the **build step** stitches two outputs together.

---

## Mental model: two apps, one front door

Think of `holzen.app` like a building:

```
holzen.app
├── /                             ← Waitlist landing (SPA Make port)
├── /welcome                      ← Legacy → `/` (query preserved)
├── /about, /blog, legal …        ← Thin Astro static pages
└── /home, /auth, /pause, …       ← Product (React SPA)
```

Supabase is the **basement** (database, auth, edge functions). Neither Astro nor React replaces it — they are just different **ways to render HTML** in the browser.

```mermaid
flowchart TB
  subgraph browser [User browser]
    U[Visitor]
  end

  subgraph vercel [Vercel — holzen.app]
    S[Static file? e.g. welcome/index.html]
    SPA[spa.html — React app shell]
  end

  subgraph repo [This repo — build time]
    ASTRO[apps/site — Astro build]
    VITE[src/ — Vite build]
    MERGE[merge-marketing-dist.mjs]
  end

  subgraph supabase [Supabase — runtime]
    DB[(Postgres)]
    EDGE[Edge functions]
  end

  U --> vercel
  S --> U
  SPA --> U
  ASTRO --> MERGE
  VITE --> MERGE
  MERGE --> vercel
  SPA --> DB
  SPA --> EDGE
```

---

## Astro vs React SPA — when to use which

| Question | Astro (`apps/site/`) | React SPA (`src/`) |
| --- | --- | --- |
| Needs login? | No | Yes (or auth flows) |
| Mostly static copy? | Yes | — |
| Talks to Supabase from the page? | Rarely / later | Yes (TanStack Query, hooks) |
| Heavy interaction (pause ritual, forms)? | No | Yes |
| Good for SEO / fast first paint? | Yes | OK, but heavier bundle |

**Rule of thumb:** If it is a **brochure** page → Astro. If it is **the product** → SPA.

Shared **colors/fonts** live in `packages/design-tokens/` so marketing does not drift from Nox (`src/index.css`).

---

## Where things live in the repo

```
holzen/
├── apps/
│   └── site/                    # Astro marketing site
│       ├── src/pages/           # One file ≈ one URL (e.g. about.astro → /about)
│       ├── src/layouts/         # Shared HTML shell
│       └── src/lib/app-url.ts   # Same-origin links like /auth?view=sign-up
│
├── packages/
│   └── design-tokens/           # Shared CSS variables (Nox colors, fonts)
│
├── src/                         # React product app (unchanged layout)
│   ├── App.tsx                  # Route table + auth guards
│   ├── screens/marketing/       # SPA marketing screens (being ported to Astro)
│   └── features/                # Pause, auth, subscription, …
│
├── supabase/                    # Backend (shared by both frontends)
│
├── scripts/
│   └── merge-marketing-dist.mjs # Copies Astro dist into Vite dist after build
│
├── dist/                        # Production output (generated — do not edit)
│   ├── spa.html                 # React entry (renamed from index.html at merge)
│   ├── about/index.html         # Astro thin pages (when built)
│   └── assets/                  # Vite JS/CSS bundles
│
└── vercel.json                  # Build command + SPA fallback rewrite
```

---

## Production build — step by step

Command: **`npm run build:unified`**

| Step | What runs | Output |
| --- | --- | --- |
| 1 | `npm run build` (Vite) | `dist/index.html` + `dist/assets/*` (full React app) |
| 2 | `npm run build:site` (Astro) | `apps/site/dist/welcome/index.html`, … |
| 3 | `scripts/merge-marketing-dist.mjs` | Renames `dist/index.html` → **`dist/spa.html`**, then copies Astro files into `dist/` |

After merge, `dist/` might look like:

```
dist/
  spa.html                 ← React app (all product routes)
  welcome/
    index.html             ← Astro landing
  assets/
    index-abc123.js        ← React bundles
  _astro/                  ← Astro assets (when more pages exist)
    ...
```

Vercel uploads this folder. **No second project.**

---

## Production routing — what happens when someone opens a URL

Vercel rule (in root `vercel.json`):

1. If a **real file** exists for that path → serve it.
2. Otherwise → serve **`/spa.html`** (React loads and `react-router` picks the screen).

### Example journeys

#### A) Cold visitor lands on marketing

```
GET /
  → spa.html
  → React WelcomeLandingScreen (Make port + waitlist)
  → User can Sign in → GET /auth
```

#### B) Legacy marketing URL

```
GET /welcome?ref=abc
  → spa.html
  → React: LegacyLandingRedirect → /?ref=abc
```

#### C) Logged-in user opens Home

```
GET /home
  → spa.html
  → React: ProtectedRoute sees session
  → Home screen (bottom nav shell)
```

Signed-in users who hit `/` are redirected to `/home` via `PublicOnlyRoute`.

#### D) User in a pause ritual

```
GET /pause
  → spa.html
  → React: PauseSession screen (full-screen, no bottom nav)
```

### Route ownership today

| URL | Served by (target state) | Notes |
| --- | --- | --- |
| `/` | **SPA** (Make port) | Waitlist + motion landing (`PublicOnlyRoute`) |
| `/welcome` | **SPA** redirect | → `/` (preserves query, e.g. `?ref=`) |
| `/home` | **SPA** | Authenticated Home |
| `/auth` | **SPA** | Sign-in / sign-up |
| `/archive`, `/journey`, `/settings` | **SPA** | App shell tabs |
| `/pause`, `/companion/*` | **SPA** | Full-screen flows |
| `/about`, `/terms`, `/privacy`, `/blog` | **Astro** | Thin marketing; SPA `MarketingDevFallback` reloads to static in prod |
| `/roadmap`, `/reserve` | **404** | Moved to `src/legacy/marketing-roadmap-reserve/` |

---

## Local development — why two commands?

Locally we **do not merge** Astro + SPA into one dev server (yet). You run them separately:

| Command | Port | What you see |
| --- | --- | --- |
| `npm run dev` | **8080** | Full React app (landing at `/`, Home at `/home`) |
| `npm run dev:site` | **4321** | Astro thin pages only (e.g. `/about`) |

**Local gotcha:** On `:4321`, product paths like `/auth` do **not** exist — Sign in / CTA links target `http://localhost:8080` automatically. Run **`npm run dev`** alongside **`npm run dev:site`** when testing the full landing → signup flow.

**Why?** Vite and Astro each have their own dev server with HMR. The **unified routing** only exists after `npm run build:unified` + deploy (or `npm run preview` on the merged `dist/` if you build locally).

**Day-to-day workflow:**

- Product work → `npm run dev` on :8080
- Marketing / Astro work → `npm run dev:site` on :4321
- Before shipping marketing changes → `npm run build:unified` and sanity-check `dist/`

---

## CI/CD — how this fits the pipeline

Holzen uses **one frontend deploy path**. You do **not** add a second Vercel project or separate marketing workflow.

```mermaid
flowchart LR
  PR[Pull request] --> CI[ci.yml]
  CI --> T[test:ci]
  CI --> B[build:unified]
  B --> BS[check:bundle-shipped]

  STG[Push staging] --> SD[staging-deploy.yml]
  SD --> PF[preflight: test:ci + build:unified]
  PF --> BE[deploy-backend]
  BE --> FE[vercel-ci-deploy]

  MAIN[Push main] --> PD[deploy-production.yml]
  PD --> PF2[preflight: test:ci + build:unified]
  PF2 --> BE2[deploy-backend]
  BE2 --> FE2[vercel-ci-deploy]

  FE --> V[Vercel preview]
  FE2 --> VP[Vercel production]
```

| Stage | Workflow | Frontend build | What deploys |
| --- | --- | --- | --- |
| **PR / push** | `.github/workflows/ci.yml` | `npm run build:unified` + `check:bundle-shipped` | Nothing (validate only) |
| **Staging** | `staging-deploy.yml` preflight | `npm run build:unified` | — |
| **Staging** | `staging-deploy.yml` deploy-frontend | `vercel build` (same `vercel.json`) | Preview URL |
| **Production** | `deploy-production.yml` | Same chain | `holzen.app` |
| **PR preview** | Vercel Git integration (auto) | `vercel.json` → `build:unified` | Ephemeral preview |

**Order:** Backend (migrations + edges) **always** runs before frontend deploy on `staging` / `main` — unchanged. Marketing HTML ships in the **same** prebuilt `dist/` as the SPA.

### New secrets or jobs?

**No** for the current Astro scaffold:

- Thin Astro pages are static — no extra `VITE_*` or Supabase keys at build time.
- When you port **blog** to Astro with live Supabase data at build time, add those vars to GitHub + Vercel **build** env (same as SPA today).

### What to verify once

- [ ] GitHub Actions preflight uses `build:unified` (not SPA-only `build`)
- [ ] Root `vercel.json` has `buildCommand: npm run build:unified` and rewrite to `/spa.html`
- [ ] After deploy: `/` serves SPA waitlist, `/home` signed-in Home, `/auth` React

Details: [cicd-overview.md](./cicd-overview.md).

---

## Vercel settings (single project)

| Setting | Value |
| --- | --- |
| Project root | Repository root (`.`) |
| Build command | `npm run build:unified` |
| Output directory | `dist` |
| Domain | `holzen.app` |

`apps/site/vercel.json` is **not** used for production — only if you ever preview Astro in isolation.

---

## FAQ

### Do I need two URLs?

**No.** One domain: `holzen.app`. Path-based split (`/` = waitlist landing, `/home` = product Home, `/auth` = app).

### Is Astro replacing React?

**No.** Astro only owns **thin public marketing HTML** (about, legal, blog). The waitlist landing and product stay React.

### Where does auth live?

**SPA only** (`/auth`, Supabase client in `src/`). Astro pages link to `/auth` with normal `<a href>` tags.

### What is `spa.html`?

The React app's `index.html`, renamed during merge so Astro can also place `index.html` files under paths like `/about/` without clobbering the app entry. Vercel's fallback rewrite points unmatched routes at `spa.html`.

### What happened to `/roadmap` and `/reserve`?

Quarantined to legacy — **not shipped**. They 404 in the active app. Code: `src/legacy/marketing-roadmap-reserve/`.

### Do I edit `dist/`?

**Never.** It is generated. Edit `src/` or `apps/site/`, then rebuild.

### Why is landing at `/` and Home at `/home`?

Marketing owns the apex URL so cold traffic and share links hit the waitlist without a redirect. Authenticated Home lives at `/home`. Legacy `/welcome` redirects to `/` (query preserved). Do **not** add a Vercel redirect that remaps `/` away from the SPA.

### How do waitlist CTAs work?

SPA calls Supabase edge `waitlist-signup` + `landing-ping` via `src/screens/marketing/welcome/waitlist-api.ts` (`VITE_SUPABASE_*`).

---

## Glossary

| Term | Meaning |
| --- | --- |
| **SPA** | Single-page app — one HTML shell, React Router swaps screens client-side |
| **Static page** | Full HTML file generated at build time (Astro) |
| **Merge** | Copy Astro `dist/` into Vite `dist/` after renaming SPA entry to `spa.html` |
| **Rewrite** | Vercel rule: "if no file matches, serve `spa.html` instead" |
| **Active surface** | Routes and features in pause-first shipped scope — see [active-surface.md](./active-surface.md) |

---

## Migration status

- [x] Astro scaffold at `apps/site/`
- [x] Shared tokens at `packages/design-tokens/`
- [x] Unified build (`build:unified` + merge script)
- [x] Single-domain Vercel config (`spa.html` fallback)
- [x] `/roadmap`, `/reserve` → legacy
- [x] Waitlist landing on SPA (`WelcomeLandingScreen` — Figma Make port); Astro no longer owns landing
- [x] Landing at `/`, Home at `/home`; legacy `/welcome` → `/`
- [x] Removed Vercel `/` → `/welcome` redirect
- [x] Port `/about`, legal, `/blog` to Astro; SPA `MarketingDevFallback` for those paths
- [x] CI + deploy preflight use `npm run build:unified` (`.github/workflows/*.yml`)
- [ ] Smoke-test after deploy: `/` (SPA waitlist) + `/home` signed-in + `/auth`

---

## Commands cheat sheet

```bash
npm run dev              # React product app → http://localhost:8080/ (landing)
npm run dev:site         # Astro marketing only → http://localhost:4321/about
npm run build            # React only → dist/ (SPA index.html)
npm run build:site       # Astro only → apps/site/dist/
npm run build:unified    # Production: both merged → dist/
```

---

## Related docs

- [active-surface.md](./active-surface.md) — what routes/features are shipped
- [route-gating-system.md](../systems/routing/route-gating-system.md) — `ProtectedRoute` / `PublicOnlyRoute`
- [vercel-frontend-setup.md](./vercel-frontend-setup.md) — Vercel env and deploy
- [apps/site/README.md](../../apps/site/README.md) — short pointer for Astro package
