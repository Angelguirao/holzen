# Phase 2: Manual pause pipeline review

This phase is the second "mental model pass": after Phase 1 (who can reach `/pause` and how auth works), we trace **how a manual pause is produced** (reflection + DB writes) and **how the pause UI consumes it** (`PauseSession`, companions, edge functions). If this contract is wrong, users see empty pause screens, wrong companions, or duplicate work.

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

1. **Producer/consumer contract**: what `useHolzen` writes (reflection row, profile fields, companions from `holzen-reflect`) vs what `PauseSession` reads (`location.state`, `useHolzen` fallback, `localStorage` session).
2. **Navigation payload**: `Home` navigates to `/pause` with a specific `state` shape; any other entry (deep link, notification) may omit fields.
3. **Two-stage companions**: initial haiku/grounding may come from `holzen-reflect` + insert; expanded companions + intervention often come from `companion-orchestrate` via `useCompanionData`.
4. **Cooldowns and errors**: `manualTrigger` respects manual cooldown; `holzen-reflect` failures set `error` state and may leave no reflection to navigate with.

## Mental Models & Useful Concepts

- **Producer vs consumer**: `useHolzen.generateMessage` / `manualTrigger` is the producer; `PauseSession` + `PauseReflect` + `CompanionSection` are consumers. They must agree on field names and semantics.
- **Ephemeral vs persisted**: `location.state` is lost on some navigations; `holzen_pause_session` in `localStorage` and `profiles` / `pause_ai_artifacts` are more durable.
- **Layered companion data**: featured text from the reflect response vs full companion slots from orchestration; races possible if cron and client both call orchestration.
- **Severity**: UI buckets (`mild` / `moderate` / `high`) come from BTC move in `useHolzen`; numeric severity may be passed to edge functions separately.

## CS/SE Concepts to Know (for this phase)

- **Producer-consumer contract**: explicit schema for what crosses each boundary (nav state, hook state, DB rows).
- **Idempotency / duplicate work**: calling `companion-orchestrate` twice may duplicate cost; cache and server logic mitigate; still worth reasoning about.
- **Eventual consistency**: reflection row may exist before companion rows are fully written; UI should tolerate loading or partial data.
- **TOCTOU**: user navigates to `/pause` before `useHolzen` has finished hydrating from profile; `profileLoaded` and fallbacks matter.
- **Failure modes**: network errors from `holzen-reflect` vs insert failures vs orchestrate failures have different user-visible outcomes.

## Reviewed starting points (file-by-file)

### `src/pages/Home.tsx` — manual entry + navigation contract

- Triggers `manualTrigger()` (with cooldown) and, when a pause is ready, navigates to `/pause` with `state`: `reflectionMessage`, `context`, `pauseInstanceId`, `companions`, `companionPrefs`, `severity`.
- Defines the "happy path" shape that `PauseSession` expects when coming from Home.

### `src/hooks/use-holzen.ts` — producer for pause state

- `manualTrigger` -> `generateMessage`: builds context from BTC data; invokes `holzen-reflect` (unless silent mode); creates a pause via `pause_create_or_reuse`, writes `pause_ai_artifacts`, updates `profiles` / `library_items`; sets `message`, `context`, `companions`, `lastPauseInstanceId`.
- Cooldown: `manualCooldownRemaining` + `localStorage` key per user.

### `src/pages/PauseSession.tsx` — pause UI orchestration + restoration

- Merges `location.state`, persisted `holzen_pause_session`, and `useHolzen()` into one view model (`message`, `context`, `pauseInstanceId`, `companions`, etc.).
- Mismatch guard: saved session discarded when `navState.pauseInstanceId` differs from saved (when `navState.pauseInstanceId` is present).
- If no `message` and profile still loading: loading UI; if still none: `noReflection` path.

### `src/components/pause/PauseReflect.tsx` — reflect step shell

- Passes `companions`, `companionPrefs`, `severity`, `pauseInstanceId`, `context`, `reflectionMessage` into `CompanionSection`.

### `src/components/CompanionSection.tsx` — companion UI + data hook

- Renders companion cards; uses `useCompanionData` internally (or passes through per codebase) for orchestration-driven content.

### `src/hooks/use-companion-data.ts` — orchestration client

- Invokes `companion-orchestrate` with `pauseInstanceId`, context, prefs, mood, etc.; handles cache-oriented responses and regeneration paths.

### `supabase/functions/holzen-reflect/index.ts` — reflection text + initial companions

- Server-side counterpart to the client `holzen-reflect` invoke (tone, style, context, etc.).

### `supabase/functions/companion-orchestrate/index.ts` — expanded companions + interventions

- Server-side counterpart to `companion-orchestrate`; validates pause ownership when `pauseInstanceId` is provided (service-role writes).

## Runtime touchpoints: endpoints, events, and side effects

