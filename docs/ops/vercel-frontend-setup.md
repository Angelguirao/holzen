# Vercel frontend setup (recommended)

Holzen is a **Vite + React SPA** with client-side routing (`react-router-dom`). **Vercel** is the recommended production host after Lovable: native GitHub integration, preview URLs per PR, edge CDN, and first-class Vite support.

Netlify and Cloudflare Pages work too — same build output (`dist/`). We document Vercel first because it matches how most teams deploy Vite/React apps and avoids a separate CI deploy job when the GitHub integration is enabled.

**Related:** [production-supabase-setup.md](production-supabase-setup.md), [stripe-environment-setup.md](stripe-environment-setup.md), [platform-exit-runbook.md](platform-exit-runbook.md), [branch-model.md](branch-model.md), [vercel.json](../../vercel.json). Env sync helper: `npm run vercel:sync-env` (reads `.env.hosted` / `.env.staging.local`).

---

## Architecture: hybrid by design

Holzen does **not** run the full stack on one PaaS. After platform exit the split is intentional:

| Layer | Owner | What it runs |
|-------|--------|----------------|
| **Frontend** | Vercel (recommended) or equivalent static host | Vite build → `dist/` SPA, CDN, SPA rewrites, PWA `sw.js` |
| **Backend** | Owned **Supabase** | Postgres, Auth, RLS, Edge Functions, `pg_cron` |
| **Backend deploy** | **GitHub Actions** | `db push` + `functions deploy` → then Vercel via [vercel-ci-deploy.mjs](../../scripts/vercel-ci-deploy.mjs) ([cicd-overview.md](cicd-overview.md)) |

The browser talks to Supabase (Postgres + `invokeEdge`). Auth, AI, email, and cron live on **Edge**, not on the frontend host. Picking a frontend provider is therefore about **static asset delivery and preview DX** — not about replacing Supabase.

---

## Choosing a frontend host: Vercel vs Render vs Cloudflare

All three can serve the same artifact: `npm run build` → `dist/` with SPA fallback to `index.html`. [vercel.json](../../vercel.json) is the reference config; Netlify/Cloudflare equivalents are a rewrite rule + cache headers.

| Criterion | **Vercel** (recommended) | **Render Static Sites** | **Cloudflare Pages** |
|-----------|--------------------------|-------------------------|----------------------|
| **Fit for Holzen today** | Strong — Vite SPA, no SSR, no Node server in active `src/` | Adequate — same static output; platform strengths (Docker, workers, Redis) unused | Strong — cheap CDN; slightly more DIY for previews/observability |
| **PR preview URLs** | Native GitHub integration | Basic; less polished than Vercel | Supported; config differs |
| **Rollback** | Promote prior deployment in UI | Redeploy prior commit | Rollback to prior deployment |
| **Release correlation** | `$VERCEL_GIT_COMMIT_SHA` → `VITE_APP_VERSION` | Set via CI env at build time | `$CF_PAGES_COMMIT_SHA` or CI |
| **PWA / deep links** | Documented in §4 below | Same rewrite pattern | Same; watch Worker vs Pages routing |
| **When it wins** | Default for team velocity + docs already in-repo | You later add a **Render Web Service** (BFF, workers, Redis) on the same vendor | Cost/bandwidth at scale; future **Workers** at the edge |

### Why not move “backend” to Render?

Render excels at **long-running services** (Node API, containers, background workers). Holzen’s active path uses **Supabase Edge Functions** and **Postgres** — moving API work to Render would add a third runtime without removing Supabase. Only consider a Render **Web Service** if you introduce a dedicated BFF or workloads Edge cannot host (long CPU, large stateful processes, non-HTTP workers).

### When to reconsider Vercel

- **Cost or limits** — build minutes, bandwidth, or seat pricing at your scale
- **Compliance** — data residency or vendor requirements Vercel cannot meet
- **New server tier** — SSR, Remix, or a Node BFF that should not run on Edge
- **Single-vendor preference** — you deliberately want static site + API + Redis on Render (accept operating two backends: Render + Supabase until you migrate more)

Until one of those applies, **Vercel + Supabase + GitHub Actions** is the documented hybrid; changing frontend host is a config swap, not an architecture rewrite.

---

## 1. Import the repo

