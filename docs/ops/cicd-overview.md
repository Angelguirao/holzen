# CI/CD overview

Canonical map of how Holzen validates, deploys, and correlates releases across **GitHub Actions**, **Supabase**, and **Vercel**.

**Related:** [branch-model.md](branch-model.md) · [deployment-sync-guide.md](deployment-sync-guide.md) · [vercel-frontend-setup.md](vercel-frontend-setup.md) · [platform-exit-runbook.md](platform-exit-runbook.md)

---

## Summary

| Stage | Trigger | What runs | Goes live |
|-------|---------|-----------|-----------|
| **CI** | Pull request (and pushes to `main` / `staging` / `dev`) | `test:ci` + `build` | Nothing deploys |
| **Staging deploy** | Push to `staging` | Backend → frontend (ordered) | Staging Supabase + Vercel **Preview** for `staging` branch |
| **Production deploy** | Push to `main` (+ optional approval) | Backend → frontend (ordered) | Prod Supabase + Vercel **Production** |
| **PR previews** | Pull request to any branch | Vercel Git integration (automatic) | Ephemeral preview URL (staging Supabase keys) |

**Design choice:** `main` and `staging` frontend deploys run **only from GitHub Actions** after backend succeeds. Vercel Git auto-deploy is **disabled** for those branches ([vercel.json](../../vercel.json) `git.deploymentEnabled`) so the SPA never races ahead of migrations/edges. Feature-branch **PR previews** still auto-deploy via Vercel.

---

## End-to-end flow

```mermaid
flowchart TB
  subgraph stg [Push to staging]
    SV[validate-secrets]
    SP[preflight: test:ci + build]
    SB[deploy-backend: db push + edges]
    SF[deploy-frontend: vercel preview]
    SV --> SP --> SB --> SF
  end

  subgraph prod [Push to main]
    PV[validate-secrets]
    PP[preflight: test:ci + build]
    PB[deploy-backend: db push + edges]
    PF[deploy-frontend: vercel production]
    PV --> PP --> PB --> PF
  end

  subgraph pr [Pull request]
    VS[validate-secrets]
    CI[ci.yml test + build]
    VP[Vercel PR preview auto]
    VS --> CI
  end
```

---

## Workflows

| File | Name | Trigger | Jobs |
|------|------|---------|------|
| [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) | CI | PR; push `main` / `staging` / `dev` | `validate-secrets` → `test:ci` + `build` |
| [`.github/workflows/staging-backend.yml`](../../.github/workflows/staging-backend.yml) | Staging deploy | Push `staging`; manual | `validate-secrets` → `preflight` → `deploy-backend` → `deploy-frontend` |
| [`.github/workflows/deploy-production.yml`](../../.github/workflows/deploy-production.yml) | Production deploy | Push `main`; manual | Same chain; `production` environment approval recommended |

### Job details

**validate-secrets** — **First job, fast fail.** Runs [`scripts/check-cicd-env.mjs`](../../scripts/check-cicd-env.mjs) across **GitHub Actions**, **Vercel**, and **Supabase Edge** (deploy profiles only) before install/test/deploy. Each missing variable prints **name**, **platform**, **where to set it**, **how to obtain the value**, and a **docs link**. GitHub Actions also shows per-variable error annotations on the job.

Catalog source of truth: [`scripts/lib/cicd-env-catalog.mjs`](../../scripts/lib/cicd-env-catalog.mjs).

**preflight** — Same gate as merge quality: `npm run test:ci` (fitness checks + Vitest coverage) and `npm run build`. Staging preflight uses **staging** Supabase build secrets; production uses **prod** secrets.

**deploy-backend** — `npm run stamp:release` → `supabase link` → `supabase db push` → [`scripts/deploy-active-edge-functions.mjs`](../../scripts/deploy-active-edge-functions.mjs).

**deploy-frontend** — [`scripts/vercel-ci-deploy.mjs`](../../scripts/vercel-ci-deploy.mjs): `vercel pull` → `vercel build` → `vercel deploy --prebuilt`. Runs **only after** backend succeeds.

---

## Environment validation (all platforms)

Holzen splits configuration across three surfaces. **Do not** put Edge secrets in GitHub or Vercel, and **do not** put `VITE_*` build vars in Supabase Edge secrets.

| Surface | What it configures | Where to set | Validated by |
|---------|-------------------|--------------|--------------|
| **GitHub Actions secrets** | CI build + deploy orchestration tokens | GitHub → Settings → Secrets and variables → Actions | `check-cicd-env --platform=github` |
| **Vercel env vars** | Runtime `VITE_*` for deployed SPA | Vercel → holzen → Settings → Environment Variables | `check-cicd-env --platform=vercel` (live API audit) |
| **Supabase Edge secrets** | Edge function runtime (AI, email, Stripe, observability) | Supabase Dashboard → project → Edge Functions → Secrets | `check-cicd-env --platform=supabase` (CLI audit) |

