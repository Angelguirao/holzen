# Pause-first ship checklist

Tick before calling launch **done**. Canonical detail: [launch-runbook.md](./launch-runbook.md) · [active-surface.md](./active-surface.md).

**Branch:** `feature/mvpPauseCleanup` · **Agent-complete** (code, CI, docs, git push).

---

## Agent-complete (do not re-audit)

- [x] Steps 1–6 implementation on branch
- [x] Bruno `active/` + `legacy/full-shell/` committed
- [x] `companion_catalog` rename + catalog phase (not DROP `content_library`)
- [x] `reflection_text` kept (no `opening_message` rename)
- [x] `grounding-enrich` deployed (Full View)
- [x] `test:ci` — active-surface, bundle-shipped, bruno manifest, posthog allowlist, 650 tests
- [x] Pushed to `origin/feature/mvpPauseCleanup`

---

## You — before destructive cutover (§3.1)

- [ ] Confirm **no real production users** on linked project (test/founder accounts disposable)
- [ ] Stripe webhook + price secrets set in Lovable/edge
- [ ] Observability secrets per [observability-setup.md](./observability-setup.md)

---

## You — backend (GitHub sync)

- [ ] Migrations applied on linked Supabase, including:
  - [ ] `20260521200000_holzen_mvp_launch_cutover.sql` (**destructive**)
  - [ ] `20260522130000_drop_companion_breathing.sql`
  - [ ] `20260523140000_companion_catalog_serve_source.sql`
  - [ ] `20260523140100_companion_catalog_recreate_if_missing.sql`
  - [ ] `20260523150000_keep_reflection_text_artifact_kind.sql` (if old cutover ran)
- [ ] Quick SQL: `companion_catalog` exists; Tier B tables absent; `user_can_engage_pause` exists

---

## You — frontend (Lovable)

- [ ] **Publish → Update** (required — GitHub sync does not update SPA)
- [ ] `VITE_APP_VERSION` = current Git short SHA at publish time
- [ ] `SENTRY_RELEASE` (edges) matches `EDGE_RELEASE` in `supabase/functions/_shared/release.ts` or tip SHA

---

## You — smoke (optional, ~15 min)

- [ ] `bruno/active/`: sign-in → health → check-subscription → ensure-trial
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
- Undeploy `grounding-enrich` — **rejected**; stays shipped
- Rename `reflection_text` → `opening_message` — **rejected**
- `check:i18n-active-keys` in CI — optional debt (~118 keys)
