# Pause-first MVP launch runbook

Human checklist for shipping `feature/mvpPauseCleanup` to production. Canonical deploy narrative: [deployment-sync-guide.md](./deployment-sync-guide.md).

## Preconditions

- Steps 1–5 committed on `feature/mvpPauseCleanup` (tag `full-ia-pre-strip` exists).
- Stripe webhook includes `customer.subscription.created|updated|deleted` and subscription `checkout.session.completed`.
- Lovable secrets match [observability-setup.md](./observability-setup.md) (`VITE_*`, edge `SENTRY_*`, `LOG_DRAIN_*`).

## 1. Repo gate (local or CI)

Run in order; fix failures before push:

```bash
npm run test
npm run check:active-surface
npm run check:invoke-edge-allowlist
npm run check:edge-logging
npm run check:edge-coverage-manifest
npm run test:ci
npm run build
npm run check:view-migrations
npm run check:edge          # when Deno is installed
npm run stamp:release
npm run check:release-stamp
```

Optional (bash): `npm run check:prepush`

Naming audit (active paths only):

```bash
rg -i '(mvp|pre-mvp)' src supabase/functions scripts docs/ops .cursor/rules bruno package.json --glob '!**/.cursor/plans/**' --glob '!**/legacy/**'
```

Expect **zero** hits except ADR/plan references.

## 2. Push backend

```bash
git push -u origin feature/mvpPauseCleanup
```

GitHub sync applies `supabase/migrations/` and deploys edge functions. Confirm migration `20260516180000_subscription_lapsed_pause_engagement.sql` applied.

### Quick SQL checks (linked project)

```sql
-- Engagement helper exists
SELECT proname FROM pg_proc WHERE proname = 'user_can_engage_pause';

-- Lapsed users blocked from new pause (manual test user)
-- profiles.subscription_status should be 'lapsed' after trial ends without card
SELECT user_id, subscription_status, subscription_tier FROM profiles WHERE subscription_status = 'lapsed' LIMIT 5;
```

## 3. Lovable frontend

1. **Publish → Update** (required — GitHub sync does not update the SPA).
2. Set `VITE_APP_VERSION` to current Git short SHA (match `SENTRY_RELEASE` on edges).

## 4. Bruno smoke (`bruno/active/`)

With `hosted.bru` env (JWT + Supabase URL/key):

1. `health` — 200
2. `check-subscription` — 200, `entitlement` in body when fresh

See [bruno/active/README.md](../../bruno/active/README.md).

## 5. Post-launch (24h)

- Sentry: `holzen-reflect`, `companion-orchestrate`, `pregenerate-companions` error rate
- PostHog: `onboarding.completed`, `pause.manual_started`, route-not-found volume on dead IA paths
- Stripe: trial → canceled maps to `profiles.subscription_status = 'lapsed'`

## Rollback

- **Frontend:** Lovable republish previous build.
- **Backend:** revert merge commit; do not force-push `main`. Full IA recovery: tag `full-ia-pre-strip`, branch `archive/full-ia-pre-strip`, `src/legacy/`.