### Commands

```sh
# PR / CI — GitHub only (2 vars)
npm run check:cicd-env -- --profile=ci --platform=github

# Staging deploy — all three platforms
npm run check:cicd-env -- --profile=staging --platform=all

# Production deploy — all three platforms
npm run check:cicd-env -- --profile=production --platform=all

# Fail on recommended vars too (PostHog, Perplexity, flex Stripe prices, …)
npm run check:cicd-env -- --profile=production --platform=all --strict-recommended
```

Export GitHub secret **values** into your shell when running locally (Actions injects them automatically). Vercel/Supabase audits use `VERCEL_*` + `SUPABASE_ACCESS_TOKEN` from the environment.

### Tier semantics

| Tier | CI behavior |
|------|-------------|
| **required** | Workflow **fails** until set |
| **recommended** | Logged with fix instructions; **warn only** unless `--strict-recommended` |

---

## GitHub Actions secrets

Configure in **Settings → Secrets and variables → Actions** (repository secrets).

### Supabase (backend)

| Secret | Staging | Production |
|--------|---------|------------|
| `SUPABASE_ACCESS_TOKEN` | ✓ | ✓ |
| `SUPABASE_STAGING_PROJECT_REF` | ✓ | — |
| `SUPABASE_PROD_PROJECT_REF` | — | ✓ |

### Vercel (frontend CI deploy)

