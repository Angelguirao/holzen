# Full app review backlog (estimates)

This document inventories **user-visible flows** and **cross-cutting areas** so you can review the whole product systematically, beyond the **pause-first** spine in Phase 1–2 and the **server/security** spine in Phase 3–8.

**How to read estimates:** Hours are for a **phase-style pass**: trace code, data, and edge calls; note failure modes and gaps—not a shallow skim. Treat ranges as **±30–40%** depending on depth (security vs UX-only). Merged reviews (e.g. all `/tools/practice/*` in one session) reduce wall-clock time.

**Canonical route list:** `src/App.tsx`. **Edge names:** `bruno/functions-catalog.md` and `supabase/config.toml` under `[functions.<name>]`.

## Table of contents

- [Already completed (existing phase docs)](#already-completed-existing-phase-docs)
- [Dependencies (what to assume first)](#dependencies-what-to-assume-first)
- [Protected shell and home](#protected-shell-and-home)
- [Immersive and practice routes](#immersive-and-practice-routes)
- [Main shell pages](#main-shell-pages)
- [Public and marketing](#public-and-marketing)
- [Cross-cutting](#cross-cutting)
- [Edge functions and jobs (by domain)](#edge-functions-and-jobs-by-domain)
- [Total ballpark](#total-ballpark)
- [Suggested sequencing](#suggested-sequencing)

## Already completed (existing phase docs)

| Doc | Focus |
|-----|--------|
| [phase-1-frontend-routing-auth.md](phase-1-frontend-routing-auth.md) | Routing, `ProtectedRoute` / `PublicOnlyRoute`, `AuthProvider`, session |
| [phase-2-manual-pause-pipeline.md](phase-2-manual-pause-pipeline.md) | Manual pause producer/consumer, `holzen-reflect`, `companion-orchestrate`, `PauseSession` |
| [phase-3-server-cron-triggers.md](phase-3-server-cron-triggers.md) through [phase-8-rls-hardening-service-role-policies.md](phase-8-rls-hardening-service-role-policies.md) | Cron, workers, caching, quality gates, RLS, edge auth, service-role policies |

Treat Phases **1–2** as the **product spine** for pause; **3–8** as the **backend and security** baseline. The tables below avoid re-estimating work already captured there unless you want a **second pass** on the same surface.

## Dependencies (what to assume first)

1. **Phase 1** before deep-diving any protected route (guards and loading semantics).
2. **Phase 2** before treating `/pause` as “done” for companion and reflection contracts.
3. **Phases 3–8** before claiming “production readiness” for cron, RLS, and edge auth; frontend reviews can still proceed in parallel for UX and client contracts.

## Protected shell and home

| Slice | Scope (indicative) | Est. (h) | Notes |
|-------|---------------------|----------|--------|
| **Home dashboard** | `Home.tsx`, widgets (pause-first, market, goal, journey pulse, quick capture, evening), onboarding, Pro gating, ordering, pull-to-refresh, query params (e.g. `subscribed`) | 8–14 | Highest coupling; consider one doc with subsections per widget |
| **Global shell** | `AppLayout`, `BottomNav`, `NotificationBell`, `PauseReadyBanner`, `useLanguageSync` | 3–5 | Overlaps notifications and auto-trigger |
| **Auto-trigger → pause** | `useAutoTrigger`, navigation to `/pause`, interaction with home chrome | 2–4 | Overlap with Phase 2 if reviewed together |

## Immersive and practice routes

| Route | Est. (h) | Notes |
|-------|----------|--------|
| `/pause` | 6–10 | Deep UX + persistence; **Phase 2** covers pipeline—this row is extra UI/state edge cases if needed |
| `/tools/breathe` | 2–4 | Stillness; no separate `/tools/ambient` route |
| `/tools/ground` | 3–5 | |
| `/tools/ground/history` | 2–3 | Pair with `/tools/ground` to save context |
| `/tools/practice/checkin` | 2–4 | |
| `/tools/practice/journal` | 3–5 | Ties to `journal-prompt` and library/Journey usage |
| `/tools/practice/bodyscan` | 2–4 | |
| `/tools/practice/replay` | 2–4 | |

**Subtotal (immersive + practice, separate passes):** roughly **24–40** hours.

## Main shell pages

| Route | Est. (h) | Notes |
|-------|----------|--------|
| `/library` | 4–7 | |
| `/journey` | 3–5 | Journey hub (stats, insights, badges, activity); letters live under `/tools/letters` |
| `/tools` | 1–2 | Tools index in shell |
| `/settings` | 5–8 | Subscription, language, notifications, account—overlaps billing edge review |
| `/settings/about` | 0.5–1 | Changelog / feedback sub-surface |
| `/admin` | 4–8 | Curated content and ops; depends on `VITE_ADMIN_USER_IDS` |

## Public and marketing

| Routes | Est. (h) | Notes |
|--------|----------|--------|
| `/welcome`, `/auth`, `/reset-password` | 4–7 | Public-only and recovery flows |
| `/terms`, `/privacy`, `/about`, `/blog`, `/blog/:slug`, `/roadmap` | 3–6 | Mostly content, i18n, and routing |
| `/reserve` | 1–2 | |

## Cross-cutting

| Topic | Est. (h) | Notes |
|-------|----------|--------|
| **i18n** | 3–6 | Keys, fallbacks, copy consistency |
| **PWA / service worker** | 2–4 | `src/sw.ts`, update/offline behavior |
| **Push and in-app notifications** | 3–5 | `register-push`, bell UI, badge flows |
| **Subscription UX** | 3–5 | `useSubscription`, checkout return, portal—overlaps settings |

## Edge functions and jobs (by domain)

Assume **Phases 3–8** cover security and cron **once**. Use this table for **feature-aligned** reviews or spot checks.

| Domain | Functions (indicative) | Est. (h) |
|--------|-------------------------|----------|
| **Billing** | `create-checkout`, `customer-portal`, `check-subscription` | 3–5 |
| **Companion / pause** | `companion-orchestrate`, `holzen-reflect`, `pregenerate-companions` | 4–8 | Overlaps Phase 2 |
| **Journal / grounding / ritual** | `journal-prompt`, `suggest-grounding`, `suggest-ritual` | 3–5 |
| **Reflection / number** | `reflection-insights`, `holzen-number` | 2–4 |
| **Letters / digests / nudges** | `deliver-letters`, `weekly-digest`, `monthly-report`, `personalized-nudge`, `night-reflection` | 5–10 |
| **Ops / cron / data** | `check-volatility`, `fetch-source-feeds`, `refresh-btc-prices`, `badge-notify`, … | 6–12 |
| **Account / trust** | `delete-account`, `send-feedback`, `record-referral`, `auth-email-hook`, `process-referral-pending` | 3–6 |

Full name list: [bruno/functions-catalog.md](../../bruno/functions-catalog.md).

## Total ballpark

| Scope | Rough range (h) |
|-------|------------------|
| Frontend: every route + shell + cross-cutting | 55–95 |
| Edge/cron (incremental to Phases 3–8) | 25–50 |
| **End-to-end** (full product + functions, minimal double-counting) | **80–140** |

## Suggested sequencing

1. **Tier A — daily path:** Home (and shell) → Library → Settings → subscription UX.  
2. **Tier B — practice cluster:** `/tools/practice/*` in one or two reviews (alongside stillness at `/tools/breathe` if useful).  
3. **Tier C — ground:** `/tools/ground` + `/tools/ground/history`.  
4. **Tier D — public:** Landing, auth, legal/blog/roadmap.  
5. **Tier E — admin** when ops surfaces matter.  
6. **Edge:** Align with the tier that uses each function (e.g. journal review + `journal-prompt`).

Pair with [fundamentals/http-review-playbooks.md](../fundamentals/http-review-playbooks.md) and [bruno/SCOPE.md](../../bruno/SCOPE.md) for HTTP vs full-browser scope; UI journeys remain separate from Bruno-only review.