- **Edge function: `holzen-reflect`**
  - Client: `supabase.functions.invoke('holzen-reflect', { body: { context, tone, style, ... } })` from `use-holzen.ts` (non-silent path).
- **Edge function: `companion-orchestrate`**
  - Client: `supabase.functions.invoke('companion-orchestrate', ...)` from `use-companion-data.ts` (multiple call sites for load/regenerate).
- **Direct Supabase client writes (browser)**:
  - `pause_instances` insert via RPC + `pause_ai_artifacts` upserts
  - `profiles` update (`last_message`, `last_context`, `last_trigger_at` in some paths)
  - `library_items` upsert (main pause bookmark + optional haiku, `source_type` per row)
- **Local**:
  - `localStorage` key `holzen_pause_session` for pause step persistence
  - Manual cooldown key `holzen_last_manual_at_*`

## Data models affected

- **`pause_instances`**: inserted on manual generate; `PauseSession` logs step events for mood/outcome/note/etc.
- **`profiles`**: `last_message`, `last_context`, `last_trigger_at` updated after reflection generation.
- **`library_items`**: bookmarks linked to `pause_instance_id` (main row `source_type = 'pause'`, companion rows use their slot types, optional `haiku`).
- **Companion-related tables** (server-side via orchestrate): `pause_ai_artifacts`, `companion_cache`, `companion_serves`, etc.

## Systems that emerge from this review

1. **Pause system (architecture)**: `docs/systems/pause/ai-powered-pause-system.md`
   - Broader manual vs automatic pause, companions, interventions, cron — Phase 2 is the **manual client slice** of that story.

2. **Route gating** (Phase 1): `docs/systems/routing/route-gating-system.md`
   - `/pause` is protected; Phase 2 assumes Phase 1's gate already passed.

## Reviewer Questions Checklist

Use these as "prove-or-disprove" questions while reading the Phase 2 files.

1. What exact fields does `Home` put in `location.state`, and does `PauseSession` read the same keys?
2. If `location.state` is missing or partial, what is the fallback order (`useHolzen`, `localStorage`, loading)?
3. When is `holzen-reflect` called vs silent mode, and what gets written to `pause_ai_artifacts` in each case?
4. Can the user open `/pause` with only `pauseInstanceId` (e.g. notification deep link)? What should they see?
5. Does `useCompanionData` always send a valid `pauseInstanceId` when one exists, and does `companion-orchestrate` reject cross-user ids?
6. Are there races between client orchestration and server cron writing the same reflection's companions?
7. What happens if `holzen-reflect` succeeds but creating the pause instance fails (partial state)?
8. How do manual cooldown and `error` from `useHolzen` affect whether navigation to `/pause` is possible?

## Conclusions and Tradeoffs

- The manual pipeline is **coherent** when Home and `useHolzen` complete before navigation: reflection row, profile fields, and nav state align.
- **Fragility** is at **entry boundaries**: any route to `/pause` that only passes `pauseInstanceId` (or nothing) requires the same fallback rules as full state; `PauseSession` + `useHolzen` hydration address the worst "no reflection" dead-ends when `profileLoaded` and hook state catch up.
- **Cost / duplication**: multiple clients (user session + cron) can invoke `companion-orchestrate`; caching and server logic limit waste but the tradeoff is worth monitoring (see Phase 3 cron review). Backlog: `docs/backlog/orchestrate-client-cron.md`.

- **Partial failure on the manual path**: `holzen-reflect` can succeed while a later pause insert fails; backlog: `docs/backlog/reflection-insert-partial-failure.md` (rename pending).

Tradeoffs / alternatives (see also `docs/backlog/pause-session-hydration.md`):

- **Nav state as source of truth** vs **always fetch reflection by id** on `/pause` entry: latter is more network but more robust for deep links.
- **Blocking navigation** until reflection is persisted vs **optimistic navigate**: current design favors having data before `/pause` for the Home path; other entry points need explicit handling.

## What to Review Next and Why

**Phase 3** shifts from "user clicked pause" to **server-side and scheduled triggers**: `check-volatility`, cron delivery, and how those write the same fields the client expects (`NotificationBell`, profile hydration, pause restoration). That is the natural follow-up because Phase 2 established the **manual** contract; Phase 3 asks whether **automatic** pauses and notifications **converge** on the same data shape without races.

**Why Phase 3 and not e.g. Library-only or Settings?**

- Automatic pause + notifications are the **other half** of the pause story; they reuse pause instances, artifacts, and UI entry points Phase 2 already named.
- Reviewing workers before unrelated CRUD avoids inventing a second mental model for "where reflection rows come from."

**Phase 3 scope (pointer):**

- Trace server-side triggers (`check-volatility` + cron), notification payloads, and alignment with `PauseSession` / `useProfile` / `NotificationBell`.

Step-by-step review doc: `docs/reviews/phase-3-server-cron-triggers.md`.
