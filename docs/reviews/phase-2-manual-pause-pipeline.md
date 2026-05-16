# Phase 2: Manual pause pipeline review

> **Pause V2 (current):** `use-holzen` opens the pause via `pause_create_or_reuse` on Home; **`holzen-reflect`** runs from **`use-pause-reflect-generation`** / **`generateReflectionAtReflectStep`** once the deep ritual reaches **Reflect** (**`PauseSession`** keeps that hook enabled through **Frame**, second **Breathe**, and **Decide**), not from `use-holzen` on the non-silent path. Silent mode still writes a stub `reflection_text` on trigger.

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

1. **Producer/consumer contract**: what `useHolzen` writes (`pause_instances` + context snapshot; **silent** stub `reflection_text` on Home) vs what **`use-pause-reflect-generation`** adds once the deep ritual reaches **Reflect** (`holzen-reflect` → `pause_ai_artifacts`; hook stays enabled on **Frame**, second **Breathe**, and **Decide**) vs what `PauseSession` reads (`location.state`, `useHolzen` fallback, `localStorage` session).
2. **Navigation payload**: `Home` navigates to `/pause` with a specific `state` shape; any other entry (deep link, notification) may omit fields.
3. **Two-stage companions**: initial haiku/grounding may come from **`holzen-reflect`** at Reflect + upsert; expanded companions + intervention often come from `companion-orchestrate` via `useCompanionData`.
4. **Cooldowns and errors**: `manualTrigger` respects manual cooldown; **`holzen-reflect`** failures surface on the **Reflect** step (`reflectionError` / retry), not necessarily as Home `useHolzen` errors for non-silent manual.

## Mental Models & Useful Concepts

- **Producer vs consumer**: `useHolzen.generateMessage` / `manualTrigger` is the producer; `PauseSession` + `PauseReflect` + `CompanionSection` are consumers. They must agree on field names and semantics.
- **Ephemeral vs persisted**: `location.state` is lost on some navigations; `holzen_pause_session` in `localStorage` and `profiles` / `pause_ai_artifacts` are more durable.
- **Layered companion data**: featured text from the reflect response vs full companion slots from orchestration; overlapping **client** orchestrate invokes (remount / retry) can still race cost; **`check-volatility`** does not orchestrate on claim (Pause V2).
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
- Maintainer-oriented overview (widgets, zen mode, checkout params, error helpers): [screens/home.md](../screens/home.md).

### `src/hooks/use-holzen.ts` — producer for pause state

- `manualTrigger` -> `generateMessage`: builds context from BTC data; **`pause_create_or_reuse`** (non-silent: no `holzen-reflect` on Home); **silent**: stub `reflection_text` upsert; sets `context`, `lastPauseInstanceId`, and **`message`** only when a reflection exists (silent or hydrated from DB).
- Cooldown: `manualCooldownRemaining` + `localStorage` key per user.

### `src/pages/PauseSession.tsx` — pause UI orchestration + restoration

- Merges `location.state`, persisted `holzen_pause_session`, and `useHolzen()` into one view model (`message`, `context`, `pauseInstanceId`, `companions`, etc.).
- Mismatch guard: saved session discarded when `navState.pauseInstanceId` differs from saved (when `navState.pauseInstanceId` is present).
- If shell not ready and profile still loading: loading UI; if still none: **`PauseSessionGate`** empty state (`pause.sessionEmptyTitle` / `sessionEmptyBody`) — not shown when an instance id exists but reflection is still generating at Reflect.

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
  - Client: `invokeEdge('holzen-reflect', …)` from **`src/lib/pause-reflect-artifact.ts`** (`generateReflectionAtReflectStep`), used by **`use-pause-reflect-generation.ts`** from **`PauseSession`** once the deep ritual reaches **Reflect** (the hook stays enabled on **Frame**, second **Breathe**, and **Decide**). **`use-holzen`** does **not** invoke it on the non-silent Home path.
- **Edge function: `companion-orchestrate`**
  - Client: `invokeEdge('companion-orchestrate', …)` from `use-companion-data.ts` (multiple call sites for load/regenerate).
- **Direct Supabase client writes (browser)**:
  - `pause_instances` via **`pause_create_or_reuse`** RPC; **`pause_ai_artifacts`** upserts for **silent** stub and for **Reflect**-time reflection (and companion rows from orchestration).
- **Local**:
  - `localStorage` key `holzen_pause_session` for pause step persistence
  - Manual cooldown key `holzen_last_manual_at_*`

## Data models affected

- **`pause_instances`**: inserted on manual generate; `PauseSession` logs step events for mood/outcome/note/etc.
- **`profiles`**: `last_context` / `last_trigger_at` are **not** written by **`use-holzen`** on the manual path today; automatic / cron paths update `last_context` and `last_trigger_at` as documented in the pause AI doc.
- **`collections` / `collection_items`**: optional user-defined groupings keyed by `pause_instance_id` (see `use-library.ts`).
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
6. Can overlapping client **`companion-orchestrate`** invokes (remount / retry) waste cost or race writes for the same **`pauseInstanceId`**?
7. What happens if **`pause_create_or_reuse`** succeeds on Home but **`holzen-reflect`** fails later at **Reflect** (partial reflection artifact)?
8. How do manual cooldown and errors from **`useHolzen`** vs **`use-pause-reflect-generation`** affect whether navigation to `/pause` and the Reflect step remain usable?

## Conclusions and Tradeoffs

- The manual pipeline is **coherent** when Home and `useHolzen` complete **`pause_create_or_reuse`** before navigation: `pause_instances` + context align with nav state; **non-silent** reflection text arrives at **Reflect** when **`holzen-reflect`** succeeds.
- **Fragility** is at **entry boundaries**: any route to `/pause` that only passes `pauseInstanceId` (or nothing) requires the same fallback rules as full state; `PauseSession` + `useHolzen` hydration address the worst "no reflection" dead-ends when `profileLoaded` and hook state catch up.
- **Cost / duplication:** overlapping **`companion-orchestrate`** invokes can still happen from **client** remounts / retries / navigation; **`check-volatility`** does **not** orchestrate on claim (Pause V2), so the old “user session + cron” overlap is gone for automatic pause. Skip/cache + skip-if-served still matter (see Phase 3 review + `docs/backlog/orchestrate-client-cron.md` for pre–V2 history).

- **Partial failure on the manual path**: **`holzen-reflect`** can succeed while **`pause_ai_artifacts`** upsert fails (rare); or the instance exists but Reflect-time generation fails (user-visible retry on Reflect). Backlog: `docs/backlog/reflection-insert-partial-failure.md` (rename pending).

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
