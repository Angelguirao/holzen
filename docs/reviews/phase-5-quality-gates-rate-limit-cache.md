# Phase 5: Quality gates, rate limiting, and cache/write semantics review

This phase is the fifth "mental model pass": after Phase 4 (scheduled workers that **produce** cache and library data), we review **shared edge modules** that **bound cost**, **reject low-quality output**, and **serve or write** companion data. These files are imported across `companion-orchestrate`, generators, and related paths — they define **policy**, not a single user-facing screen.

If rate limits fail open without matching analytics instrumentation, or quality gates misfire on valid non-English text, you get runaway spend or empty companion slots.

## Table of Contents

- [What to understand first (priority)](#what-to-understand-first-priority)
- [Mental Models & Useful Concepts](#mental-models--useful-concepts)
- [CS/SE Concepts to Know (for this phase)](#csse-concepts-to-know-for-this-phase)
- [Reviewed starting points (file-by-file)](#reviewed-starting-points-file-by-file)
- [Runtime touchpoints: endpoints, events, and side effects](#runtime-touchpoints-endpoints-events-and-side-effects)
- [Data models affected](#data-models-affected)
- [Systems that emerge from this review](#systems-that-emerge-from-this-review)
- [Reviewer Questions Checklist](#reviewer-questions-checklist)
- [Conclusions and Tradeoffs](#conclusions-and-tradeoffs)
- [What to Review Next and Why](#what-to-review-next-and-why)

## What to understand first (priority)

1. **Fail-open rate and budget checks**: `checkRateLimit` and `checkDailyBudget` return **allow** when their own queries fail — intentional, but it weakens enforcement if relied on as a hard ceiling.
2. **Analytics allowlist**: sliding-window rate limit counts only **specific** `analytics_events.event` names; missing events mean **under-counting** and looser limits.
3. **Quality gates are per companion type**: different min/max words, specificity regexes, and banned patterns; **false rejects** are possible when prompts or languages change.
4. **Cache serve relaxation**: `serveFromCache` prefers unseen high-quality rows but **relaxes** constraints to avoid empty results — repeats and lower-quality rows can appear under load.

## Mental Models & Useful Concepts

- **Policy as code**: `_shared` modules encode product rules (budget, slop, diversity) that must stay aligned with ops expectations.
- **Telemetry coupling**: rate limits **depend on** analytics events being emitted consistently on generation paths.
- **Fail-open vs fail-closed**: DB errors during limit checks favor **availability** (allow) over **strict cost control**.
- **Grounding special case**: pre‑V2 `writeCompanionData` updated `reflection_companions` and `reflections.grounding_*` for Home display — two write surfaces for one logical companion. Pause V2 writes only to `pause_ai_artifacts`.

## CS/SE Concepts to Know (for this phase)

- **Token bucket / sliding window**: approximate rate limiting via event counts in a time window.
- **Budget caps**: daily USD sum from `generation_attempts` — global cap, not per-user (per current implementation).
- **Validation pipelines**: layered rejects (banned phrases, specificity, diversity) — order and false-positive rate matter.
- **Defensive programming**: unhandled promise rejections in fire-and-forget cache updates (see below).

## Reviewed starting points (file-by-file)

### `supabase/functions/_shared/ratelimit.ts`

- **`checkRateLimit(userId, windowMinutes, maxRequests)`**: counts allowlisted `analytics_events.event` values in the last window (e.g. `signal_companion_ai_call`, `zoom_out_ai_call`, `historical_insight_ai_call`, `pause_ai_call`, plus journal/suggest_grounding/night_reflection/reflection_insights/wallpaper events).
- **Fail-open** on query errors.
- **`checkDailyBudget(svcClient, dailyBudgetUsd)`**: sums `generation_attempts.estimated_cost_usd` since UTC midnight; **fail-open** on errors.

### `supabase/functions/_shared/quality.ts`

- Centralized quality checks: banned phrases, crypto-language filter, per-companion-type word ranges, specificity patterns (grounding/history/signal), sentence diversity.
- Reject paths return structured reasons for logging and regeneration.

### `supabase/functions/_shared/cache.ts`

- **`serveFromCache`**: excludes user-seen rows via `user_companion_serves` when `userId` given; optional regime filter; prefers high `quality_score`, least recently served; **progressively relaxes** if nothing matches.
- **`recordUserServe` / `updateServeStats`**: async side effects (verify `.catch` coverage in code — see backlog).

### `supabase/functions/_shared/companion-data.ts`

- **`writeCompanionData`**: upserts `pause_ai_artifacts` only (no denormalized grounding writes in V2).

## Runtime touchpoints: endpoints, events, and side effects

- These modules are **not** HTTP entrypoints; they are **imported** by edge functions (e.g. `companion-orchestrate`, companion generators) during generation and cache serve.
- **Analytics**: allowlisted events must be inserted when generation is counted toward rate limits.
- **Cost tracking**: `generation_attempts` rows feed the daily budget.

## Data models affected

- **`analytics_events`**: counted for sliding-window rate limit (allowlisted `event` values only).
- **`generation_attempts`**: `estimated_cost_usd` for daily budget.
- **`pause_ai_artifacts`**: upserts from `writeCompanionData`.
- **`companion_cache`**: read by `serveFromCache` (selection, quality, serve stats).
- **`user_companion_serves`**: used to exclude repeats per user.

## Systems that emerge from this review

1. **Pause system (architecture)**: `docs/systems/pause/ai-powered-pause-system.md`
   - These modules implement **guardrails** on top of the flows described in earlier phases.

## Reviewer Questions Checklist

1. Does every companion generation path that should count toward **`checkRateLimit`** emit a matching **allowlisted** `analytics_events` row?
2. Is **fail-open** on rate limit / budget failure acceptable for your cost model, or should you alert when the check fails?
3. Do **quality** regexes (e.g. grounding "year + researcher") produce false rejects for non-English or short-form content?
4. When `serveFromCache` relaxes to "any quality" or ignores seen, is that acceptable UX, or should the UI show "cache fallback" messaging?
5. Are **`writeCompanionData`** grounding updates always consistent with what Home and pause UI read for featured grounding?

## Conclusions and Tradeoffs

- **Coherent story**: shared modules centralize **cost**, **quality**, and **cache behavior** so orchestration and generators do not duplicate policy.
- **Risks**:
  - **Allowlist drift**: if generators emit different event names, rate limits are **weaker than intended**.
  - **Fail-open**: outages or query errors on limit/budget checks **allow** generation — good for uptime, risky for spend.
  - **Quality false positives**: strict patterns can reject valid output; tune with metrics and locale needs.
  - **Unhandled async**: fire-and-forget `cache.ts` helpers without `.catch` can surface as **unhandled promise rejections** (see backlog).

Tradeoffs / alternatives:

- **Fail-closed** on limit check errors (stricter cost, more user-visible failures) vs **fail-open** (current).
- **Stricter dedup of analytics events** per slot vs risk of double-counting.
- **Tighter cache** (never relax) vs **empty companion** (current relaxation favors content).

**Backlog (optional hardening):**

- `docs/backlog/rate-limit-analytics-allowlist.md` — instrumentation parity with `checkRateLimit` allowlist.
- `docs/backlog/cache-async-error-handling.md` — `.catch` on `cache.ts` fire-and-forget paths.
- `docs/backlog/rate-budget-fail-open-observability.md` — metrics/alerts when rate or budget checks fail open.
- `docs/backlog/quality-gates-false-positives.md` — tune regexes / localization; measure reject reasons.
- `docs/backlog/cache-serve-relaxation-ux.md` — optional UX when `serveFromCache` relaxes to lower tier or repeats.
- `docs/backlog/writeCompanionData-grounding-consistency.md` — historical note on the pre‑V2 dual‑write.

## What to Review Next and Why

**Phase 6** moves from **policy** in **shared modules** to **database security**: **RLS**, **authz**, and **service-role** assumptions for tables touched by pause, companions, notifications, analytics, and generation (`notifications`, `pause_instances`, `pause_ai_artifacts`, `generation_attempts`, `companion_cache`, etc.). That is the natural next step because Phases 1-5 established **who** calls **what**; Phase 6 verifies **who is allowed to read/write which rows**.

**Phase 6 scope (pointer):**

- Table-by-table RLS and service-role behavior — see `docs/reviews/phase-6-rls-authz-security-model.md`.

Step-by-step review doc: `docs/reviews/phase-6-rls-authz-security-model.md` (same section layout as Phases 1-5 once updated).
