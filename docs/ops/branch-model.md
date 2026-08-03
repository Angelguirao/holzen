# Branch model and GitHub protection

Canonical Holzen git flow. Pairs with [cicd-overview.md](cicd-overview.md) and [deployment-sync-guide.md](deployment-sync-guide.md).

## Branches

| Branch | Deploy target | CI / deploy |
|--------|---------------|-------------|
| Feature branches (`feature/*`, `fix/*`) | None (PR checks + Vercel **PR preview**) | `ci.yml` on PR |
| **`main`** | Production Supabase (`holzen-prod`) + Vercel Production | [deploy-production.yml](../../.github/workflows/deploy-production.yml) after CI on `main` |

**Promotion:** `feature/*` → PR → `main` → smoke [holzen.app](https://holzen.app).

There is **no** git `staging` branch. The legacy `holzen-staging` Supabase project was deleted (2026-07-16) for LifeOS. When migrations feel too risky against prod, upgrade to **Supabase Pro** and use **Branching** on `holzen-prod` — do not recreate a second Free Holzen project.

### Supabase

| Environment | Target |
|-------------|--------|
| **Production DB** | **`holzen-prod`** (`geqkxsnyqvhtascjghuu`) |
| **Product staging DB** | None today. Prefer a **Supabase Branch** on `holzen-prod` (Pro+) when needed |
| **LifeOS ledger** | Separate project **`lifeos`** — never new `lifeos_*` migrations in this repo |

**Optional Lovable editor:** feature branches only — never as prod host or migration path. See [lovable-staging-and-platform-exit.md](lovable-staging-and-platform-exit.md).

## GitHub protection — `main`

GitHub → **Settings → Branches → Add branch protection rule** (pattern: `main`):

- [ ] Require a pull request before merging
- [ ] Require status checks to pass: **`CI`**
- [ ] Require branches to be up to date before merging
- [ ] Restrict force pushes

## GitHub Environments

| Environment | Used by | Recommended |
|-------------|---------|-------------|
| `production` | `deploy-production.yml` | **Required reviewers** before deploy |

## GitHub Actions secrets

| Secret | Purpose |
|--------|---------|
| `SUPABASE_ACCESS_TOKEN` | CLI link + deploy |
| `SUPABASE_PROD_PROJECT_REF` | Production project |
| `VERCEL_TOKEN` | CI frontend deploy |
| `VERCEL_ORG_ID` | Vercel team/org id |
| `VERCEL_PROJECT_ID` | Vercel project id |
| `VITE_SUPABASE_URL` | CI / prod Vite build |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | CI / prod Vite build |
| `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` | Source map upload (optional) |

Full matrix: [cicd-overview.md](cicd-overview.md).

## Workflows

| Workflow | Trigger |
|----------|---------|
| [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) | Pull requests; push `main` / `dev` |
| [`.github/workflows/deploy-production.yml`](../../.github/workflows/deploy-production.yml) | After CI on `main`; `workflow_dispatch` |

## Local development

Prefer **local Docker** Supabase (`npm run dev:local`) for schema experiments. `npm run dev:prod` hits production — use carefully.
