# Pause-first launch runbook

Human checklist for shipping `feature/mvpPauseCleanup` to production. **Quick ticks:** [ship-checklist.md](./ship-checklist.md). Canonical deploy narrative: [deployment-sync-guide.md](./deployment-sync-guide.md).

## Ship status (agent-complete vs human)

| Step | Status |
| --- | --- |
| Steps 1–6 code + CI + docs | ✅ on `feature/mvpPauseCleanup` |
| `git push` | ✅ tip **`038c7c84`** · set `VITE_APP_VERSION` / `SENTRY_RELEASE` to this SHA on publish |
| Linked DB migrations + cutover verify | 🚢 you |
| Lovable **Publish → Update** | 🚢 you |
| §3.1 no real prod users (before destructive cutover) | 🚢 you |

## Preconditions

- Steps 1–5 committed on `feature/mvpPauseCleanup` (tag `full-ia-pre-strip` exists).
- Stripe webhook includes `customer.subscription.created|updated|deleted` and subscription `checkout.session.completed`.
- Lovable secrets match [observability-setup.md](./observability-setup.md) (`VITE_*`, edge `SENTRY_*`, `LOG_DRAIN_*`).

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
npm run check:bundle-shipped   # also runs inside test:ci
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

## 2. Push backend

**Done (2026-05-17):** `806009f3` on `origin/feature/mvpPauseCleanup`.

If you need to push again:

```bash
git push -u origin feature/mvpPauseCleanup
```

GitHub sync applies `supabase/migrations/` and deploys edge functions. Confirm migrations applied, especially:

- `20260516180000_subscription_lapsed_pause_engagement.sql` — lapsed status + `user_can_engage_pause`
- `20260521200000_holzen_mvp_launch_cutover.sql` — Tier B drops, `content_library` → `companion_catalog`, telemetry baseline, cron unschedule (**destructive**)
- `20260522130000_drop_companion_breathing.sql` — drops `profiles.companion_breathing` (plan §20.5)
- `20260523140000_companion_catalog_serve_source.sql` — `serve_source` includes `catalog`
- `20260523140100_companion_catalog_recreate_if_missing.sql` — safety recreate if an earlier cutover dropped the table
- `20260523150000_keep_reflection_text_artifact_kind.sql` — reverts `opening_message` kind if an old cutover revision ran

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

With `hosted.bru` env (JWT + Supabase URL/key). Full sequence: [bruno/active/README.md](../../bruno/active/README.md).

1. `auth/01-sign-in-password`
2. `platform/health` — 200
3. `billing/02-check-subscription` — `subscription_status` / tier fields
4. `billing/04-ensure-trial-subscription` — `{ ok: true }` (disposable user; idempotent)
5. Optional: `pause-pipeline/01-holzen-reflect`, `02-companion-orchestrate`

Do not use requests under `bruno/legacy/full-shell/` for launch ship checks (undeployed edges).

## 5. Post-launch (24h)

- Sentry: `holzen-reflect`, `companion-orchestrate`, `pregenerate-companions` error rate
- PostHog: `onboarding.completed`, `pause.manual_started`, route-not-found volume on dead IA paths
- Stripe: trial → canceled maps to `profiles.subscription_status = 'lapsed'`

## Rollback

- **Frontend:** Lovable republish previous build.
- **Backend:** revert merge commit; do not force-push `main`. Full IA recovery: tag `full-ia-pre-strip`, branch `archive/full-ia-pre-strip`, `src/legacy/`.
