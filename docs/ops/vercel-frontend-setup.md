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
| **Backend deploy** | **GitHub Actions** | `db push` + `functions deploy` ([deploy-production.yml](../../.github/workflows/deploy-production.yml)) |

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

No `vercel deploy` CLI required for day-to-day use — pushes to `main` build and promote automatically.

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
| **Frontend** | Vercel | Push to `main` (or PR previews) |
| **DB + Edge** | Supabase | [deploy-production.yml](../../.github/workflows/deploy-production.yml) on `main` (with approval) |

Order for releases: merge → Vercel builds frontend automatically → approve **production** GitHub workflow for migrations + edge functions → confirm `VITE_APP_VERSION` / `SENTRY_RELEASE` both equal the same Git SHA.

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

You can add a `vercel deploy --prod --token=…` step to CI, but the **GitHub ↔ Vercel integration** gives PR preview URLs, deployment comments, and instant rollbacks with less YAML. Backend stays on GitHub Actions because Supabase CLI deploy is not Vercel’s job.
