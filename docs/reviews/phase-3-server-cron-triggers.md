# Phase 3: Server triggers and cron behavior review

This phase is the third "mental model pass": after Phase 1 (auth + route gating) and Phase 2 (manual pause producer/consumer), we trace **automatic pause** — how **scheduled work** and **`check-volatility`** create pause instances, notifications, and **background companion orchestration**, and how that lines up with what **NotificationBell** and **PauseSession** expect.

If this path diverges from the manual path (Phase 2), users see inconsistent pause content, races, or duplicate `companion-orchestrate` cost.

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

1. **Eligibility gates**: who gets an automatic pause (thresholds, quiet hours/snooze, cooldown) and how `last_trigger_at` is claimed to avoid double-fires.
2. **Order of writes**: pause instance + profile fields + `notifications` row vs **async** `companion-orchestrate` (not awaited) — UI may open `/pause` before companion rows exist.
3. **Parity with manual pause**: cron builds BTC context similarly to `use-holzen` (shared helpers in `_shared/`), but **reflection LLM** work is **deferred** to the client at **Reflect** (`holzen-reflect`), not inline `generateUnifiedReflection` inside `check-volatility` on claim.
4. **Notification entry**: `NotificationBell` deep-links to `/pause` with `{ pauseInstanceId }` only — same boundary Phase 2 called out; hydration must come from profile/hooks/DB.

## Mental Models & Useful Concepts

- **Worker as producer**: `check-volatility` is a batch producer of pause instances + notifications; the client runs **`holzen-reflect`** at **Reflect** and may call `companion-orchestrate`.
- **Fire-and-forget orchestration**: companion dispatch uses `fetch` to `companion-orchestrate` without awaiting completion; **eventual consistency** for `pause_ai_artifacts` / featured fields.
- **Optimistic cooldown**: updating `profiles.last_trigger_at` before downstream work reduces duplicate triggers under concurrent cron runs.
- **Featured vs expanded**: reflection copy appears after **Reflect**; do not assume featured grounding is immediate for cron-driven pauses until orchestration completes.

## CS/SE Concepts to Know (for this phase)

- **Distributed race**: cron path vs user session both touching the same `pauseInstanceId` with `companion-orchestrate` — idempotency, cache, and cost (see `docs/backlog/orchestrate-client-cron.md`).
- **Eventual consistency**: notification exists before all companion rows are written; UI must tolerate loading states.
- **At-least-once / duplicate suppression**: eligibility + cooldown logic aims to avoid spam; still validate under clock skew and retries.
- **Separation of triggers**: pg_cron (or HTTP) invokes the edge function; auth uses service role or cron secrets per `docs/ops/cron-setup.md`.

## Reviewed starting points (file-by-file)

### `supabase/functions/check-volatility/index.ts` — main automatic pause worker

- Loads profiles, filters to **eligible** users (daily/cumulative move vs thresholds, quiet hours / `quiet_windows`, snooze, cooldown vs `last_trigger_at`).
- Fetches BTC metrics (CoinGecko) per user's hold currency; builds context string; enriches with Fear & Greed and on-chain snapshots via shared helpers.
- Claims cooldown by updating `profiles.last_trigger_at` before generating (optimistic lock pattern).
- Records analytics event, calls `generateUnifiedReflection` (cron-side reflection generation).
- Creates the pause instance via `pause_create_or_reuse_as`, updates `profiles.last_message` / `last_context`, and inserts `notifications` for the bell UI.
- Dispatches `companion-orchestrate` via `fetch` (service role, fire-and-forget) with `pauseInstanceId`, prefs, sources, recency hints, `useIntervention: true`.

### `supabase/functions/_shared/pause-cron-parity.ts`

- Shared enrichment and source-fetch helpers so cron-side context and orchestrate inputs stay aligned with manual/client expectations (Fear & Greed, on-chain, Signal/Grounding sources, recency hints from `pause_ai_artifacts`).

### `supabase/functions/_shared/pause-context-suffix.ts`

- Helpers for consistent automatic-pause context suffixing / formatting where used by cron paths.

### `docs/ops/cron-setup.md`

- How `pg_cron` (or equivalent) calls `check-volatility` and related workers; schedule and auth headers.

### `src/components/NotificationBell.tsx` — notification consumer

- "Open pause" navigates to `/pause` with `state: { pauseInstanceId: p.pause_instance_id }` only — minimal payload; relies on Phase 2 hydration and profile/`useHolzen` fallbacks.

## Runtime touchpoints: endpoints, events, and side effects

