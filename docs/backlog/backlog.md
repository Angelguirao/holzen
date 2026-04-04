# Backlog (Pending Improvements)

This folder collects items that we decided *not* to keep inside the phase review docs.

Rule of thumb used here:

- If something is fully addressed and stable, it gets removed from the audit trail doc (not duplicated in backlog).
- If something is still pending, it lives here (either in the category file and/or in this “everything” view).

---

## How to use this backlog

| You want to… | Start with |
|--------------|------------|
| **Grab a concrete engineering task** | [Work queue (pick by goal)](#work-queue-pick-by-goal) — groups tickets by *why* you’d work on them. |
| **Work in a product area** | [Quick finder (by theme)](#quick-finder-by-theme) — pause, cache, auth, etc. |
| **Look up a file name** | [Alphabetical index](#alphabetical-index-file-name--one-line). |
| **See every ticket in one table** | [Master table (all items)](#master-table-all-items). |

**Companion / Signal design** (narrative + tables, not a one-off ticket): [systems/pause/companions/signal.md §5](../systems/pause/companions/signal.md).

### Recently shipped (detail still in ticket files)

| When | Ticket | Notes |
|------|--------|-------|
| 2026-04 | [cron-worker-auth-consistency.md](cron-worker-auth-consistency.md) | `verifyServiceAuth` + Bruno `SERVICE_CRON_BEARER`; no `x-supabase-cron` bypass. |
| 2026-04 | [pwa-mobile-web-app-meta.md](pwa-mobile-web-app-meta.md) | `mobile-web-app-capable` in `index.html`. |
| 2026-04 | [cache-async-error-handling.md](cache-async-error-handling.md) | `.catch` + structured log on cache side-effect Supabase calls. |
| 2026-04 | [reflection-insert-partial-failure.md](reflection-insert-partial-failure.md) | Revert optimistic UI + `isReflectionPersistError` on Home when `reflections` insert fails after generate. |
| 2026-04 | [writeCompanionData-grounding-consistency.md](writeCompanionData-grounding-consistency.md) | Grounding only in `ground_nudge`; view COALESCE; no `reflections.grounding_*` writes. |
| 2026-04 | [react-router-v7-future-flags.md](react-router-v7-future-flags.md) | `BrowserRouter` `future`: `v7_startTransition`, `v7_relativeSplatPath`. |
| 2026-04 | [pause-session-hydration.md](pause-session-hydration.md) | Coherent `/pause` hydration: storage → aligned hook → nav → fetch by id; loading/error UI. |
| 2026-04 | [home-fetch-deduplication.md](home-fetch-deduplication.md) | `useQuery` for `check-subscription`; `fetchBtcData` per-currency in-flight coalescing. |
| 2026-04 | [service-worker-registration-dev.md](service-worker-registration-dev.md) | Skip SW registration when `import.meta.env.DEV`. |
| 2026-04 | [route-gating.md](route-gating.md) | `AuthLoading`: visible **`auth.restoringSession`** copy, **`role="status"`** / **`aria-live`**. |
| 2026-04 | [typed-navigation-state.md](typed-navigation-state.md) | `src/lib/router-location-state.ts` parsers + types for **`/pause`**, **`/ground`**, **`/profile`**, notifications. |
| 2026-04 | [form-field-name-id-a11y.md](form-field-name-id-a11y.md) | Auth, reset password, settings, library search, hold goal, onboarding welcome: **`name`** / **`id`** / **`autoComplete`**. |
| 2026-04 | *(home-fetch follow-up)* | **`navigating-the-codebase.md`** §6 documents subscription + BTC dedupe + profile note — [home-fetch-deduplication.md](home-fetch-deduplication.md). |
| 2026-04 | [route-level-code-splitting.md](route-level-code-splitting.md) | **`React.lazy`** for all **`src/pages`** routes; **`Suspense`** + **`RouteChunkFallback`** in **`App.tsx`**. |
| 2026-04 | [lighthouse-a11y-home.md](lighthouse-a11y-home.md) | **`main`** landmark, header contrast, notification **`aria-label`**, **36px** touch targets on Home / **`BtcStatus`**. |
| 2026-04 | [resource-hints-preconnect.md](resource-hints-preconnect.md) | **`vite.config`** **`transformIndexHtml`**: Supabase + Google Fonts + CoinGecko **`preconnect`**. |
| 2026-04 | [home-recharts-layout-cost.md](home-recharts-layout-cost.md) | **`BtcChartLazyGate`**: viewport + **`React.lazy`**; chart **`ResponsiveContainer`** tweaks + no area animation. |
| 2026-04 | [data-fetching-conventions.md](data-fetching-conventions.md) | **`navigating-the-codebase` §6.1** — Query vs **`useEffect` + Supabase**; defer global **`QueryClient` defaults**. |
| 2026-04 | [hosting-production-compression.md](hosting-production-compression.md) | Verify **`Content-Encoding`** on prod HTML — **`curl`** / DevTools; sample **`gzip`** on Lovable chain. |
| 2026-04 | [rate-limit-analytics-allowlist.md](rate-limit-analytics-allowlist.md) | **`CHECK_RATE_LIMIT_ANALYTICS_EVENTS`** + generator / question-mode **`trackEvent`**; fixed missing **`signal`/`zoom`/`history`** inserts. |
| 2026-04 | [rate-budget-fail-open-observability.md](rate-budget-fail-open-observability.md) | Structured **`limit_check_fail_open`** JSON logs (`scope` / `phase`) on rate, budget, regenerate fail-open. |
| 2026-04 | [quality-gates-false-positives.md](quality-gates-false-positives.md) | **`quality_gate_reject`** logs + **`generation_attempts`** on post-AI gate fail; DOI / et al. / Unicode names; numeric dates for history. |
| 2026-04 | [btc-price-cache-freshness.md](btc-price-cache-freshness.md) | **Doc:** Zoom Out **`btc_price_cache`** contract — 24h historical TTL, UTC, cron ~15m; `cron-setup` + `refresh-btc-prices` header. |
| 2026-04 | [orchestrate-client-cron.md](orchestrate-client-cron.md) | **`orchestrate_invoke`** JSON log + **`holzenInvokeSource`** (`browser_*`, `cron_check_volatility`); dedup still open. |

---

## Work queue (pick by goal)

Use this when you are **choosing what to work on next**. Items are **not** strictly ordered; “priority hint” is a rough **impact / urgency** label (not a formal SLA).

### Correctness & data integrity (fix wrong or inconsistent state)

| Priority hint | Ticket | Summary |
|---------------|--------|---------|
| — | [btc-price-cache-freshness.md](btc-price-cache-freshness.md) | **Done (2026-04).** Freshness contract in **`cron-setup`** + **`refresh-btc-prices`** — see ticket. |

### Reliability & edge cases (fewer surprises under load or odd navigation)

| Priority hint | Ticket | Summary |
|---------------|--------|---------|
| Medium | [auth-referral.md](auth-referral.md) | Referral side-effect delivery within retry policy. |

### Observability & limits (know when things fail open; align metrics with throttles)

| Priority hint | Ticket | Summary |
|---------------|--------|---------|
| — | [rate-budget-fail-open-observability.md](rate-budget-fail-open-observability.md) | **Done (2026-04).** **`holzen_event`:** `limit_check_fail_open` in Edge logs — see ticket. |
| — | [rate-limit-analytics-allowlist.md](rate-limit-analytics-allowlist.md) | **Done (2026-04).** **`CHECK_RATE_LIMIT_ANALYTICS_EVENTS`** + live-path **`trackEvent`** — see ticket. |

### Cost & duplicate work (same user/session doing redundant orchestration or cache churn)

| Priority hint | Ticket | Summary |
|---------------|--------|---------|
| Lower | [orchestrate-client-cron.md](orchestrate-client-cron.md) | **Partial (2026-04).** **`orchestrate_invoke`** / **`holzenInvokeSource`** — dedup policy still open — see ticket. |
| Lower | [home-fetch-deduplication.md](home-fetch-deduplication.md) | Optional: single **`profiles`** query at layout; doc pointer. **Shipped:** shared subscription query + BTC fetch coalescing — see ticket. |
| Lower | [cache-dedup-near-duplicates.md](cache-dedup-near-duplicates.md) | Stronger dedup for `content_library` / `companion_cache`. |

### Product / UX (what the user sees or feels)

| Priority hint | Ticket | Summary |
|---------------|--------|---------|
| Medium | [automatic-pause-notification-timing.md](automatic-pause-notification-timing.md) | “Pause ready” vs orchestrate completion (`pause_notifications`). |
| Medium | [cron-pause-featured-parity.md](cron-pause-featured-parity.md) | Automatic vs manual pause featured fields / first paint. |
| — | [route-gating.md](route-gating.md) | **Done (2026-04).** Explicit session-restore copy on `AuthLoading` — see ticket. |
| Lower | [cache-serve-relaxation-ux.md](cache-serve-relaxation-ux.md) | Transparency when cache serve relaxes constraints. |
| — | [form-field-name-id-a11y.md](form-field-name-id-a11y.md) | **Done (2026-04).** Auth, settings, library, hold goal, onboarding — see ticket. |
| — | [lighthouse-a11y-home.md](lighthouse-a11y-home.md) | **Done (2026-04).** Landmark, contrast, bell label, targets — re-run Lighthouse to verify — see ticket. |

### Ops & security (cron workers, secrets, docs alignment)

| Priority hint | Ticket | Summary |
|---------------|--------|---------|
| — | [hosting-production-compression.md](hosting-production-compression.md) | **Done (2026-04).** Verification steps + sample check — see ticket. |

### Quality gates & content (reject noise, tune prompts)

| Priority hint | Ticket | Summary |
|---------------|--------|---------|
| Lower | [quality-gates-false-positives.md](quality-gates-false-positives.md) | **Partial (2026-04).** Logs + specificity tune — **`language`**-aware gates still open — see ticket. |

### Testing & tooling (confidence before refactors)

| Priority hint | Ticket | Summary |
|---------------|--------|---------|
| Enabler | [e2e-browser-automation.md](e2e-browser-automation.md) | **UI / journeys:** click-through pause, journal, etc. — Playwright/Cypress or Vitest+RTL; Bruno is **not** browser automation (API review only). |

### Frontend structure & conventions (React maintainability)

| Priority hint | Ticket | Summary |
|---------------|--------|---------|
| — | [typed-navigation-state.md](typed-navigation-state.md) | **Done (2026-04).** `router-location-state` — see ticket. |
| — | [route-level-code-splitting.md](route-level-code-splitting.md) | **Done (2026-04).** Lazy pages + **`Suspense`** — see ticket. |
| Lower | [react-page-and-hook-splitting.md](react-page-and-hook-splitting.md) | Split oversized pages (`Home`, `PauseSession`); optionally narrow **`use-holzen`**; one slice per PR. |
| — | [data-fetching-conventions.md](data-fetching-conventions.md) | **Done (2026-04).** §6.1 in **`navigating-the-codebase`** — see ticket. |
| — | [resource-hints-preconnect.md](resource-hints-preconnect.md) | **Done (2026-04).** Vite-injected **`preconnect`** — see ticket. |
| — | [home-recharts-layout-cost.md](home-recharts-layout-cost.md) | **Done (2026-04).** Lazy + **`IntersectionObserver`** for Home BTC chart — see ticket. |

### Strategic (not a sprint task — revisit when product/hosting needs change)

| Priority hint | Ticket | Summary |
|---------------|--------|---------|
| Defer | [spa-framework-evaluation.md](spa-framework-evaluation.md) | Vite SPA vs full-stack React framework (SSR/SSG/RSC); when to reconsider. |

---

## Master table (all items)

Sortable mentally by **Work type** column; links go to the full ticket.

| Work type | Ticket | One-line |
|-----------|--------|----------|
| Data / market | [btc-price-cache-freshness.md](btc-price-cache-freshness.md) | **Done (2026-04).** Documented contract — see ticket |
| Reliability | [auth-referral.md](auth-referral.md) | Referral delivery robustness |
| Observability | [rate-budget-fail-open-observability.md](rate-budget-fail-open-observability.md) | **Done (2026-04).** Structured fail-open logs — see ticket |
| Observability | [rate-limit-analytics-allowlist.md](rate-limit-analytics-allowlist.md) | **Done (2026-04).** Allowlist constant + generator inserts — see ticket |
| Cost / efficiency | [orchestrate-client-cron.md](orchestrate-client-cron.md) | **Partial (2026-04).** Invoke logging — dedup TBD — see ticket |
| Cost / efficiency | [cache-dedup-near-duplicates.md](cache-dedup-near-duplicates.md) | Near-duplicate cache entries |
| Cost / efficiency | [home-fetch-deduplication.md](home-fetch-deduplication.md) | **Partial (2026-04).** + doc in **`navigating-the-codebase`** §6 — optional **`profiles`** Query — see ticket |
| Product / UX | [automatic-pause-notification-timing.md](automatic-pause-notification-timing.md) | Notification vs orchestrate ordering |
| Product / UX | [cron-pause-featured-parity.md](cron-pause-featured-parity.md) | Cron vs manual featured parity |
| Product / UX | [route-gating.md](route-gating.md) | **Done (2026-04).** Auth loading copy + a11y on `AuthLoading` — see ticket |
| Product / UX | [cache-serve-relaxation-ux.md](cache-serve-relaxation-ux.md) | Cache relaxation transparency |
| Product / UX | [form-field-name-id-a11y.md](form-field-name-id-a11y.md) | **Done (2026-04).** Form **`name`** / **`id`** / **`autocomplete`** — see ticket |
| Product / UX | [lighthouse-a11y-home.md](lighthouse-a11y-home.md) | **Done (2026-04).** Home **`/`** axe fixes — see ticket |
| Ops / security | [hosting-production-compression.md](hosting-production-compression.md) | **Done (2026-04).** Prod HTML compression verify — see ticket |
| Quality | [quality-gates-false-positives.md](quality-gates-false-positives.md) | **Partial (2026-04).** `quality_gate_reject` + DB rows + regex tune — see ticket |
| Testing | [e2e-browser-automation.md](e2e-browser-automation.md) | UI journeys (E2E) vs Bruno API review |
| Frontend | [typed-navigation-state.md](typed-navigation-state.md) | **Done (2026-04).** Parsers in `router-location-state.ts` — see ticket |
| Frontend | [route-level-code-splitting.md](route-level-code-splitting.md) | **Done (2026-04).** **`React.lazy`** in `App.tsx` — see ticket |
| Frontend | [react-page-and-hook-splitting.md](react-page-and-hook-splitting.md) | Large pages + hook decomposition |
| Frontend | [data-fetching-conventions.md](data-fetching-conventions.md) | **Done (2026-04).** Doc in **`navigating-the-codebase`** §6.1 — see ticket |
| Frontend | [resource-hints-preconnect.md](resource-hints-preconnect.md) | **Done (2026-04).** Vite **`transformIndexHtml`** — see ticket |
| Frontend | [home-recharts-layout-cost.md](home-recharts-layout-cost.md) | **Done (2026-04).** **`BtcChartLazyGate`** — see ticket |
| Strategic | [spa-framework-evaluation.md](spa-framework-evaluation.md) | SPA vs framework evaluation |

---

## Quick finder (by theme)

| Theme | Backlog files |
|--------|----------------|
| **Platform, architecture & tooling** | [e2e-browser-automation.md](e2e-browser-automation.md), [spa-framework-evaluation.md](spa-framework-evaluation.md), ~~[hosting-production-compression.md](hosting-production-compression.md)~~ **done** |
| **Frontend structure & conventions** | ~~[typed-navigation-state.md](typed-navigation-state.md)~~ **done**, ~~[route-level-code-splitting.md](route-level-code-splitting.md)~~ **done**, [react-page-and-hook-splitting.md](react-page-and-hook-splitting.md), ~~[data-fetching-conventions.md](data-fetching-conventions.md)~~ **done**, [home-fetch-deduplication.md](home-fetch-deduplication.md), ~~[resource-hints-preconnect.md](resource-hints-preconnect.md)~~ **done**, ~~[home-recharts-layout-cost.md](home-recharts-layout-cost.md)~~ **done** |
| **Auth & routing** | [auth-referral.md](auth-referral.md); ~~[route-gating.md](route-gating.md)~~ **done 2026-04** |
| **Product / UX** | [automatic-pause-notification-timing.md](automatic-pause-notification-timing.md), [cron-pause-featured-parity.md](cron-pause-featured-parity.md), ~~[route-gating.md](route-gating.md)~~ **done**, [cache-serve-relaxation-ux.md](cache-serve-relaxation-ux.md), ~~[form-field-name-id-a11y.md](form-field-name-id-a11y.md)~~ **done**, ~~[lighthouse-a11y-home.md](lighthouse-a11y-home.md)~~ **done** |
| **Pause pipeline & client–server boundaries** | [orchestrate-client-cron.md](orchestrate-client-cron.md) **partial**, [automatic-pause-notification-timing.md](automatic-pause-notification-timing.md), [cron-pause-featured-parity.md](cron-pause-featured-parity.md) |
| **Cost & duplicate work (client + server)** | [orchestrate-client-cron.md](orchestrate-client-cron.md) **partial**, [cache-dedup-near-duplicates.md](cache-dedup-near-duplicates.md), [home-fetch-deduplication.md](home-fetch-deduplication.md) |
| **Cache, library & market data** | [cache-dedup-near-duplicates.md](cache-dedup-near-duplicates.md), ~~[btc-price-cache-freshness.md](btc-price-cache-freshness.md)~~ **done**, [cache-serve-relaxation-ux.md](cache-serve-relaxation-ux.md) |
| **Rate limits, quality & observability** | ~~[rate-limit-analytics-allowlist.md](rate-limit-analytics-allowlist.md)~~ **done**, ~~[rate-budget-fail-open-observability.md](rate-budget-fail-open-observability.md)~~ **done**, [quality-gates-false-positives.md](quality-gates-false-positives.md) |
| **Data consistency** | *(none pending — grounding dual-write shipped 2026-04)* |

---

## Alphabetical index (file name → one-line)

| File | Summary |
|------|---------|
| [auth-referral.md](auth-referral.md) | Auth + referral side-effect robustness |
| [automatic-pause-notification-timing.md](automatic-pause-notification-timing.md) | “Pause ready” vs orchestrate completion (`pause_notifications`) |
| [btc-price-cache-freshness.md](btc-price-cache-freshness.md) | **Done (2026-04).** **`cron-setup`** + **`refresh-btc-prices`** contract — see ticket |
| [cache-async-error-handling.md](cache-async-error-handling.md) | **Done (2026-04).** `.catch` on fire-and-forget cache helpers — see ticket. |
| [cache-dedup-near-duplicates.md](cache-dedup-near-duplicates.md) | Dedup for `content_library` / `companion_cache` |
| [cache-serve-relaxation-ux.md](cache-serve-relaxation-ux.md) | Transparency when cache serve relaxes constraints |
| [cron-pause-featured-parity.md](cron-pause-featured-parity.md) | Automatic vs manual pause featured fields / first paint |
| [cron-worker-auth-consistency.md](cron-worker-auth-consistency.md) | **Done (2026-04).** Cron worker auth — see ticket. |
| [data-fetching-conventions.md](data-fetching-conventions.md) | **Done (2026-04).** **`navigating-the-codebase`** §6.1 — see ticket |
| [e2e-browser-automation.md](e2e-browser-automation.md) | Playwright/Cypress or Vitest+RTL; Bruno stays API-only |
| [form-field-name-id-a11y.md](form-field-name-id-a11y.md) | **Done (2026-04).** Form **`name`** / **`id`** / **`autocomplete`** — see ticket |
| [home-fetch-deduplication.md](home-fetch-deduplication.md) | **Partial (2026-04).** Dedupe + **`navigating-the-codebase`** §6; optional **`profiles`** lift — see ticket |
| [home-recharts-layout-cost.md](home-recharts-layout-cost.md) | **Done (2026-04).** Lazy viewport gate + chart container tweaks — see ticket |
| [hosting-production-compression.md](hosting-production-compression.md) | **Done (2026-04).** **`curl`** / DevTools procedure — see ticket |
| [lighthouse-a11y-home.md](lighthouse-a11y-home.md) | **Done (2026-04).** **`main`**, contrast, notification label, touch targets — see ticket |
| [orchestrate-client-cron.md](orchestrate-client-cron.md) | **Partial (2026-04).** **`orchestrate_invoke`** log + **`holzenInvokeSource`** — see ticket |
| [pause-session-hydration.md](pause-session-hydration.md) | **Done (2026-04).** `/pause` hydration — see ticket. |
| [pwa-mobile-web-app-meta.md](pwa-mobile-web-app-meta.md) | **Done (2026-04).** **`mobile-web-app-capable`** in `index.html` — see ticket. |
| [quality-gates-false-positives.md](quality-gates-false-positives.md) | **Partial (2026-04).** Observability + specificity; locale-aware gates TBD — see ticket |
| [rate-budget-fail-open-observability.md](rate-budget-fail-open-observability.md) | **Done (2026-04).** **`limit_check_fail_open`** JSON in **`ratelimit.ts`** — see ticket |
| [rate-limit-analytics-allowlist.md](rate-limit-analytics-allowlist.md) | **Done (2026-04).** **`CHECK_RATE_LIMIT_ANALYTICS_EVENTS`** + **`trackEvent`** on live paths — see ticket |
| [react-page-and-hook-splitting.md](react-page-and-hook-splitting.md) | Split large pages (`Home`, `PauseSession`); optional `use-holzen` decomposition |
| [react-router-v7-future-flags.md](react-router-v7-future-flags.md) | **Done (2026-04).** Router **`future`** flags — see ticket. |
| [resource-hints-preconnect.md](resource-hints-preconnect.md) | **Done (2026-04).** Supabase + fonts + CoinGecko via **`vite.config`** — see ticket |
| [route-level-code-splitting.md](route-level-code-splitting.md) | **Done (2026-04).** Lazy routes + Suspense in `App.tsx` — see ticket |
| [service-worker-registration-dev.md](service-worker-registration-dev.md) | **Done (2026-04).** DEV guard in `sw-update.ts` — see ticket. |
| [reflection-insert-partial-failure.md](reflection-insert-partial-failure.md) | **Done (2026-04).** Insert failure after generate — see ticket. |
| [route-gating.md](route-gating.md) | **Done (2026-04).** Session-restore messaging on `AuthLoading` — see ticket |
| [spa-framework-evaluation.md](spa-framework-evaluation.md) | Vite SPA vs full-stack React framework (React docs tradeoffs; when to revisit) |
| [typed-navigation-state.md](typed-navigation-state.md) | **Done (2026-04).** `router-location-state.ts` — see ticket |
| [writeCompanionData-grounding-consistency.md](writeCompanionData-grounding-consistency.md) | **Done (2026-04).** Grounding single source — see ticket. |

---

## Pending items (numbered reference)

Legacy numeric IDs for chat / PR references; prefer **ticket file name** or [master table](#master-table-all-items) for new work.

1. Guaranteed referral delivery — [auth-referral.md](auth-referral.md)
2. ~~UX clarity for strict route gating during auth loading~~ — **Shipped 2026-04** — [route-gating.md](route-gating.md)
3. ~~Reduce reliance on `location.state` for `/pause` restoration~~ — **Shipped 2026-04** — [pause-session-hydration.md](pause-session-hydration.md)
4. Client vs cron `companion-orchestrate` overlap — **Partial 2026-04** — [orchestrate-client-cron.md](orchestrate-client-cron.md) *(dedup / skip-if-fresh still open)*
5. ~~Partial failure: reflect OK, reflection insert fails~~ — **Shipped 2026-04** — [reflection-insert-partial-failure.md](reflection-insert-partial-failure.md)
6. Automatic pause: notification timing vs orchestrate completion — [automatic-pause-notification-timing.md](automatic-pause-notification-timing.md)
7. Cron vs manual pause: featured field parity — [cron-pause-featured-parity.md](cron-pause-featured-parity.md)
8. ~~Cron worker auth~~ — **Shipped 2026-04** — [cron-worker-auth-consistency.md](cron-worker-auth-consistency.md)
9. `content_library` / `companion_cache` dedup — [cache-dedup-near-duplicates.md](cache-dedup-near-duplicates.md)
10. ~~BTC `btc_price_cache` historical freshness~~ — **Shipped 2026-04 (doc)** — [btc-price-cache-freshness.md](btc-price-cache-freshness.md)
11. ~~Rate limit: `analytics_events` allowlist parity~~ — **Shipped 2026-04** — [rate-limit-analytics-allowlist.md](rate-limit-analytics-allowlist.md)
12. ~~`cache.ts` fire-and-forget `.catch`~~ — **Shipped 2026-04** — [cache-async-error-handling.md](cache-async-error-handling.md)
13. ~~Rate/daily budget fail-open observability~~ — **Shipped 2026-04** — [rate-budget-fail-open-observability.md](rate-budget-fail-open-observability.md)
14. Quality gates: false positives — **Partial 2026-04** — [quality-gates-false-positives.md](quality-gates-false-positives.md) *(locale-aware `language` in gate: still open)*
15. Cache serve relaxation UX — [cache-serve-relaxation-ux.md](cache-serve-relaxation-ux.md)
16. ~~Grounding dual-write consistency~~ — **Shipped 2026-04** — [writeCompanionData-grounding-consistency.md](writeCompanionData-grounding-consistency.md)
17. E2E / browser automation — [e2e-browser-automation.md](e2e-browser-automation.md)
18. SPA vs full-stack React framework — [spa-framework-evaluation.md](spa-framework-evaluation.md)
19. ~~Typed React Router **`location.state`**~~ — **Shipped 2026-04** — [typed-navigation-state.md](typed-navigation-state.md)
20. Split large pages / heavy hooks — [react-page-and-hook-splitting.md](react-page-and-hook-splitting.md)
21. ~~Data fetching conventions (Query vs Supabase + effects)~~ — **Shipped 2026-04** — [data-fetching-conventions.md](data-fetching-conventions.md)
22. ~~Route-level code splitting (`React.lazy` / `Suspense`)~~ — **Shipped 2026-04** — [route-level-code-splitting.md](route-level-code-splitting.md)
23. ~~Service worker registration in dev (console noise)~~ — **Shipped 2026-04** — [service-worker-registration-dev.md](service-worker-registration-dev.md)
24. Home fetch deduplication (signed-in **`/`**) — [home-fetch-deduplication.md](home-fetch-deduplication.md) — *partial: `useProfile` + subscription query + BTC coalesce (2026-04); optional `profiles` Query*
25. ~~Form field **`name`** / **`id`** / **`autocomplete`** (a11y)~~ — **Shipped 2026-04** — [form-field-name-id-a11y.md](form-field-name-id-a11y.md)
26. ~~React Router v7 **future** flags~~ — **Shipped 2026-04** — [react-router-v7-future-flags.md](react-router-v7-future-flags.md)
27. ~~PWA **`mobile-web-app-capable`** meta~~ — **Shipped 2026-04** — [pwa-mobile-web-app-meta.md](pwa-mobile-web-app-meta.md)
28. ~~Lighthouse **a11y** on Home (`/` )~~ — **Shipped 2026-04** — [lighthouse-a11y-home.md](lighthouse-a11y-home.md)
29. ~~**`preconnect`** resource hints~~ — **Shipped 2026-04** — [resource-hints-preconnect.md](resource-hints-preconnect.md)
30. ~~Home **Recharts** layout / defer~~ — **Shipped 2026-04** — [home-recharts-layout-cost.md](home-recharts-layout-cost.md)
31. ~~Production **HTML** compression~~ — **Shipped 2026-04** — [hosting-production-compression.md](hosting-production-compression.md)
