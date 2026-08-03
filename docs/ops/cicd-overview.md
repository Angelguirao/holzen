# CI/CD overview

Canonical map of how Holzen validates, deploys, and correlates releases across **GitHub Actions**, **Supabase**, and **Vercel**.

**Related:** [branch-model.md](branch-model.md) · [deployment-sync-guide.md](deployment-sync-guide.md) · [vercel-frontend-setup.md](vercel-frontend-setup.md) · [platform-exit-runbook.md](platform-exit-runbook.md)

---

## Summary

| Stage | Trigger | What runs | Goes live |
|-------|---------|-----------|-----------|
| **CI** | Pull request (and pushes to `main` / `dev`) | `test:ci` + unified build; on `main` also uploads **Vercel prebuilt** artifact | Nothing deploys |
| **Production deploy** | **After CI succeeds** on `main`; manual dispatch (+ optional approval) | Change detection → backend (if needed) → frontend deploy from CI artifact | Prod Supabase (`holzen-prod`) + Vercel **Production** |
| **PR previews** | Pull request to any branch | Vercel Git integration (automatic) | Ephemeral preview URL (may share `holzen-prod` until Supabase Branching) |

**Promotion:** `feature/*` → PR → `main` → production. There is **no** git `staging` branch and **no** `holzen-staging` Supabase project. Prefer **local Docker** for schema work; upgrade to Supabase Pro **Branching** on `holzen-prod` later if you need isolated hosted preview DBs.

**Design choice:** `main` frontend deploys run **only from GitHub Actions** after backend succeeds. Vercel Git auto-deploy is **disabled** for `main` ([vercel.json](../../vercel.json) `git.deploymentEnabled`) so the SPA never races ahead of migrations/edges. Feature-branch **PR previews** still auto-deploy via Vercel.

**Speed:** Deploy workflows **do not re-run `test:ci`** — they trigger via `workflow_run` after the **CI** workflow passes on the same commit. CI uploads `.vercel/output`; deploy downloads it and runs `vercel deploy --prebuilt` only (~30s). **Path filters** skip `deploy-backend` on frontend-only changes and skip `deploy-frontend` on backend-only changes. Docs-only pushes may skip deploy entirely.

---

## End-to-end flow

```mermaid
flowchart TB
  subgraph prod [Push to main]
    CIprod[CI: test:ci + build + vercel prebuilt artifact]
    DCprod[detect-changes]
    PV[validate-secrets]
    PB[deploy-backend if supabase changed]
    PF[deploy-frontend: prebuilt deploy]
    CIprod -->|workflow_run success| DCprod --> PV
    PV --> PB --> PF
    PV --> PF
  end

  subgraph pr [Pull request]
    CIpr[ci.yml test + build]
    VP[Vercel PR preview auto]
    CIpr
  end
```

---

## Workflows

| File | Name | Trigger | Jobs |
|------|------|---------|------|
| [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) | CI | PR; push `main` / `dev` | `test:ci` + `build:unified`; uploads `vercel-prebuilt` on `main` |
| [`.github/workflows/deploy-production.yml`](../../.github/workflows/deploy-production.yml) | Production deploy | After **CI** on `main`; manual | `detect-changes` → `validate-secrets` → `deploy-backend?` → `deploy-frontend` |

### Job details

**validate-secrets** — **First job, fast fail.** Runs [`scripts/check-cicd-env.mjs`](../../scripts/check-cicd-env.mjs) across **GitHub Actions**, **Vercel**, and **Supabase Edge** (deploy profiles only) before install/test/deploy. Each missing variable prints **name**, **platform**, **where to set it**, **how to obtain the value**, and a **docs link**. GitHub Actions also shows per-variable error annotations on the job.

Catalog source of truth: [`scripts/lib/cicd-env-catalog.mjs`](../../scripts/lib/cicd-env-catalog.mjs).

**CI (release branch)** — After `test:ci` + `build:unified`, on push to `main` runs [`vercel-ci-deploy.mjs --mode=build`](../../scripts/vercel-ci-deploy.mjs) and uploads `.vercel/output` as the **`vercel-prebuilt`** artifact. CI and preflight builds use production `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` GitHub secrets.

