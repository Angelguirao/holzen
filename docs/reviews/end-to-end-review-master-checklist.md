# End-to-end review — master checklist

**Purpose:** One place to tick through a **full product review** of Holzen: routes, flows, cross-cutting concerns, edge functions, and the phased security docs. Use it with:

- **Workflow:** [`.cursor/skills/holzen-flow-review/SKILL.md`](../../.cursor/skills/holzen-flow-review/SKILL.md) (Cursor) — orient → pick scope → trace flow → template.
- **Per session:** [react-spa-review-template.md](react-spa-review-template.md) (PR checklist or audit sections).
- **Estimates and narrative:** [full-app-review-backlog.md](full-app-review-backlog.md).

**How to use:** Check `[ ]` → `[x]` when that **slice** is done (flow traced, notes captured, follow-ups filed). Prefer **one vertical slice per session** (e.g. “Home cold load + first pause trigger”) over skimming every box in a day.

**Route source of truth:** `src/App.tsx` (last reconciled with this doc as a structural inventory). **Edge names:** `supabase/config.toml` `[functions.*]` and [bruno/functions-catalog.md](../../bruno/functions-catalog.md).

---

## 0 — Prerequisites (read once, then spot-check)

- [ ] [phase-1-frontend-routing-auth.md](phase-1-frontend-routing-auth.md) — routing, `ProtectedRoute` / `PublicOnlyRoute`, `AuthProvider`, session semantics
- [ ] [phase-2-manual-pause-pipeline.md](phase-2-manual-pause-pipeline.md) — manual pause pipeline (before deep `/pause` + companion contract work)
- [ ] [phase-3-server-cron-triggers.md](phase-3-server-cron-triggers.md) through [phase-8-rls-hardening-service-role-policies.md](phase-8-rls-hardening-service-role-policies.md) — **before claiming production readiness** (can run in parallel with UI tiers)

---

## 1 — Tier A — Daily path (shell, home, library, journey, settings)

### Global shell (under `AppLayout` + shared providers)

- [x] `AppLayout` / `BottomNav` / main chrome — *L1 2026-04-30: layout mounts `useHolzen` for `language` + `useAutoTrigger`; inner `Suspense` + `PageChunkFallback` (a11y status); tab chunk prefetch idle/timeout.*
- [x] `NotificationBell` + notification deep links (if any) — *L1: header placement; deep links deferred to dedicated notification pass.*
- [x] `PauseReadyBanner` + interaction with pause entry — *L1: `pauseReady`/`dismiss` from `useAutoTrigger`; shown when `!isHome`.*
- [x] `useLanguageSync` / locale behavior — *L1: `useLanguageSync(language)` from profile; i18n `changeLanguage` only for supported resource keys.*
- [x] `OfflineBanner`, `CookieConsent`, `ScrollToTop`, `Sonner` (as relevant to flows you test) — *L1: `App.tsx` wiring; `ScrollToTop` on pathname; Sonner inside `TooltipProvider`.*
- [x] `ErrorBoundary` + `FeedbackWidgetGate` (signed-in only) — *L1: root boundary; feedback only when `useAuth().user`.*
- [x] `RouterLocationLog` / routing instrumentation (sanity: no PII leaks) — *L1: logs pathname, authLoading, signedIn, `user?.id?.slice(0,8)` only.*
- [x] `CheckoutGuardCleanup` (checkout return UX) — *L1: `scheduleCheckoutGuardCleanup` on mount; covered by `src/test/checkout-guard-cleanup.test.ts`.*

### Home

- [x] `/` — `Home` (widgets: pause-first, market, goal, journey pulse, quick capture, evening, onboarding, ordering, pull-to-refresh, query params e.g. `subscribed`) — *L2 2026-04-30: `profileLoaded` → `AuthLoading`; onboarding gate; `useHolzen` + `useSubscription` + outlet `pauseReady` → `refreshProfile`; `?subscribed=true` → `refresh` + toast; zen branch mirrors loading/error/limit UI; widget mode has DnD layout + reflection/BTC/journey-pulse/quick-capture/night widgets + categorized `error` / `isPausePersistError` + navigate `/pause` with location state; pull-to-refresh = full `reload`; local-only `supabase` reads for pinned preview + completed count (extra coupling vs central hook).*
- [x] `/index` → redirect to `/` (smoke) — *L2: `App.tsx` `<Navigate to="/" replace />`.*

### Library

- [x] `/library` — `Library` — *L3 2026-04-30: `useProGate` → pending skeleton / non-Pro lock + checkout; Pro path uses `useLibrary` (Supabase `library_items` + `collections` + `collection_items`, cache hydrate, `hydratePauseMeta` on `v_pause_full` + `pause_companion_events`). Page: tabs, client filters/sort, `CurrentPauseCard`, PTR → `refetch`, infinite scroll → `loadMore`. `LibraryItems` empty state + virtuoso lists. Gap: `fetchAll` does not surface Supabase errors; `library.loading` is exposed but unused on page (cache-first OK; failed fetch may look like empty).*

