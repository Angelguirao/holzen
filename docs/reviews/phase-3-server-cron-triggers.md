# Phase 3: Server triggers and cron behavior review

This phase is the third "mental model pass": after Phase 1 (auth + route gating) and Phase 2 (manual pause producer/consumer), we trace **automatic pause** — how **scheduled work** and **`check-volatility`** create pause instances and notifications, and how **client-side** reflection (`holzen-reflect`) and **`companion-orchestrate`** line up with **NotificationBell** and **PauseSession** once the user opens the app (**Pause V2**: **no** reflection LLM and **no** orchestrator dispatch on cron **claim**).

If this path drifts from Phase 2 or from **`check-volatility`** / **`PauseSession`** code, users see inconsistent “pause ready” copy vs what is persisted before **Reflect**, or wasted duplicate **`companion-orchestrate`** work on the client.

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
2. **Order of writes (V2):** pause instance + profile fields + `notifications` row on claim — **no** server-side `generateUnifiedReflection` and **no** `companion-orchestrate` from this worker; the UI may open `/pause` before the user has run **Reflect** / lazy companion fetches.
3. **Parity with manual pause**: cron builds BTC context similarly to `use-holzen` (shared helpers in `_shared/`), but **reflection LLM** work is **deferred** to the client at **Reflect** (`holzen-reflect`), not inline `generateUnifiedReflection` inside `check-volatility` on claim.
4. **Notification entry**: `NotificationBell` deep-links to `/pause` with `{ pauseInstanceId }` only — same boundary Phase 2 called out; hydration must come from profile/hooks/DB.

## Mental Models & Useful Concepts

- **Worker as producer**: `check-volatility` is a batch producer of pause instances + notifications; **`PauseSession`** runs **`holzen-reflect`** (reflect hook on **Reflect** through **Decide**, **Frame** + second **Breathe** included) and **`companion-orchestrate`** (lazy / intervention) in the browser — same contracts as manual.
- **Client orchestration**: companion slots fill from **`use-companion-data`** invokes after the user opens `/pause`; **eventual consistency** for `pause_ai_artifacts` depends on user navigation and taps, not a cron-side `fetch` to `companion-orchestrate`.
- **Optimistic cooldown**: updating `profiles.last_trigger_at` before downstream work reduces duplicate triggers under concurrent cron runs.
- **Featured vs expanded**: reflection copy appears after **Reflect**; do not assume expanded companion slots exist until the client has invoked **`companion-orchestrate`**.

## CS/SE Concepts to Know (for this phase)

- **Distributed race**: multiple **client** `companion-orchestrate` invokes for the same `pauseInstanceId` (rapid remounts / retries) — idempotency, cache, and cost (see `docs/backlog/orchestrate-client-cron.md` for historical cron+client overlap notes).
- **Eventual consistency**: notification exists before all companion rows are written; UI must tolerate loading states.
- **At-least-once / duplicate suppression**: eligibility + cooldown logic aims to avoid spam; still validate under clock skew and retries.
- **Separation of triggers**: pg_cron (or HTTP) invokes the edge function; auth uses service role or cron secrets per `docs/ops/cron-setup.md`.

## Reviewed starting points (file-by-file)

### `supabase/functions/check-volatility/index.ts` — main automatic pause worker

- Loads profiles, filters to **eligible** users (daily/cumulative move vs thresholds, quiet hours / `quiet_windows`, snooze, cooldown vs `last_trigger_at`).
- Fetches BTC metrics (CoinGecko) per user's hold currency; builds context string; enriches with Fear & Greed and on-chain snapshots via shared helpers.
- Claims cooldown by updating `profiles.last_trigger_at` before persisting the pause (optimistic lock pattern).
- Creates the pause instance via `pause_create_or_reuse_as`, updates `profiles` delivery fields (`last_context`, clears `last_message` per Pause V2), and inserts `notifications` for the bell UI.
- **Pause V2:** does **not** call `generateUnifiedReflection` on this worker and does **not** `fetch` `companion-orchestrate` on claim; reflection + companion AI run from **`PauseSession`** after the user opens the ritual.

### `supabase/functions/_shared/pause-cron-parity.ts`

- Shared enrichment helpers so cron-side **context strings** and **claim-time snapshot** fields stay aligned with manual/client expectations (Fear & Greed, on-chain, `pauseRecencyInputs` for mood hints). Full **`holzen-reflect`** / orchestrator input pools are assembled in the browser when the user reaches **Reflect** / taps companions.

### `supabase/functions/_shared/pause-context-suffix.ts`

- Helpers for consistent automatic-pause context suffixing / formatting where used by cron paths.

### `docs/ops/cron-setup.md`

- How `pg_cron` (or equivalent) calls `check-volatility` and related workers; schedule and auth headers.

