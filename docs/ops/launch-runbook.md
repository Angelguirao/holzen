# Pause-first launch runbook

Human checklist for shipping pause-first to production. **Quick ticks:** [ship-checklist.md](./ship-checklist.md). Canonical deploy narrative: [deployment-sync-guide.md](./deployment-sync-guide.md).

## Ship status (agent-complete vs human)

| Step | Status |
| --- | --- |
| Steps 1–6 code + CI + docs | ✅ on integration branch |
| `git push` | Set `VITE_APP_VERSION` / `SENTRY_RELEASE` to deploy Git SHA |
| Staging migrations + smoke | 🚢 you |
| Merge `staging → main` | 🚢 you |
| Vercel production deploy | 🚢 automatic on `main` merge |
| §3.1 no real prod users (before destructive cutover) | 🚢 you |
| Pre-launch: `holzen.app` not public (see §5.1 — Vercel Auth/password need Advanced on custom domains) | 🚢 you |

## Preconditions

- Platform exit path documented: [platform-exit-runbook.md](./platform-exit-runbook.md) · [branch-model.md](./branch-model.md).
- Stripe webhook includes `customer.subscription.created|updated|deleted` and subscription `checkout.session.completed`.
- Observability secrets per [observability-setup.md](./observability-setup.md) — **Vercel** (`VITE_*`) + **Supabase Edge** (`SENTRY_*`, `LOG_DRAIN_*`).

## 1. Repo gate (local or CI)

Run in order; fix failures before push:

```bash
npm run test
npm run check:active-surface
npm run check:no-phase-labels
npm run check:invoke-edge-allowlist
npm run check:edge-logging
npm run check:edge-coverage-manifest
npm run test:ci
npm run build
npm run check:bundle-shipped   # run after build (also in the CI build step)
npm run check:bruno-active-manifest
npm run check:posthog-events-allowlist
npm run check:view-migrations
npm run check:edge          # when Deno is installed
npm run stamp:release
npm run check:release-stamp
```

Optional (bash): `npm run check:prepush`

Naming audit (plan §5.0):

```bash
npm run check:no-phase-labels
```

## 2. Push backend (staging first)

Merge feature work to **`staging`**. CI or manual deploy applies migrations and edge functions to the **staging Supabase project**.

Confirm migrations applied, especially any destructive cutover migrations listed in your release notes.

### Quick SQL checks (target project)

```sql
-- Engagement helper exists
SELECT proname FROM pg_proc WHERE proname = 'user_can_engage_pause';

-- Lapsed users blocked from new pause (manual test user)
SELECT user_id, subscription_status, subscription_tier FROM profiles WHERE subscription_status = 'lapsed' LIMIT 5;
```

After staging smoke passes, merge **`staging → main`** for production Supabase + Vercel.

## 3. Frontend (Vercel)

1. **Production** deploys automatically when **`main`** merges (Vercel GitHub integration).
2. Set **`VITE_APP_VERSION`** in Vercel to the deploy Git short SHA (match `SENTRY_RELEASE` / `EDGE_RELEASE` on edges).
3. Confirm custom domain and SPA rewrites per [vercel-frontend-setup.md](./vercel-frontend-setup.md).

**Do not** use Lovable **Publish → Update** for real users after cutover.

## 4. Bruno smoke (`bruno/active/`)

With `staging.bru` (preferred) or `prod.bru` env (JWT + Supabase URL/key). Full sequence: [bruno/active/README.md](../../bruno/active/README.md).

1. `auth/01-sign-in-password`
2. `platform/health` — 200
3. `billing/02-check-subscription` — `subscription_status` / tier fields
4. `billing/01-create-checkout-trial` — `{ url }` (disposable user) **or** app onboarding → Stripe Checkout → `trial_checkout=success`
5. Optional: `pause-pipeline/01-holzen-reflect`, `02-companion-orchestrate`

Do not use requests under `bruno/legacy/full-shell/` for launch ship checks (undeployed edges).

## 5. Post-launch (24h)

- Sentry: `holzen-reflect`, `companion-orchestrate`, `pregenerate-companions` error rate
- PostHog: `onboarding.completed`, `pause.manual_started`, route-not-found volume on dead IA paths
- Stripe: trial → canceled maps to `profiles.subscription_status = 'lapsed'`

## Rollback

- **Frontend:** Redeploy previous Vercel production deployment (Instant Rollback in Vercel dashboard).
- **Backend:** revert merge commit; do not force-push `main`. Full IA recovery: tag `full-ia-pre-strip`, branch `archive/full-ia-pre-strip`, `src/legacy/`.