**detect-changes** — Compares `HEAD^..HEAD` via [`dorny/paths-filter`](https://github.com/dorny/paths-filter). Skips backend on frontend-only diffs and frontend on backend-only diffs. Manual `workflow_dispatch` always ships both surfaces.

**preflight** — **Manual dispatch only.** Re-runs `test:ci`, builds, and uploads the prebuilt artifact when CI did not run first.

**deploy-backend** — Runs when `supabase/**` or edge deploy scripts changed. `npm run stamp:release` → `supabase link` → `supabase db push` → [`scripts/deploy-active-edge-functions.mjs --base=<parent>`](../../scripts/deploy-active-edge-functions.mjs) (only changed functions; all if `_shared`/config changed; skip if migrations-only). Manual dispatch uses `--force-all`.

**deploy-frontend** — Downloads the CI (or preflight) **`vercel-prebuilt`** artifact into **`.vercel/output`**, then [`vercel-ci-deploy.mjs --mode=deploy --skip-build`](../../scripts/vercel-ci-deploy.mjs): `vercel pull` → `vercel deploy --prebuilt` (~30s). Runs after backend when backend ran; runs alone on frontend-only changes. **One Vercel project** — see [marketing-site-split.md](marketing-site-split.md).

**Recommended secrets** — Missing recommended vars (BetterStack, Slack, Perplexity, `VITE_SENTRY_DSN`, …) emit GitHub **warnings**, not errors, and do not block deploy. Fill via Dashboard / `npm run prod:secrets-set` when ready.

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
# PR / CI — GitHub only (prod VITE_* build secrets)
npm run check:cicd-env -- --profile=ci --platform=github

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

| Secret | Production |
|--------|------------|
| `SUPABASE_ACCESS_TOKEN` | ✓ |
| `SUPABASE_PROD_PROJECT_REF` | ✓ |

### Vercel (frontend CI deploy)

| Secret | How to obtain |
|--------|----------------|
| `VERCEL_TOKEN` | [Vercel account tokens](https://vercel.com/account/tokens) — scope: deploy |
| `VERCEL_ORG_ID` | `vercel link` → `.vercel/project.json` → `orgId` (or team settings) |
| `VERCEL_PROJECT_ID` | `.vercel/project.json` → `projectId` |

### Frontend build (CI + prod preflight)

| Secret | Used by |
|--------|---------|
| `VITE_SUPABASE_URL` | CI on PR + `main` prebuilt build |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | CI on PR + `main` prebuilt build |

Optional on GitHub: `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` — prefer **Vercel** for source-map upload (see below).

---

## Vercel project environment {#vercel-project-environment}

Set in **Vercel → holzen → Settings → Environment Variables**. Sync helper: `npm run vercel:sync-env` (Preview → **All Previews** by default; optional `--preview-branch=<branch>` for scoped overrides).

### Preview (PR previews)

| Variable | Tier | Notes |
|----------|------|--------|
| `VITE_SUPABASE_URL` | required | Until Branching: may share prod URL `https://geqkxsnyqvhtascjghuu.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | required | Until Branching: may share prod anon key |
| `VITE_SUPABASE_PROJECT_ID` | required | `geqkxsnyqvhtascjghuu` until Branching |
| `VITE_APP_VERSION` | required | `$VERCEL_GIT_COMMIT_SHA` |
| `VITE_POSTHOG_KEY` | recommended | Product analytics |
| `VITE_POSTHOG_HOST` | recommended | e.g. `https://eu.i.posthog.com` |
| `VITE_SENTRY_DSN` | recommended | Frontend errors |

Prefer **local Docker** for schema/migration work. Do not recreate a second Free Holzen Supabase project. When you need isolated hosted preview DBs, upgrade to **Supabase Pro Branching** on `holzen-prod`.

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

Set on **`holzen-prod`**: **Dashboard → Edge Functions → Secrets**. Apply from a gitignored file:

```sh
cp .env.prod.secrets.example .env.prod.secrets
npm run prod:secrets-set
```

### Required (production)

| Secret | Purpose |
|--------|---------|
| `RESEND_API_KEY` | Auth + transactional email |
| `SEND_EMAIL_HOOK_SECRET` | Supabase Auth Send Email Hook |
| `OPENROUTER_API_KEY` | Gemini via OpenRouter / pause AI |
| `STRIPE_SECRET_KEY` | Subscriptions (live on prod) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signature |
| `STRIPE_PRICE_ID_PRO` | Pro subscription price |
| `CRON_SECRET` | pg_cron → edge HTTP auth |
| `SENTRY_DSN_EDGES` | Edge error reporting |
| `SENTRY_ENVIRONMENT` | `production` |

### Recommended

| Secret | Purpose |
|--------|---------|
| `LOG_DRAIN_URL` / `LOG_DRAIN_TOKEN` | BetterStack structured logs (no-op when unset) |
| `SLACK_WEBHOOK_URL` | `#holzen-alerts` (no-op when unset) |
| `RESEND_WEBHOOK_SECRET` | Bounce/complaint suppression |
| `STRIPE_PRICE_ID_FLEX_PACK_S` / `_M` | Flex packs |
| `OPENROUTER_API_KEY` | LLM failover |
| `PERPLEXITY_API_KEY` | Companion / feed generators |

Detail: [observability-setup.md](observability-setup.md), [resend-environment-setup.md](resend-environment-setup.md), [stripe-environment-setup.md](stripe-environment-setup.md).

---

## Vercel configuration (deploy behavior)

### Disabled auto-deploy for `main`

[vercel.json](../../vercel.json):

```json
"git": {
  "deploymentEnabled": {
    "main": false
  }
}
```

**PR previews** on `feature/*` branches remain enabled (default). Only `main` is orchestrated through Actions.

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
2. Smoke against local Docker (and/or a careful prod-like session) — [ship-checklist.md](ship-checklist.md). Prefer local Docker for schema changes.
3. Merge PR to **`main`** → **CI** green → approve **Production deploy** if required.
4. Confirm prod URL + `VITE_APP_VERSION` / edge release SHA match.

---

## Local equivalents

| CI step | Local command |
|---------|----------------|
| CI gate | `npm run test:ci` |
| Build | `npm run build` |
| Full pre-push | `npm run check:prepush` (bash) |
| Prod backend only | `npm run prod:deploy` |
| Vercel deploy (manual) | `vercel --prod` or `node scripts/vercel-ci-deploy.mjs --environment=production` with `VERCEL_*` env |

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Workflow fails at `validate-secrets` | Missing var on GitHub, Vercel, or Supabase | Read job log — each entry has **Where** + **How**; run `npm run check:cicd-env -- --profile=… --platform=all` |
| Migrations fail mid-batch | Ownership / SQL error | [deployment-sync-guide.md](deployment-sync-guide.md) § migration errors |
| Frontend works, API 401 / column missing | Backend job failed or skipped | Check `deploy-backend` logs; re-run workflow |
| PR has preview, `main` does not | Expected — `main` is Actions-only | Confirm **Production deploy** `deploy-frontend` job; check `VERCEL_*` secrets |
| Double production deploy | Old Vercel auto-deploy still on | Confirm `vercel.json` `git.deploymentEnabled` merged; redeploy project settings |

---

## What we intentionally do not do

- **Single PaaS deploy** — Supabase owns DB/Edge; Vercel owns static SPA.
- **Vercel auto-deploy on `main`** — avoids frontend/backend race.
- **Git `staging` branch / `holzen-staging` Supabase** — deleted; use local Docker now, Pro Branching later.
- **Deploy all edge functions** — only `[functions.*]` entries in `config.toml` ([deploy-active-edge-functions.mjs](../../scripts/deploy-active-edge-functions.mjs)).
- **E2E in CI** — optional manual smoke; see [ship-checklist.md](ship-checklist.md).