| Secret | How to obtain |
|--------|----------------|
| `VERCEL_TOKEN` | [Vercel account tokens](https://vercel.com/account/tokens) — scope: deploy |
| `VERCEL_ORG_ID` | `vercel link` → `.vercel/project.json` → `orgId` (or team settings) |
| `VERCEL_PROJECT_ID` | `.vercel/project.json` → `projectId` |

### Frontend build (preflight + Vercel env)

| Secret | Used by |
|--------|---------|
| `VITE_SUPABASE_STAGING_URL` | Staging preflight build |
| `VITE_SUPABASE_STAGING_PUBLISHABLE_KEY` | Staging preflight build |
| `VITE_SUPABASE_URL` | CI on PR / prod preflight |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | CI on PR / prod preflight |

Optional on GitHub: `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` — prefer **Vercel** for source-map upload (see below).

---

## Vercel project environment {#vercel-project-environment}

Set in **Vercel → holzen → Settings → Environment Variables**. Sync helper: `npm run vercel:sync-env`.

### Preview (staging SPA + PR previews)

| Variable | Tier | Notes |
|----------|------|--------|
| `VITE_SUPABASE_URL` | required | Staging URL `https://ksplyxxdvandkwzundql.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | required | Staging anon key |
| `VITE_SUPABASE_PROJECT_ID` | required | `ksplyxxdvandkwzundql` |
| `VITE_APP_VERSION` | required | `$VERCEL_GIT_COMMIT_SHA` |
| `VITE_POSTHOG_KEY` | recommended | Product analytics |
| `VITE_POSTHOG_HOST` | recommended | e.g. `https://eu.i.posthog.com` |
| `VITE_SENTRY_DSN` | recommended | Frontend errors |

### Production

| Variable | Tier | Notes |
|----------|------|--------|
| `VITE_SUPABASE_URL` | required | Prod URL `https://geqkxsnyqvhtascjghuu.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | required | Prod anon key |
| `VITE_SUPABASE_PROJECT_ID` | required | `geqkxsnyqvhtascjghuu` |
| `VITE_APP_VERSION` | required | `$VERCEL_GIT_COMMIT_SHA` |
| `VITE_SITE_ORIGIN` | required | `https://holzen.app` |
| `VITE_POSTHOG_KEY` / `VITE_POSTHOG_HOST` | recommended | Analytics |
| `VITE_SENTRY_DSN` | recommended | Frontend errors |
| `SENTRY_AUTH_TOKEN` / `SENTRY_ORG` / `SENTRY_PROJECT` | recommended | Build-time source maps |

Detail: [vercel-frontend-setup.md](vercel-frontend-setup.md).

---

## Supabase Edge secrets

Set per project: **Dashboard → Edge Functions → Secrets**. Apply from gitignored files:

```sh
cp .env.staging.secrets.example .env.staging.secrets   # fill values
npm run staging:secrets-set

cp .env.prod.secrets.example .env.prod.secrets
npm run prod:secrets-set
```

### Required (staging + production)

| Secret | Purpose |
|--------|---------|
| `RESEND_API_KEY` | Auth + transactional email |
| `SEND_EMAIL_HOOK_SECRET` | Supabase Auth Send Email Hook |
| `GOOGLE_AI_API_KEY` | Gemini / pause AI |
| `STRIPE_SECRET_KEY` | Subscriptions (test on staging, live on prod) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signature |
| `STRIPE_PRICE_ID_PRO` | Pro subscription price |
| `CRON_SECRET` | pg_cron → edge HTTP auth |
| `SENTRY_DSN_EDGES` | Edge error reporting |
| `SENTRY_ENVIRONMENT` | `staging` or `production` |
| `LOG_DRAIN_URL` / `LOG_DRAIN_TOKEN` | BetterStack structured logs |
| `SLACK_WEBHOOK_URL` | `#holzen-alerts` |

### Recommended

| Secret | Purpose |
|--------|---------|
| `RESEND_WEBHOOK_SECRET` | Bounce/complaint suppression |
| `STRIPE_PRICE_ID_FLEX_PACK_S` / `_M` | Flex packs |
| `OPENROUTER_API_KEY` | LLM failover |
| `PERPLEXITY_API_KEY` | Companion / feed generators |

Detail: [observability-setup.md](observability-setup.md), [resend-environment-setup.md](resend-environment-setup.md), [stripe-environment-setup.md](stripe-environment-setup.md).

---

## Vercel configuration (deploy behavior)

### Disabled auto-deploy for release branches

[vercel.json](../../vercel.json):

```json
"git": {
  "deploymentEnabled": {
    "main": false,
    "staging": false
  }
}
```

**PR previews** on `feature/*` branches remain enabled (default). Only `main` and `staging` are orchestrated through Actions.

### Stable staging URL (recommended)

In Vercel → Project → Settings → Domains, assign a branch domain, e.g. `staging.holzen.app` → Git branch **`staging`**. Each successful **Staging deploy** workflow updates that alias.

Add the domain to Supabase Auth redirect allow list ([staging-supabase-setup.md](staging-supabase-setup.md)).

---

## Release correlation

After every deploy:

| Surface | Variable | Expected value |
|---------|----------|----------------|
| Browser | `VITE_APP_VERSION` | Git SHA of deploy commit |
| Edge | `EDGE_RELEASE` in `_shared/release.ts` | Same SHA (`npm run stamp:release` in workflow) |
| Edge Sentry | `SENTRY_RELEASE` secret | Same SHA |

Verify in workflow logs or Vercel deployment metadata.

---

## Branch promotion checklist

1. Open PR → **CI** green.
2. Merge to **`staging`** → **Staging deploy** workflow green (backend + frontend).
3. Smoke staging (Bruno / app) — [ship-checklist.md](ship-checklist.md).
4. PR **`staging` → `main`** → merge → approve **Production deploy** if required.
5. Confirm prod URL + `VITE_APP_VERSION` / edge release SHA match.

---

## Local equivalents

| CI step | Local command |
|---------|----------------|
| CI gate | `npm run test:ci` |
| Build | `npm run build` |
| Full pre-push | `npm run check:prepush` (bash) |
| Staging backend only | `npm run staging:deploy` |
| Prod backend only | `npm run prod:deploy` |
| Vercel deploy (manual) | `vercel --prod` or `node scripts/vercel-ci-deploy.mjs --environment=production` with `VERCEL_*` env |

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Workflow fails at `validate-secrets` | Missing var on GitHub, Vercel, or Supabase | Read job log — each entry has **Where** + **How**; run `npm run check:cicd-env -- --profile=… --platform=all` |
| Migrations fail mid-batch | Ownership / SQL error | [deployment-sync-guide.md](deployment-sync-guide.md) § migration errors |
| Frontend works, API 401 / column missing | Backend job failed or skipped | Check `deploy-backend` logs; re-run workflow |
| PR has preview, `staging` branch does not | Vercel token or wrong branch | Confirm **Staging deploy** `deploy-frontend` job; check `VERCEL_*` secrets |
| Double production deploy | Old Vercel auto-deploy still on | Confirm `vercel.json` `git.deploymentEnabled` merged; redeploy project settings |

---

## What we intentionally do not do

- **Single PaaS deploy** — Supabase owns DB/Edge; Vercel owns static SPA.
- **Vercel auto-deploy on `main` / `staging`** — avoids frontend/backend race.
- **Deploy all edge functions** — only `[functions.*]` entries in `config.toml` ([deploy-active-edge-functions.mjs](../../scripts/deploy-active-edge-functions.mjs)).
- **E2E in CI** — optional manual smoke; see [ship-checklist.md](ship-checklist.md).
