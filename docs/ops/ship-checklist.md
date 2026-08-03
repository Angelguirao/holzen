# Pause-first ship checklist

Tick before calling launch **done**. Canonical detail: [launch-runbook.md](./launch-runbook.md) · [active-surface.md](./active-surface.md). Branch model: [branch-model.md](./branch-model.md).

---

## You — before destructive cutover (§3.1)

- [ ] **Production not public** until launch-ready ([vercel-frontend-setup.md](./vercel-frontend-setup.md) §5.1 — e.g. `VITE_COMING_SOON=true` on Vercel Production only) — remove env and redeploy when launching
- [ ] Confirm **no real production users** on prod project (test/founder accounts disposable)
- [ ] Stripe webhook + price secrets set in **Supabase Edge secrets**
- [ ] **BetterStack log drain** (holzen-prod Supabase Edge): `LOG_DRAIN_URL`, `LOG_DRAIN_TOKEN` — [observability-edge-secrets-setup.md](../backlog/observability-edge-secrets-setup.md)
- [ ] **Slack `#holzen-alerts` webhook** (holzen-prod): `SLACK_WEBHOOK_URL` — same backlog ticket
- [ ] (Optional) Vercel Production Sentry vars for source maps: `VITE_SENTRY_DSN`, `SENTRY_*` — [observability-setup.md](./observability-setup.md)

---

## You — backend (`feature/*` → PR → `main`)

- [ ] Schema validated on **local Docker** (prefer before merge); smoke passed
- [ ] Migrations applied on **holzen-prod** after PR merge to `main`
- [ ] Quick SQL: `companion_catalog` exists; Tier B tables absent; `user_can_engage_pause` exists

---

## You — frontend (Vercel)

- [ ] **PR** checks green (CI + Vercel Preview as needed)
- [ ] **`main` merge** triggered **Production deploy** workflow (`deploy-frontend` job green)
- [ ] `VITE_APP_VERSION` = Git short SHA for that deploy
- [ ] `SENTRY_RELEASE` (edges) matches `EDGE_RELEASE` in `supabase/functions/_shared/release.ts` or tip SHA

Detail: [cicd-overview.md](./cicd-overview.md)

---

## You — smoke (optional, ~15 min)

- [ ] `bruno/active/`: sign-in → health → check-subscription → create-checkout-trial (or app onboarding → Stripe return) — prefer `local.bru`; use `prod.bru` carefully
- [ ] App: onboarding → trial → Home pause → Archive/Journey when lapsed read-only

---

## You — post-launch (24h)

- [ ] Sentry: `holzen-reflect`, `companion-orchestrate`, `pregenerate-companions`
- [ ] PostHog: `onboarding.completed`, `app.route_not_found` on dead IA paths
- [ ] Metrics after `telemetry_baseline_at` in [active-surface.md](./active-surface.md)

---

## Explicit non-goals (no ticket needed)

- Baseline squash (`holzen_schema_baseline.sql`) — tail cutover used instead
- `en.full.json` on disk — use tag `full-ia-pre-strip`
- Undeploy `grounding-enrich` — **done** (legacy handler + `src/legacy/grounding-enrich/`; full view = orchestrate/hydrate only)
- Rename `reflection_text` → `opening_message` — **rejected**
- `check:i18n-active-keys` in CI — optional debt (~118 keys)