### Journey (hub tabs)

- [ ] `/journey` → redirect to `/journey/stats`
- [ ] `/journey/stats`
- [ ] `/journey/insights`
- [ ] `/journey/badges`
- [ ] `/journey/activity`
- [ ] Invalid `/journey/:tab` → normalizes to `stats` (behavior check)

### Settings tree

- [ ] `/settings` — hub (`SettingsHub` index)
- [ ] `/settings/you`
- [ ] `/settings/reflection`
- [ ] `/settings/experience`
- [ ] `/settings/companions`
- [ ] `/settings/notifications`
- [ ] `/settings/subscription` (+ checkout / portal flows)
- [ ] `/settings/account`
- [ ] `/settings/about`
- [ ] `/settings/billing-history`

### Tools index (shell)

- [ ] `/tools` — `ToolsHub`
- [ ] `/tools/letters` — `ToolsLetters` (deep link `?letter=` if product uses it)

---

## 2 — Tier B — Immersive: pause + companion surfaces

- [ ] `/pause` — `PauseSession` (pipeline per Phase 2; add UI/state edge cases here)
- [ ] `/companion/zoom-out/:pauseInstanceId` — `CompanionZoomOutPage`
- [ ] `/companion/history/:pauseInstanceId` — `CompanionHistoryPage`
- [ ] `/companion/signal/:pauseInstanceId` — `CompanionSignalPage`
- [ ] `/companion/grounding/:pauseInstanceId` — `CompanionGroundingPage`

---

## 3 — Tier C — Regulation + practice (full-screen)

- [ ] `/tools/breathe` — `Breathe`
- [ ] `/tools/ground` — `Ground` (index)
- [ ] `/tools/ground/history` — `GroundHistory`
- [ ] `/tools/practice/checkin` — `PracticeCheckIn`
- [ ] `/tools/practice/journal` — `PracticeJournal`
- [ ] `/tools/practice/bodyscan` — `PracticeBodyScan`
- [ ] `/tools/practice/replay` — `PracticeReplay`

---

## 4 — Tier D — Public, marketing, account recovery

- [ ] `/welcome` — `Landing` (`PublicOnlyRoute`)
- [ ] `/auth` — `Auth` (`PublicOnlyRoute`)
- [ ] `/reset-password` — `ResetPassword`
- [ ] `/terms` — `Terms`
- [ ] `/privacy` — `Privacy`
- [ ] `/about` — `About`
- [ ] `/blog` — `Blog`
- [ ] `/blog/:slug` — `BlogPost` (pick representative slugs)
- [ ] `/roadmap` — `RoadmapStub`
- [ ] `/reserve` — `Reserve`
- [ ] `/unsubscribe` — `Unsubscribe`

---

## 5 — Tier E — Admin (only if `VITE_ADMIN_USER_IDS` includes your test user)

- [ ] `/admin` — `Admin`
- [ ] `/admin/smoke-test` — `SmokeTest`
- [ ] `/admin/sentry-alerts` — `SentryAlerts`
- [ ] `/admin/edge-coverage` — `EdgeCoverage`

---

## 6 — Tier F — Catch-all and negatives

- [ ] Unknown path → `NotFound` (`*` route)

---

## 7 — Cross-cutting (can overlap with tiers; dedicate at least one pass each)

- [ ] **i18n** — keys, fallbacks, language switch + persistence ([docs/design/information-architecture.md](../design/information-architecture.md) alignment where relevant)
- [ ] **PWA / SW** — `src/sw.ts`, update prompts, offline ([AGENTS.md](../../AGENTS.md))
- [ ] **Push + in-app notifications** — `register-push`, bell UI, cron-driven surfaces
- [ ] **Subscription UX** — `useSubscription`, success/cancel return, portal, billing history
- [ ] **Analytics / flags** — PostHog events per [ops/event-taxonomy.md](../ops/event-taxonomy.md); flags per [ops/feature-flags.md](../ops/feature-flags.md)
- [ ] **Observability** — Sentry + `x-cid` / `invokeEdge` patterns on new or risky call sites ([AGENTS.md](../../AGENTS.md))
- [ ] **Stripe / billing edges** — aligned with settings subscription flow ([bruno/functions-catalog.md](../../bruno/functions-catalog.md) billing folder)

---

## 8 — Edge functions & HTTP entrypoints (tick when reviewed with their **calling** UI or cron doc)

Alphabetical per `supabase/config.toml` (each row: contract, auth, errors, logging).

