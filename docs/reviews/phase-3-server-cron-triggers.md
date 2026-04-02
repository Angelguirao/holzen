# Phase 3: Server triggers & cron behavior review

## Scope

Server/cron entrypoints and helpers that power automatic pause generation and the notification surface:

- `supabase/functions/check-volatility/index.ts`
- `supabase/functions/_shared/pause-cron-parity.ts`
- `supabase/functions/_shared/pause-context-suffix.ts`
- Existing docs: `docs/ops/cron-setup.md` and the pause system spec

## What “automatic pause” actually does

### 1. Eligibility + anti-spam gates (`check-volatility`)

`check-volatility`:

1. Loads all `profiles` and filters to an `eligible` subset by:
   - Daily trigger: `abs(changePercent) >= effectiveThreshold`
   - Cumulative trigger: `isCumulativeMoveTriggered(cumulativeChangePercent, cumulative_threshold)`
   - Quiet hours: both legacy (`quiet_hours_start/end`) and extended `quiet_windows`
   - Snooze: `snoozed_until > now`
   - Cooldown: if `last_trigger_at` exists, must be older than `cooldown_hours` (default 6h)
2. Claims cooldown *optimistically* by updating `profiles.last_trigger_at` to “now” before generating reflection.
   - Prevents multiple concurrent workers from double-firing the same cooldown slot.

### 2. Reflection generation + parity throttling

For each eligible user, `check-volatility`:

1. Builds a BTC context string (`ctx`) with:
   - Direction + % move (24h and optionally 7d)
   - Fear & Greed snapshot (`fetchFearGreedSnapshot`)
   - On-chain snapshot (`fetchOnChainSnapshot`)
2. Inserts an allowlisted analytics event `pause_ai_call` **before** calling the reflection generator.
3. Calls `generateUnifiedReflection` directly (cron-side) to get `result.message` (+ `haiku` depending on model output).

### 3. Writes the “pause ready” record

After generating the reflection:

- Inserts a `reflections` row with:
  - `message` + `context`
  - `haiku` only when `profile.companion_haiku` is enabled; otherwise stores `haiku = null`
  - `grounding_title` and `grounding_body` are inserted as `null` (commented as “filled by companion-orchestrate”)
  - Optional `mood` derived from recent reflection rows
- Updates `profiles.last_message` and `profiles.last_context`
- Inserts into `pause_notifications` with:
  - `user_id`
  - `reflection_id`
  - `message` and `context`
  - `severity` derived from absolute 24h move thresholds (high/moderate/mild)

This is the table `NotificationBell` reads to show “Pause ready” and to deep-link into `/pause`.

### 4. Dispatches companion generation in the background

`check-volatility` dispatches `companion-orchestrate` via `fetch(...)` (fire-and-forget), including:

- `Authorization: Bearer <service role key>`
- `userId` in the JSON body (required by the orchestrator’s service-role path)
- `reflectionId`, `context`, `reflectionMessage`, `severity`, `moodHistory`
- Catalog/filtering inputs for Signal and Grounding (`fetchSignalSourcesForOrchestrate`, `fetchGroundingSourcesForOrchestrate`)
- Recency hints derived from `v_reflection_with_companions` using `recencyHintsFromReflectionRows(...)`
- `enableSignal/enableGrounding/enableHistory/enableZoomOut` derived from profile prefs
- `useIntervention: true`

Because the orchestrator call is not awaited, it is possible for a user to click a pause notification slightly before companion writes complete.
The UI’s “expanded companion” components should still handle loading/error states (and `PauseSession` now hydrates featured reflection fields from `useHolzen` when `location.state` is minimal).

**Cost/race risk to validate:** the client runs its own `useCompanionData` orchestration when it sees missing cached rows in `reflection_companions`. If cron hasn't written those rows yet, the client can trigger a second `companion-orchestrate` for the same `reflectionId` (rate limits / daily budget may cap this, but it still costs).

## Findings / risks

1. **Fire-and-forget companion dispatch**
   - Companion generation writes are triggered after the `pause_notifications` record is created.
   - If UI hydration relies on denormalized “featured” fields that are filled by the orchestrator, there can be a short window where those fields are still `null`.
   - Expanded companion cards (grounding/signal/history/zoom) are generally expected to come from `reflection_companions` and should populate once the orchestrator finishes.

2. **Grounding/haiku featured-vs-expanded split**
   - `check-volatility` explicitly inserts `grounding_title/body` as `null`, stating they will be filled later.
   - This implies the client should not assume featured grounding is immediate for cron-driven pauses.

## Next steps (recommended)

1. Confirm UI behavior when a pause notification is clicked immediately after insertion:
   - Are featured fields empty but expanded companions load correctly?
2. If needed, consider a small reliability improvement:
   - await orchestrator completion before inserting `pause_notifications`, OR
   - enrich `pause_notifications` with enough featured fields to render immediately.