1. [vercel.com/new](https://vercel.com/new) → Import **GitHub** → select `holzen`
2. **Production branch:** `main`
3. Vercel auto-detects **Vite** from [vercel.json](../../vercel.json) (`buildCommand`, `outputDirectory`)

No `vercel deploy` CLI required for day-to-day **local** work — release branches deploy via GitHub Actions. PR previews still auto-deploy from the Vercel Git integration.

---

## 2. Environment variables (Production + Preview)

Project → Settings → Environment Variables:

| Variable | Production | Preview | Notes |
|----------|------------|---------|--------|
| `VITE_SUPABASE_URL` | owned prod URL | staging URL | From Supabase dashboard |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | prod anon key | staging anon key | Never service role |
| `VITE_APP_VERSION` | `$VERCEL_GIT_COMMIT_SHA` | same | Matches edge `SENTRY_RELEASE` after backend deploy |
| `VITE_SITE_ORIGIN` | `https://holzen.app` | preview URL or staging | SEO canonical / OG |
| `VITE_SENTRY_DSN` | prod DSN | optional | Frontend errors |
| `VITE_POSTHOG_KEY` | prod key | staging key | Product analytics |
| `VITE_POSTHOG_HOST` | `https://us.i.posthog.com` | same | |
| `VITE_ADMIN_USER_IDS` | comma UUIDs | optional | `/admin` gate |

**Build-only (Production):** add `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` if you want source maps uploaded during `npm run build` (Vite Sentry plugin no-ops without them).

Preview deployments should point at **staging Supabase**, not production — use Vercel **Preview** environment scope for staging keys.

To sync Production vars from local `.env.hosted` / `.env.staging.local`:

```sh
node scripts/vercel-sync-env.mjs
```

Preview vars may require the dashboard (“All Previews”) if the CLI asks for a Git branch and the repo is not linked yet.

### Preview environment (dashboard copy-paste)

In Vercel → **holzen** → Settings → Environment Variables, add each row to **Preview** and choose **All Previews** (not Production). Values for staging come from [`.env.staging.example`](../../.env.staging.example) / your gitignored `.env.staging.local`.

| Variable | Value (Preview) | Notes |
|----------|-----------------|--------|
| `VITE_SUPABASE_PROJECT_ID` | `ksplyxxdvandkwzundql` | holzen-staging |
| `VITE_SUPABASE_URL` | `https://ksplyxxdvandkwzundql.supabase.co` | |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Staging **publishable** key from Supabase → Project Settings → API | Never the service role key |
| `VITE_APP_VERSION` | `$VERCEL_GIT_COMMIT_SHA` | Same as Production; ties to edge `SENTRY_RELEASE` |
| `VITE_SITE_ORIGIN` | *(optional)* preview deployment URL | Omit to use `https://holzen.app` fallback from `vite.config.ts` |
| `VITE_POSTHOG_KEY` | Same as prod or a staging PostHog project key | Optional for PR analytics |
| `VITE_POSTHOG_HOST` | `https://eu.i.posthog.com` | Match prod if using one PostHog project |
| `VITE_ADMIN_USER_IDS` | *(empty or comma UUIDs)* | Optional `/admin` gate on previews |
| `VITE_SENTRY_DSN` | *(optional)* | Frontend errors on preview |

**Production** (already set via CLI; re-sync with `node scripts/vercel-sync-env.mjs`):

| Variable | Value (Production) |
|----------|-------------------|
| `VITE_SUPABASE_PROJECT_ID` | `geqkxsnyqvhtascjghuu` |
| `VITE_SUPABASE_URL` | `https://geqkxsnyqvhtascjghuu.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Prod publishable key (`.env.hosted`) |
| `VITE_APP_VERSION` | `$VERCEL_GIT_COMMIT_SHA` |
| `VITE_SITE_ORIGIN` | `https://holzen.app` |
| `VITE_POSTHOG_KEY` / `VITE_POSTHOG_HOST` | From `.env.hosted` |
| `VITE_ADMIN_USER_IDS` | From `.env.hosted` |

---

## 3. Custom domain

1. Vercel → Project → Domains → add `holzen.app` (+ `www` if desired)
2. Update DNS per Vercel instructions (usually CNAME to `cname.vercel-dns.com`)
3. Supabase Auth → URL configuration: add `https://holzen.app/**` to redirect allow list
4. PostHog / Sentry allowed domains if applicable

---

## 4. SPA routing + PWA

[vercel.json](../../vercel.json) rewrites unknown paths to `index.html` (React Router) while leaving `/assets/*`, `sw.js`, and static files untouched.

After first deploy, verify:

- `/welcome`, `/pause`, deep links load on refresh (not 404)
- `/sw.js` returns 200 (PWA service worker)

---

## 5. Relationship to backend deploy

| Layer | Owner | Trigger |
|-------|--------|---------|
| **Frontend** | Vercel | GitHub Actions `deploy-frontend` after backend ([cicd-overview.md](cicd-overview.md)) |
| **DB + Edge** | Supabase | Same workflow, `deploy-backend` job first |

Order for releases: merge to `staging` or `main` → **preflight** (`test:ci` + build) → **backend** (migrations + edges) → **frontend** (Vercel prebuilt deploy) → confirm `VITE_APP_VERSION` / `SENTRY_RELEASE` / `EDGE_RELEASE` equal the Git SHA.

Vercel Git auto-deploy is **disabled** for `main` and `staging` in [vercel.json](../../vercel.json) so the frontend cannot ship before the backend. **PR previews** on feature branches remain automatic.

Optional: assign a **branch domain** (e.g. `staging.holzen.app` → branch `staging`) in Vercel for a stable staging URL.

---

## 5.1 Pre-launch: gate production (not public-ready)

Use when **prod is deployed** but you are **not ready for public traffic**. Any gate on the **SPA only** leaves Supabase (auth, API, edges) public if someone has the anon key — acceptable for founder/test accounts, not a full backend lockdown.

### Vercel Deployment Protection vs `holzen.app`

On the Holzen project, **Password Protection** and **Vercel Authentication** for **custom domains** (e.g. `holzen.app`, `www`) require **Pro + Advanced Deployment Protection** (~$150/mo add-on). The dashboard may show those toggles, but they do not apply to the branded domain without that plan.

**What still works without Advanced:**

| Surface | Password / Vercel Auth | Notes |
|---------|------------------------|--------|
| `*.vercel.app` deployment URL | Often yes | Enable protection on **Preview** / default hostname; QA on that URL, not `holzen.app` |
| **`holzen.app` (custom domain)** | No (without Advanced) | Needs one of the options below |

**With Advanced:** enable Password or Vercel Authentication on **Production**, incognito-test `https://holzen.app`, use **Shareable Links** or **Protection Bypass** (`VERCEL_AUTOMATION_BYPASS_SECRET` + `x-vercel-protection-bypass`) for outsiders / CI.

### Option A — Detach or park the custom domain (free, immediate)

1. **Vercel** → **Domains** → remove `holzen.app` / `www` from **Production**, **or**
2. **DNS** (registrar) → point `holzen.app` to a static “not open yet” page (registrar parking, Cloudflare holding page, etc.).

Prod build can stay on Vercel at `project-name.vercel.app` for internal use. Public visitors who only know `holzen.app` no longer hit the app.

### Option B — QA on protected `*.vercel.app` only

Keep `holzen.app` detached or parked; enable Deployment Protection on **Preview** / use the team’s default **vercel.app** production alias if assigned. Founders test there until launch, then re-attach the custom domain and open protection off.

### Option C — Coming soon page (works on `holzen.app`, no Vercel Advanced)

Set a **Production-only** build env var, redeploy frontend:

| Variable | Production | Preview / Staging |
|----------|------------|-------------------|
| `VITE_COMING_SOON` | `true` | *(unset)* |

Vercel → Project → **Settings** → **Environment Variables** → add `VITE_COMING_SOON` = `true` scoped to **Production** only → run **Production deploy** (merge to `main` with approval, or `workflow_dispatch`).

Visitors on `holzen.app` see a minimal **Coming soon** screen (`ComingSoonScreen`) instead of auth, pause, or checkout. Staging previews and local dev stay on the full app when the var is unset.

**Launch:** delete `VITE_COMING_SOON` (or set `false`) on Production → redeploy → incognito smoke shows the full app.

**Limits:** Same as any SPA gate — Supabase anon key and edges remain public; this blocks normal product UI only.

### Option D — Pay for Advanced Deployment Protection

Single vendor solution for password or Vercel Auth on `holzen.app`.

### While not public

- Do **not** merge to **`main`** unless you intend to update prod; work on **`staging`** ([branch-model.md](./branch-model.md)).
- **Required reviewers** on GitHub **`production`** environment.
- Optional: Supabase prod → Auth → disable new signups.

### Remove at launch

1. Re-attach `holzen.app` if detached; disable Vercel protection / remove app access env / restore DNS.
2. Incognito: `holzen.app` loads Holzen with no gate.
3. [launch-runbook.md](./launch-runbook.md) / [ship-checklist.md](./ship-checklist.md).

---

## 6. Rollback

- **Frontend:** Vercel → Deployments → Promote previous deployment (instant)
- **Backend:** redeploy prior Git SHA via GitHub workflow or `npm run prod:deploy` from tagged commit

---

## 7. Optional: CLI deploy

For one-off deploys without GitHub:

```sh
npm i -g vercel
vercel login
vercel --prod
```

Set the same `VITE_*` env vars in the Vercel project first.

---

## Why not only GitHub Actions for frontend?

PR previews use the **GitHub ↔ Vercel integration** (preview URLs, deployment comments) without extra YAML. **`main` and `staging`** frontend deploys run in Actions **after** Supabase so backend and frontend stay ordered — see [cicd-overview.md](cicd-overview.md). Backend stays on GitHub Actions because Supabase CLI deploy is not Vercel’s job.
