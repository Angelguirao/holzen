# Branch model and GitHub protection

Canonical branch flow for platform exit (owned Supabase + Vercel). Pairs with [platform-exit-runbook.md](platform-exit-runbook.md) and [deployment-sync-guide.md](deployment-sync-guide.md).

## Branches

| Branch | Deploy target | CI / deploy |
|--------|---------------|-------------|
| Feature branches (`feature/*`, `fix/*`) | None (PR checks only) | `ci.yml` on PR; Vercel **PR preview** (auto) |
| **`staging`** | Staging Supabase + Vercel Preview (`staging` branch) | [staging-deploy.yml](../../.github/workflows/staging-deploy.yml) on push (backend → frontend) |
| **`main`** | Production Supabase + Vercel Production | [deploy-production.yml](../../.github/workflows/deploy-production.yml) on push (backend → frontend; **`production`** environment approval recommended) |

**Promotion:** merge features → `staging` → smoke → merge `staging` → `main`. **Hotfixes:** branch from `main`, merge back to `main`, then merge `main` → `staging` to keep them aligned.

**Optional Lovable editor:** Lovable may stay connected for UI work on **`feature/*` branches only** — never as prod host or migration path. Full rules: [lovable-staging-and-platform-exit.md](lovable-staging-and-platform-exit.md) § Optional Lovable editor.

## One-time setup

### 1. Create `staging` branch

From an up-to-date `main`:

```bash
git checkout main
git pull origin main
git checkout -b staging
git push -u origin staging
```

Keep `staging` updated by merging `main` (or feature PRs) regularly.

### 2. GitHub branch protection — `main`

GitHub → **Settings → Branches → Add branch protection rule** (pattern: `main`):

- [ ] Require a pull request before merging (1 approval recommended)
- [ ] Require status checks to pass: **`CI`** (from `.github/workflows/ci.yml`)
- [ ] Require branches to be up to date before merging
- [ ] Do not allow bypassing the above settings (except admins if needed)
- [ ] Restrict who can push (optional — force pushes disabled)

### 3. GitHub branch protection — `staging` (recommended)

Same as `main`, but optionally allow direct pushes for fast staging iteration. Minimum: require **`CI`** on PRs into `staging`.

### 4. GitHub Environments

**Settings → Environments:**

| Environment | Used by | Recommended |
|-------------|---------|-------------|
| `staging` | `staging-deploy.yml` | Required reviewers optional |
| `production` | `deploy-production.yml` | **Required reviewers** before deploy |

### 5. GitHub Actions secrets

| Secret | Purpose |
|--------|---------|
| `SUPABASE_ACCESS_TOKEN` | CLI link + deploy |
| `SUPABASE_STAGING_PROJECT_REF` | Staging project |
| `SUPABASE_PROD_PROJECT_REF` | Production project |
| `VERCEL_TOKEN` | CI frontend deploy ([vercel-ci-deploy.mjs](../../scripts/vercel-ci-deploy.mjs)) |
| `VERCEL_ORG_ID` | Vercel team/org id (from `vercel link` / `.vercel/project.json`) |
| `VERCEL_PROJECT_ID` | Vercel project id |
| `VITE_SUPABASE_STAGING_URL` | Staging preflight build in Actions |
| `VITE_SUPABASE_STAGING_PUBLISHABLE_KEY` | Staging preflight build in Actions |
| `VITE_SUPABASE_URL` | CI / prod preflight build |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | CI / prod preflight build |
| `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` | Source map upload in CI (optional) |

Full matrix and flow: [cicd-overview.md](cicd-overview.md).

Frontend runtime `VITE_*` for deployed sites live in **Vercel** project env — not Supabase Edge secrets. See [observability-setup.md](observability-setup.md).

## Workflows (reference)

| Workflow | Trigger |
|----------|---------|
| [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) | Pull requests; push `main` / `staging` / `dev` |
| [`.github/workflows/staging-deploy.yml`](../../.github/workflows/staging-deploy.yml) | Push to `staging`, `workflow_dispatch` — preflight → backend → Vercel preview |
| [`.github/workflows/deploy-production.yml`](../../.github/workflows/deploy-production.yml) | Push to `main`, `workflow_dispatch` — preflight → backend → Vercel production |

End-to-end diagram, secrets, and troubleshooting: **[cicd-overview.md](cicd-overview.md)**.

## Optional `dev` branch

Not required. Some teams add **`dev`** as a long-lived integration branch (`feature/* → dev → staging → main`). Holzen defaults to **feature → staging → main**; add `dev` only if you want an extra integration step before formal staging QA. Do **not** point `dev` at Lovable Cloud — use owned staging or local Docker. See [lovable-staging-and-platform-exit.md](lovable-staging-and-platform-exit.md) § Three environments.

## Phase 4 secret cleanup

After Resend auth hook + webhooks are live on owned Supabase, remove **`LOVABLE_API_KEY`** from Edge secrets in **both** staging and prod dashboards. See [platform-exit-runbook.md](platform-exit-runbook.md) Phase 4.
