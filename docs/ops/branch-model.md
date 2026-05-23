# Branch model and GitHub protection

Canonical branch flow for platform exit (owned Supabase + Vercel). Pairs with [platform-exit-runbook.md](platform-exit-runbook.md) and [deployment-sync-guide.md](deployment-sync-guide.md).

## Branches

| Branch | Deploy target | CI / deploy |
|--------|---------------|-------------|
| Feature branches (`feature/*`, `fix/*`) | None (PR checks only) | `ci.yml` on PR |
| **`staging`** | Staging Supabase + optional Vercel Preview | `staging-backend.yml` on push; Vercel Preview if connected |
| **`main`** | Production Supabase + Vercel Production | `deploy-production.yml` on push (with environment approval); Vercel Production |

**Promotion:** merge features → `staging` → smoke → merge `staging` → `main`. **Hotfixes:** branch from `main`, merge back to `main`, then merge `main` → `staging` to keep them aligned.

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
| `staging` | `staging-backend.yml` | Required reviewers optional |
| `production` | `deploy-production.yml` | **Required reviewers** before deploy |

### 5. GitHub Actions secrets

| Secret | Purpose |
|--------|---------|
| `SUPABASE_ACCESS_TOKEN` | CLI link + deploy |
| `SUPABASE_STAGING_PROJECT_REF` | Staging project |
| `SUPABASE_PROD_PROJECT_REF` | Production project |
| `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` | Source map upload in CI (optional) |

Frontend `VITE_*` for CI builds live in GitHub Actions and/or Vercel — not Supabase Edge secrets. See [observability-setup.md](observability-setup.md).

## Workflows (reference)

| Workflow | Trigger |
|----------|---------|
| [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) | Pull requests |
| [`.github/workflows/staging-backend.yml`](../../.github/workflows/staging-backend.yml) | Push to `staging`, `workflow_dispatch` |
| [`.github/workflows/deploy-production.yml`](../../.github/workflows/deploy-production.yml) | Push to `main`, `workflow_dispatch` |

## Phase 4 secret cleanup

After Resend auth hook + webhooks are live on owned Supabase, remove **`LOVABLE_API_KEY`** from Edge secrets in **both** staging and prod dashboards. See [platform-exit-runbook.md](platform-exit-runbook.md) Phase 4.
