# Pause session (`/pause`)

Authoritative orchestration: [`src/pages/PauseSession.tsx`](../../src/pages/PauseSession.tsx).

`/pause` is the full-screen volatility ritual. It consumes Home, banner, Library, and notification navigation payloads; restores an in-progress browser session when safe; walks the user through brief or deep ritual beats; logs steps through `pause-api` RPC wrappers; and only shows Done after the backing pause row is `completed`.

**Cross-screen pattern:** this route follows the same thin page + named hooks + `src/lib` pure helpers playbook as [Home](home.md). The reusable guidance lives in [React screen orchestration](../fundamentals/react-screen-orchestration.md); this doc is the consumer map for the pause-specific workflow.

## Source Map

| Concern | Primary files |
| --- | --- |
| Route conductor | [`src/pages/PauseSession.tsx`](../../src/pages/PauseSession.tsx) |
| Gate, loading, empty, and picker decisions | [`PauseSessionGate.tsx`](../../src/components/pause/PauseSessionGate.tsx), [`PauseSessionGateContent.tsx`](../../src/components/pause/PauseSessionGateContent.tsx), [`pause-session-gate-flags.ts`](../../src/lib/pause-session-gate-flags.ts) |
| Depth picker and About pauses sheet | [`PauseSessionDepthPickerStack.tsx`](../../src/components/pause/PauseSessionDepthPickerStack.tsx), [`PauseDepthPicker.tsx`](../../src/components/pause/PauseDepthPicker.tsx) |
| Scaffold shell, header, stepper, sound, countdown | [`PauseSessionScaffoldShell.tsx`](../../src/components/pause/PauseSessionScaffoldShell.tsx), [`PauseSessionScaffold.tsx`](../../src/components/pause/PauseSessionScaffold.tsx), [`PauseEngagedOpenMaxCountdown.tsx`](../../src/components/pause/PauseEngagedOpenMaxCountdown.tsx) |
| Brief ritual body | [`PauseSessionBriefRitualBody.tsx`](../../src/components/pause/PauseSessionBriefRitualBody.tsx), [`PauseBriefProgress.tsx`](../../src/components/pause/PauseBriefProgress.tsx), [`brief-pause-order.ts`](../../src/lib/brief-pause-order.ts) |
| Deep ritual body | [`PauseSessionDeepRitualBody.tsx`](../../src/components/pause/PauseSessionDeepRitualBody.tsx), [`PauseProgress.tsx`](../../src/components/pause/PauseProgress.tsx), [`pause-session-step-map.ts`](../../src/lib/pause-session-step-map.ts) |
| RPC and mutation handlers | [`pause-api.ts`](../../src/lib/pause-api.ts), [`use-pause-session-initial-mood-handlers.ts`](../../src/hooks/use-pause-session-initial-mood-handlers.ts), [`use-pause-breath-segment-rpc-loggers.ts`](../../src/hooks/use-pause-breath-segment-rpc-loggers.ts), [`use-pause-session-decide-handler.ts`](../../src/hooks/use-pause-session-decide-handler.ts) |
| Local session persistence | [`pause-session-storage.ts`](../../src/lib/pause-session-storage.ts), [`use-pause-session-persist-to-storage.ts`](../../src/hooks/use-pause-session-persist-to-storage.ts), [`use-pause-session-ritual-storage-sync.ts`](../../src/hooks/use-pause-session-ritual-storage-sync.ts) |
| Exit, back, and step navigation | [`use-pause-session-exit-navigation.ts`](../../src/hooks/use-pause-session-exit-navigation.ts), [`use-pause-session-header-back-handler.ts`](../../src/hooks/use-pause-session-header-back-handler.ts), [`use-pause-session-go-back.ts`](../../src/hooks/use-pause-session-go-back.ts), [`use-pause-session-go-to-step.ts`](../../src/hooks/use-pause-session-go-to-step.ts) |

## Purpose

The page stays a conductor: hooks gather shell data and callbacks, pure builders derive props, and visual components render the ritual. Business rules that must be shared or tested belong in `src/lib`, especially when they affect hydration, step mapping, gate predicates, or RPC payloads.

## Major dependencies