- [ ] `admin-check-stripe-prices`
- [ ] `admin-library-preview`
- [ ] `ai-cost-alert`
- [ ] `auth-email-hook`
- [ ] `backfill-btc-prices`
- [ ] `badge-notify`
- [ ] `check-subscription`
- [ ] `check-volatility`
- [ ] `companion-orchestrate`
- [ ] `create-checkout`
- [ ] `customer-portal`
- [ ] `delete-account`
- [ ] `deliver-letters`
- [ ] `fetch-source-feeds`
- [ ] `generate-wallpaper`
- [ ] `grounding-enrich`
- [ ] `handle-email-suppression`
- [ ] `handle-email-unsubscribe`
- [ ] `health`
- [ ] `holzen-number`
- [ ] `holzen-reflect`
- [ ] `journal-prompt`
- [ ] `list-checkout-events`
- [ ] `monthly-report`
- [ ] `night-reflection`
- [ ] `notify-checkout-confirmation`
- [ ] `personalized-nudge`
- [ ] `pregenerate-companions`
- [ ] `preview-transactional-email`
- [ ] `process-email-queue`
- [ ] `process-referral-pending`
- [ ] `record-referral`
- [ ] `reflection-insights`
- [ ] `refresh-btc-prices`
- [ ] `register-push`
- [ ] `retry-flex-credit`
- [ ] `seed-btc-history`
- [ ] `send-feedback`
- [ ] `send-transactional-email`
- [ ] `stripe-webhook`
- [ ] `suggest-grounding`
- [ ] `suggest-ritual`
- [ ] `weekly-digest`

**HTTP tooling:** [fundamentals/http-review-playbooks.md](../fundamentals/http-review-playbooks.md), [bruno/SCOPE.md](../../bruno/SCOPE.md).

---

## 9 — Optional deep passes (not every route)

- [ ] **Browser 360°** — [fundamentals/browser-360-mcp-playbook.md](../fundamentals/browser-360-mcp-playbook.md) on `/` and one heavy route
- [ ] **E2E automation gap** — [backlog/e2e-browser-automation.md](../backlog/e2e-browser-automation.md) (plan tests for flows you care most about)
- [ ] **Repo size / review throughput** — [fundamentals/codebase-size-and-review-practices.md](../fundamentals/codebase-size-and-review-practices.md)

---

## 10 — After review

- [ ] File tickets / backlog entries for findings ([backlog/backlog.md](../backlog/backlog.md) or new `backlog/*.md` rows)
- [ ] Refactors: [fundamentals/refactoring-strategy.md](../fundamentals/refactoring-strategy.md) (includes **full-stack** touchpoints) + [backlog/react-page-and-hook-splitting.md](../backlog/react-page-and-hook-splitting.md) for UI extraction backlog
- [ ] If shipping: [ops/deployment-sync-guide.md](../ops/deployment-sync-guide.md)

---

## Related

| Doc | Role |
|-----|------|
| [full-app-review-backlog.md](full-app-review-backlog.md) | Hour estimates, sequencing narrative, dependencies |
| [react-spa-review-template.md](react-spa-review-template.md) | PR + audit questions per slice |
| [design/information-architecture.md](../design/information-architecture.md) | Product IA vs routes |

---

## 11 — Appendix: prompt for an agent review loop (copy-paste)

Use this (or shorten it) when you want the agent to **review one slice per loop**, optionally **fix** small issues in the same loop, **update this checklist** (`[ ]` → `[x]` for completed items), and **`git commit`** before stopping.

```text
Holzen review loop — follow the repo workflow:

1. Read `.cursor/skills/holzen-flow-review/SKILL.md` and use `docs/reviews/end-to-end-review-master-checklist.md` + `docs/reviews/react-spa-review-template.md`.

2. One loop = ONE scope from the master checklist (e.g. next unchecked item in §1 Tier A shell, OR one route, OR one edge function together with its UI caller). Trace flow-first: UI → state → Supabase / invokeEdge → state → UI. Note loading/error/empty gaps.

3. Outcomes this loop (pick what applies):
   - If only analysis: short written findings (bullets) and mark the checklist item [x] in `docs/reviews/end-to-end-review-master-checklist.md`.
   - If you fix bugs or small refactors: minimal diff, match `docs/fundamentals/refactoring-strategy.md`; do not widen scope.

4. At end of loop: `git add` relevant files and commit with a message like `review: tier A shell — notes` or `fix: <area> <what>` (one logical commit per loop).

5. Stop after the commit and tell me what you checked and what’s next unchecked.

Resume hint: start from §<N> first unchecked `[ ]` unless I specify otherwise below.

[Optional: “Focus only on …” or “Do not change code this loop, checklist + notes only.”]
```

**Tips:** Narrow scope per loop (half a day max of surface area). If a loop finds large work, **ticket it** and still commit checklist progress + backlog stub rather than a huge refactor in one commit.