- **Scheduled HTTP**: cron invokes edge function URL for `check-volatility` (see `docs/ops/cron-setup.md` for headers/secrets).
- **Edge function: `check-volatility`**: full automatic pause pipeline (BTC fetch, generate, DB writes, notify, dispatch orchestrate).
- **Edge function: `companion-orchestrate`**: invoked from `check-volatility` with `Authorization: Bearer <service role>` and JSON body including `userId`, `pauseInstanceId`, context, severity, mood history, feature flags.
- **External APIs**: CoinGecko (BTC charts), Fear & Greed, on-chain snapshot helpers; optional email via Lovable Email for notification copy.
- **Web Push**: may be used in `check-volatility` for push delivery (see function body for full flow).

## Data models affected

- **`profiles`**: `last_trigger_at` (cooldown claim), `last_message`, `last_context`, thresholds, quiet windows, currency, companion prefs.
- **`pause_instances`**: new rows from automatic generation; `pause_ai_artifacts` holds reflection_text/haiku and companions after orchestration.
- **`notifications`**: rows driving NotificationBell (`user_id`, `pause_instance_id`, message, context, severity).
- **`analytics_events`**: `pause_ai_call` (or allowlisted event) before generation.
- **Companion-related storage**: rows written/updated by `companion-orchestrate` (e.g. companion cache / `pause_ai_artifacts` — details in orchestrate + migrations).

## Systems that emerge from this review

1. **Pause system (full architecture)**: `docs/systems/pause/ai-powered-pause-system.md`
   - Phase 3 is the **server/cron slice**; Phase 2 is the **manual client slice**; together they should describe one product.

2. **Ops / cron**: `docs/ops/cron-setup.md`
   - Operational source for when workers run and how they are invoked securely.

## Reviewer Questions Checklist

Use these as "prove-or-disprove" questions while reading the Phase 3 files.

1. Can two concurrent `check-volatility` runs double-trigger the same user, or does `last_trigger_at` + eligibility prevent it?
2. What is the exact order: pause instance create, `notifications` insert, then fire-and-forget orchestrate — and what breaks if the user opens the notification in the first seconds?
3. Does automatic generation use the same conceptual context as manual (`use-holzen`) enough that severity and messaging feel consistent?
4. When the client opens `/pause` with only `pauseInstanceId`, does `useCompanionData` issue a second orchestrate call while cron is still running — and is that acceptable cost-wise?
5. Are quiet hours, snooze, and cumulative thresholds applied consistently with user expectations in settings UI?
6. What happens if CoinGecko or a sub-fetch fails mid-batch — partial users processed, retries?

## Conclusions and Tradeoffs

- **Coherent story**: automatic pause is **one server-owned pipeline**: eligibility -> generate -> persist pause + profile + notification -> **async** companion work. That matches "pause ready" in the bell before every companion slot is filled.
- **Fragility**: **time window** between notification and orchestrate completion; **duplicate orchestrate** risk when the user opens `/pause` immediately (aligns with `docs/backlog/orchestrate-client-cron.md`).
- **Featured grounding**: cron may leave featured grounding null initially; expanded companions should still load when orchestration completes — UI must not assume parity with manual path for every field on first paint. **2026-04:** `use-companion-data` resets all companion state in `useLayoutEffect` on `pauseInstanceId` change; companion slots are loaded **lazily** on card tap (not on mount), so cron-filled `pause_ai_artifacts` rows are hydrated from DB and the user sees cached content instantly without a skeleton flash (see `docs/backlog/cron-pause-featured-parity.md`).

Tradeoffs / alternatives (documented in backlog; **policy chosen 2026-04** — fire-and-forget retained):

- **Await orchestrate before `notifications`**: fewer races, slower notifications, higher tail latency if orchestrate is slow.
- **Enrich notification payload** with enough text to render without waiting for orchestrate: more duplication, faster first paint.
- **Keep fire-and-forget**: current shape; rely on client cache, rate limits, skip-if-served orchestrate, and loader UX on `/pause` (see `docs/backlog/automatic-pause-notification-timing.md`).

## What to Review Next and Why

**Phase 4** covers **other scheduled edge workers** that feed the pause ecosystem but are not the main volatility trigger: **BTC price cache**, **content feeds**, **pregenerate companions**. That is the natural next step after Phase 3 because:

1. Phase 3 established **who** triggers automatic pause and **how** notifications + orchestrate interact.
2. Phase 4 answers **what data** those workers keep warm (prices, library content, companion cache lifecycle) so Phase 5 quality/rate-limit docs connect to real inputs.

**Why Phase 4 before Phase 5 (quality gates)?**

- Quality gates and caches assume **fresh prices** and **content library** behavior; reviewing workers first avoids guessing where inputs come from.

**Phase 4 scope (pointer):**

- `refresh-btc-prices`, `fetch-source-feeds`, `pregenerate-companions` per `docs/reviews/phase-4-cron-workers-caching.md`.

Step-by-step review doc: `docs/reviews/phase-4-cron-workers-caching.md` (same section layout as Phases 1-3).