### `src/components/NotificationBell.tsx` — notification consumer

- "Open pause" navigates to `/pause` with `state: { pauseInstanceId: p.pause_instance_id }` only — minimal payload; relies on Phase 2 hydration and profile/`useHolzen` fallbacks.

## Runtime touchpoints: endpoints, events, and side effects

- **Scheduled HTTP**: cron invokes edge function URL for `check-volatility` (see `docs/ops/cron-setup.md` for headers/secrets).
- **Edge function: `check-volatility`**: eligibility + BTC context + **`pause_create_or_reuse_as`** + profile/notification delivery (**Pause V2:** **no** `generateUnifiedReflection` / **no** `companion-orchestrate` on claim).
- **Edge function: `companion-orchestrate`**: invoked from **`PauseSession`** via **`use-companion-data`** (user JWT) for intervention + lazy slots — **not** from `check-volatility` on automatic pause claim.
- **External APIs**: CoinGecko (BTC charts), Fear & Greed, on-chain snapshot helpers; optional email via Lovable Email for notification copy.
- **Web Push**: may be used in `check-volatility` for push delivery (see function body for full flow).

## Data models affected

- **`profiles`**: `last_trigger_at` (cooldown claim), `last_context`, cleared `last_message` (Pause V2 delivery shape), thresholds, quiet windows, currency, companion prefs.
- **`pause_instances`**: new rows from automatic **claim**; `pause_ai_artifacts` for reflection/companions is filled later from **`holzen-reflect`** + **`companion-orchestrate`** in the client.
- **`notifications`**: rows driving NotificationBell (`user_id`, `pause_instance_id`, message, context, severity).
- **`analytics_events`**: cron-side reflection **`pause_ai_call`** is **not** inserted on claim; reflect-step analytics happen when **`holzen-reflect`** runs in the browser.
- **Companion-related storage**: rows written/updated by **`companion-orchestrate`** when the user is in **`PauseSession`** (e.g. `pause_ai_artifacts` — details in orchestrate + migrations).

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
4. When the client opens `/pause` with only `pauseInstanceId`, does `useCompanionData` issue intervention orchestrate while reflection is still empty — and is that acceptable cost-wise?
5. Are quiet hours, snooze, and cumulative thresholds applied consistently with user expectations in settings UI?
6. What happens if CoinGecko or a sub-fetch fails mid-batch — partial users processed, retries?

## Conclusions and Tradeoffs

- **Coherent story (V2):** automatic pause is **server-owned claim** (eligibility → persist pause + profile + notification) and **client-owned AI** ( **`holzen-reflect`** + **`companion-orchestrate`** ) once the user is in **`PauseSession`** — aligned with the manual path.
- **Fragility:** **time window** between notification and user completing **Reflect** / companion taps; UI must tolerate empty reflection and lazy companion loaders.
- **Featured / expanded:** cron does not pre-fill companion slots on claim; expanded companions load after client orchestration — UI must not assume parity with a long-lived manual session on first paint. **`use-companion-data`** resets companion state on `pauseInstanceId` change; slots are lazy on tap where applicable (see `docs/backlog/cron-pause-featured-parity.md` for UX notes).

Tradeoffs / alternatives (historical backlog notes; **Pause V2** removed cron-side **`companion-orchestrate`** on claim):

- **Await orchestrate before `notifications`**: was discussed when cron dispatched orchestrate; less relevant now that orchestration is client-driven.
- **Enrich notification payload** with more preview text: still useful for faster first paint before **Reflect**.
- **Current shape**: rely on client **`holzen-reflect`**, lazy orchestrate, rate limits, and loader UX on `/pause` (see `docs/backlog/automatic-pause-notification-timing.md` for older fire-and-forget narrative).

## What to Review Next and Why

**Phase 4** covers **other scheduled edge workers** that feed the pause ecosystem but are not the main volatility trigger: **BTC price cache**, **content feeds**, **pregenerate companions**. That is the natural next step after Phase 3 because:

1. Phase 3 established **who** triggers automatic pause **claim** and how **notifications** relate to **client-side** reflection/orchestration.
2. Phase 4 answers **what data** those workers keep warm (prices, library content, companion cache lifecycle) so Phase 5 quality/rate-limit docs connect to real inputs.

**Why Phase 4 before Phase 5 (quality gates)?**

- Quality gates and caches assume **fresh prices** and **content library** behavior; reviewing workers first avoids guessing where inputs come from.

**Phase 4 scope (pointer):**

- `refresh-btc-prices`, `fetch-source-feeds`, `pregenerate-companions` per `docs/reviews/phase-4-cron-workers-caching.md`.

Step-by-step review doc: `docs/reviews/phase-4-cron-workers-caching.md` (same section layout as Phases 1-3).