| Area                            | Source                                                                     | Notes                                                                                                  |
| ------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Reflection + open pause context | [`useHolzen`](../../src/hooks/use-holzen.ts) | Message, companions, severity, `lastPauseInstanceId`, `dismissMessage`, `resyncOpenPauseFromDb`, etc. |
| Subscription / Pro | [`useSubscription`](../../src/hooks/use-subscription.ts) | Decide path refresh; favorite toggle. |
| Navigation in | [`parsePauseSessionLocationState`](../../src/lib/router-location-state.ts) | `location.state` from Home / banners / manual flows; see [Home -> Pause](home.md#navigation-to-pause). |
| RPC mutations | [`pause-api.ts`](../../src/lib/pause-api.ts) | Typed wrappers; canonical SQL in migrations; see [pause-system section 4](../systems/pause-system.md). |
| Local resume | [`pause-session-storage.ts`](../../src/lib/pause-session-storage.ts) | `loadSession` / `saveSession`; hydrate helpers in `pause-session-step-map.ts`. |
| Data + lifecycle contract | [pause-system.md](../systems/pause-system.md) | Tables, state machine, `v_pause_full`, and step events; section 10 indexes this screen’s lib map. |


## Entry Payloads

Routes should pass `navigate('/pause', { state })` using `PauseSessionLocationState` from [`router-location-state.ts`](../../src/lib/router-location-state.ts). The parser accepts optional fields and discards invalid shapes.

```ts
type PauseSessionLocationState = {
  pauseInstanceId?: string;
  reflectionMessage?: string;
  context?: string | null;
  companions?: CompanionData;
  companionPrefs?: CompanionPrefs;
  severity?: 'mild' | 'moderate' | 'high';
};
```

Common callers:

| Caller | Expected payload |
| --- | --- |
| Home pause cards and banners | Usually pass `pauseInstanceId` plus current reflection shell fields from `useHolzen`. |
| Library current-pause card / notifications | May pass only `pauseInstanceId`; `/pause` then fetches the row and artifacts. |
| Pending offer adoption | Navigates after `resyncOpenPauseFromDb`, then reuses the refreshed current-pause shell. |

Do not pass untyped ad hoc router state. Add new fields to `PauseSessionLocationState`, update `parsePauseSessionLocationState`, and test invalid payloads before using them.

## Shell Hydration

`usePauseSessionShell` is the single entry point for restore, nav-vs-Holzen merge, optional DB fetch, and resolved shell data. It delegates pure precedence rules to `computePauseSessionHydration` and `computePauseSessionResolved`.

Hydration precedence:

1. Restored browser session with a message, unless it belongs to a different explicit `pauseInstanceId`.
2. Current `useHolzen` message when it is aligned with the nav `pauseInstanceId`.
3. Navigation `reflectionMessage`.
4. Fetch by nav `pauseInstanceId` from `pause_instances` + `pause_ai_artifacts`.
5. Current `useHolzen` message even if not aligned.
6. Empty gate.

The id-only fetch path reads `pause_instances.context_snapshot`, `state`, and `engaged_at`, then folds `haiku` and `ground_nudge` artifacts into the same `CompanionData` shape used by Home. If that query fails or returns no reflection text, the gate shows the fetch-failed/empty state rather than inventing copy.

## Local Persistence

The browser snapshot key is `holzen_pause_session`; the current schema is `PAUSE_RITUAL_SCHEMA_VERSION = 4`. Persisted data includes shell fields, deep-step state, brief-step state, selected moods/intensities, decision, and `ritualDepth`.

Migration constraints:

- v4 adds brief/deep fields. Older saved sessions migrate to `ritualDepth: 'deep'`.
- Legacy `breathe -> feel -> reflect -> shift -> decide` saves are normalized to the current Feel-first deep flow.
- `loadSession()` swallows invalid JSON and returns `null`; do not surface raw localStorage errors to users.
- `clearSession()` runs after a completed Decide path, explicit abandon close, or other handlers that intentionally end local resume.

When changing persisted fields, bump `PAUSE_RITUAL_SCHEMA_VERSION`, keep migration deterministic, and update tests around `pause-session-storage`, `pause-session-step-map`, and ritual storage sync.

## Rendering and hooks

`PauseSession.tsx` runs **hooks in a stable order** at the top (Holzen, subscription, shell, mount log, coalesced view-model, then large local `useState` blocks, then handler hooks, then derived memo/objects). There is **no** early return that skips hooks after a subset has run; this is the same **Rules of Hooks** discipline as Home. Full-screen route: see [`App.tsx`](../../src/App.tsx) / route table (no bottom nav on `/pause`).

## User-visible modes (high level)

1. **Gate**: `PauseSessionGate` handles profile not ready, instance fetch in flight, fetch failure, or "no shell message" vs waiting for hydration (see [`pause-session-gate-flags.ts`](../../src/lib/pause-session-gate-flags.ts)).
2. **Depth picker**: user has a coalesced reflection message but `ritualEntry === 'picker'` (`PauseSessionDepthPickerStack`).
3. **Brief ritual**: four macro steps (`BriefPauseStep`); body in `PauseSessionBriefRitualBody`.
4. **Deep ritual**: full `PauseStep` rail; body in `PauseSessionDeepRitualBody` (Feel, Breathe, Reflect, Frame, second Breathe, Choose bridge, Decide).
5. **Done**: `phase === 'done'`; `PauseDone` with impact data after successful outcome path (see [pause-system section 7.5](../systems/pause-system.md)).

## Navigation out

[`usePauseSessionExitNavigation`](../../src/hooks/use-pause-session-exit-navigation.ts) provides close/return handlers consumed by the gate and scaffold. Pending pause offers use [`usePauseSessionPendingPauseOfferNavigation`](../../src/hooks/use-pause-session-pending-pause-offer-navigation.ts) for adopt/resync flows.

## Analytics

Do **not** add new PostHog events here without updating [event taxonomy](../ops/event-taxonomy.md). Brief vs deep ratios for product metrics stay SQL-first on `v_pause_full` / `pause_step_events` per [pause-system](../systems/pause-system.md); avoid duplicating that in client-only events unless product explicitly asks.

## Best practices for edits

- Keep **pure** branch logic and restores in `src/lib/` with **Vitest** (`pause-session-*`, `pause-api` boundaries typed here).
- Prefer **named hooks** over growing `PauseSession.tsx`: one vertical slice per concern (already split: shell, breath, decide, gate, etc.).
- **i18n:** use `t('pause.*')` where the tree already externalizes strings.
- **RPC ordering:** Decide / dismiss / `completed` wait semantics are easy to break; read [pause-system section 7.5](../systems/pause-system.md) before changing Decide handlers.
- **Migrations / edge:** if RPCs or HTTP entrypoints change, follow [deployment-sync-guide.md](../ops/deployment-sync-guide.md) and root [AGENTS.md](../../AGENTS.md).

## Archive: Retrospective Decision

The **Archive** Pauses and Echoes tabs use separate `v_pause_archive_*` lists (see [pause-system section 9](../systems/pause-system.md)). For terminal rows `expired` or `dismissed` that still lack `outcome_logged`, the app offers **Log decision** on each card: it opens a sheet that calls `pause_log_step` with the same three retrospective outcomes as Home bulk-hold (`held`, `bought`, `sold`). [`ArchivePauseRetrospectiveOutcomeSheet.tsx`](../../src/components/archive/ArchivePauseRetrospectiveOutcomeSheet.tsx) reuses `PauseDecide`. That path does **not** navigate to `/pause`. For many expired instances at once, Home `BulkHoldCard` still provides the bulk review flow.

## Related reading

- [Pause system](../systems/pause-system.md): canonical **data model**, RPCs, client ritual section 7, and related docs/code section 10.
- [AI-powered pause](../systems/pause/ai-powered-pause-system.md): edges, orchestrator, triggers.
- [React screen orchestration](../fundamentals/react-screen-orchestration.md): playbook (Home walkthrough + patterns reused here).
- [Home screen](home.md): producer of `/pause` `location.state` and pause card UX.
- [Phase 2: manual pause pipeline](../reviews/phase-2-manual-pause-pipeline.md): producer/consumer contract for manual flows.
