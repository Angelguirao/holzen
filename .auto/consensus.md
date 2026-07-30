# Holzen — auto consensus (relay baton)

**Venture:** holzen  
**Phase:** operate  
**Last updated:** 2026-07-30 (cycle 3)

---

## Last cycle

**Cycle 3 — operate (docs_drift · active-surface admin routes)**

1. Documented Admin (internal) routes in `docs/ops/active-surface.md`: `/admin`, `/admin/smoke-test`, `/admin/sentry-alerts`, `/admin/edge-coverage`.
2. Added `APP_ADMIN_ROUTES` + `isAppAdminPath` in `src/lib/app-routes.ts` so the route table matches `App.tsx`.
3. Closed cycle-1 audit gap (admin ops not listed in shipped routes).

**Cycle 2 — operate (docs_drift · check:prepush Windows reality)**

1. Verified: `npm run check:prepush` needs real bash; bare Windows `bash` often is a broken WSL stub.
2. Documented Git Bash path in `AGENTS.md` + `docs/ops/deployment-sync-guide.md`.
3. Closed redundant edge-logging backlog (covered by `check:edge-logging`).

---

## Next action

Confirm PostHog event taxonomy still matches active `trackEvent` names: `npm run check:posthog-events-allowlist` (operate · measure_loop). Fix or update `docs/ops/event-taxonomy.md` if red.

---

## Backlog (human-approved maintainer tasks)

- [x] Verify `npm run check:prepush` docs match Windows/Git Bash reality in AGENTS.md
- [x] Audit edge functions for any missing `withRequestLogging` wrapper *(covered by check:edge-logging)*
- [x] Confirm `docs/ops/active-surface.md` matches current route table in `src/lib/app-routes.ts` (incl. admin ops routes)

_Add items here before agents implement new work._

---

## Blockers / escalations

_None._

---

## Out of scope declined

- No product features; docs_drift / measure only.
- Did not add admin routes to BottomNav / `APP_SHELL_TABS`.

---

## Notes

- Cycles must not expand product scope without an item added to Backlog by human.
- LifeOS Next Action baton (PersonalOS Status) should mirror **Next action** above.
