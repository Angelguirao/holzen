# Vercel frontend setup (recommended)

Holzen is a **Vite + React SPA** with client-side routing (`react-router-dom`). **Vercel** is the recommended production host after Lovable: native GitHub integration, preview URLs per PR, edge CDN, and first-class Vite support.

Netlify and Cloudflare Pages work too — same build output (`dist/`). We document Vercel first because it matches how most teams deploy Vite/React apps and avoids a separate CI deploy job when the GitHub integration is enabled.

**Related:** [production-supabase-setup.md](production-supabase-setup.md), [platform-exit-runbook.md](platform-exit-runbook.md), [vercel.json](../../vercel.json).

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
