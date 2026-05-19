# Pause session (`/pause`)

**Pause-first shipped scope (2026-05):** full ritual on `/pause`; reflect artifact kind **`reflection_text`**; post-pause exits go Home/Archive (no Journey stats). Lapsed users see engagement block via entitlement. Manifest: [active-surface.md](../ops/active-surface.md).

Authoritative orchestration: `[PauseSessionScreen.tsx](../../src/screens/pause/PauseSessionScreen.tsx)` (`[use-pause-session-screen.ts](../../src/screens/pause/hooks/use-pause-session-screen.ts)`); thin page `[PauseSession.tsx](../../src/pages/PauseSession.tsx)`.

**Cross-screen patterns:** the same **thin page + named hooks + `src/lib` pure helpers** playbook as [Home](home.md) is spelled out in **[React screen orchestration](../fundamentals/react-screen-orchestration.md)**. Home **produces** navigation into this route; this doc is the **consumer** map for the full-screen volatility ritual.


| Piece                                        | File                                                                                              |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Route screen + conductor hook                | `[PauseSessionScreen.tsx](../../src/screens/pause/PauseSessionScreen.tsx)`, `[use-pause-session-screen.ts](../../src/screens/pause/hooks/use-pause-session-screen.ts)` |
| Gate (hydration / fetch / profile)           | `[PauseSessionGate.tsx](../../src/screens/pause/components/PauseSessionGate.tsx)`                         |
| Gate body: picker vs scaffold slot           | `[PauseSessionGateContent.tsx](../../src/screens/pause/components/PauseSessionGateContent.tsx)`           |
| Depth picker + About pauses sheet            | `[PauseSessionDepthPickerStack.tsx](../../src/screens/pause/components/PauseSessionDepthPickerStack.tsx)` |
| Scaffold shell (header, stepper slot, sound) | `[PauseSessionScaffoldShell.tsx](../../src/screens/pause/components/PauseSessionScaffoldShell.tsx)`       |
| Scaffold frame + ritual routing              | `[PauseSessionScaffold.tsx](../../src/screens/pause/components/PauseSessionScaffold.tsx)`                 |
| Deep header stepper (read-only)             | `[PauseProgress.tsx](../../src/screens/pause/components/PauseProgress.tsx)`                               |
| Session / done body (brief vs deep)          | `[PauseSessionScaffoldBody.tsx](../../src/screens/pause/components/PauseSessionScaffoldBody.tsx)`         |
| Brief ritual beats (Framer transitions)      | `[PauseSessionBriefRitualBody.tsx](../../src/screens/pause/components/PauseSessionBriefRitualBody.tsx)`   |
| Deep ritual beats                            | `[PauseSessionDeepRitualBody.tsx](../../src/screens/pause/components/PauseSessionDeepRitualBody.tsx)`     |
| Brief macro stepper (read-only)              | `[PauseBriefProgress.tsx](../../src/screens/pause/components/PauseBriefProgress.tsx)`                     |
| Header back visibility (pure)                | `[pause-session-header-back.ts](../../src/lib/pause-session-header-back.ts)`                      |


**Lib helpers (representative):** shell hydration and fetch (`[pause-session-hydration.ts](../../src/lib/pause-session-hydration.ts)`, `[use-pause-session-shell.ts](../../src/hooks/use-pause-session-shell.ts)`, `[use-pause-session-fetch.ts](../../src/hooks/use-pause-session-fetch.ts)`, `[pause-session-fetched-instance.ts](../../src/lib/pause-session-fetched-instance.ts)`), coalesced shell (`[pause-session-shell-view-model.ts](../../src/lib/pause-session-shell-view-model.ts)`), gate predicates (`[pause-session-gate-flags.ts](../../src/lib/pause-session-gate-flags.ts)`), local restore / step hydrate (`[pause-session-step-map.ts](../../src/lib/pause-session-step-map.ts)`), scaffold derived props + ritual payloads (`[pause-session-scaffold-ritual-props.ts](../../src/lib/pause-session-scaffold-ritual-props.ts)`, `[pause-session-scaffold-ritual-payloads.ts](../../src/lib/pause-session-scaffold-ritual-payloads.ts)`), mount log snapshot (`[pause-session-mount-log-params.ts](../../src/lib/pause-session-mount-log-params.ts)`, `[use-pause-session-mount-log.ts](../../src/hooks/use-pause-session-mount-log.ts)`), navigation state (`[router-location-state.ts](../../src/lib/router-location-state.ts)` — `PauseSessionLocationState`).

Hooks (`src/hooks/use-pause-session-*.ts`, `use-pause-*` where pause-specific): shell, mount log, step transition, breath segment RPC loggers, feel/shift dedupe refs, favorite toggle, initial mood, shift frame done, decide, exit navigation, breath step handlers, header back, persist to storage, ritual storage sync, entry presentation, breath timed active reset, depth/brief copy, breath second label variant, brief past step, go back / go to step, pending pause offer navigation, depth picker handlers, brief feel select — plus shared `[useHolzen](../../src/hooks/use-holzen.ts)` / `[useSubscription](../../src/hooks/use-subscription.ts)` for shell + Decide.

## Purpose

`/pause` is the **full-screen** volatility ritual: choose **brief** vs **deep** (or resume from local storage), walk Feel → … → Decide, log steps through `**pause-api`** RPCs, and finish on **Done** when Postgres reports `**completed`**. The page stays a **conductor**: props and callbacks are assembled from hooks and pure builders, not inlined business rules.

## Major dependencies


| Area                            | Source                                                                     | Notes                                                                                                  |
| ------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Reflection + open pause context | `[useHolzen](../../src/hooks/use-holzen.ts)`                               | Message, companions, severity, `lastPauseInstanceId`, `dismissMessage`, `resyncOpenPauseFromDb`, etc.  |
| Subscription / Pro              | `[useSubscription](../../src/hooks/use-subscription.ts)`                   | Decide path refresh; favorite toggle                                                                   |
| Navigation in                   | `[parsePauseSessionLocationState](../../src/lib/router-location-state.ts)` | `location.state` from Home / banners / manual flows — see [Home → Pause](home.md#navigation-to-pause)  |
| RPC mutations                   | `[pause-api.ts](../../src/lib/pause-api.ts)`                               | Typed wrappers; canonical SQL in migrations — doc: [pause-system §4](../systems/pause-system.md)       |
| Local resume                    | `[pause-session-storage.ts](../../src/lib/pause-session-storage.ts)`       | `loadSession` / `saveSession`; hydrate helpers in `pause-session-step-map.ts`                          |
| Data + lifecycle contract       | [pause-system.md](../systems/pause-system.md)                              | Tables, state machine, `**v_pause_full`** / step events — **section 10** indexes this screen’s lib map |


## Rendering and hooks

`usePauseSessionScreen` runs **hooks in a stable order**; `PauseSessionScreen.tsx` is presentation-only. at the top (Holzen, subscription, shell, mount log, coalesced view-model, then large local `useState` blocks, then handler hooks, then derived memo/objects). There is **no** early return that skips hooks after a subset has run — same **Rules of Hooks** discipline as Home. Full-screen route: see `[App.tsx](../../src/App.tsx)` / route table (no bottom nav on `/pause`).

## User-visible modes (high level)

1. **Gate** — `PauseSessionGate`: profile not ready, instance fetch in flight, fetch failure, or “no shell message” vs waiting for hydration (see `[pause-session-gate-flags.ts](../../src/lib/pause-session-gate-flags.ts)`).
2. **Depth picker** — user has a coalesced reflection message but `ritualEntry === 'picker'` (`PauseSessionDepthPickerStack`).
3. **Brief ritual** — four macro steps (`BriefPauseStep`); body in `PauseSessionBriefRitualBody`.
4. **Deep ritual** — full `PauseStep` rail; body in `PauseSessionDeepRitualBody` (Feel, Breathe, Reflect, Frame, second Breathe, Choose bridge, Decide).
5. **Done** — `phase === 'done'`; `PauseDone` with impact data after successful outcome path (see [pause-system §7.5](../systems/pause-system.md)).

## Navigation out

`[usePauseSessionExitNavigation](../../src/hooks/use-pause-session-exit-navigation.ts)` provides close/return handlers consumed by the gate and scaffold. Pending pause offers use `[usePauseSessionPendingPauseOfferNavigation](../../src/hooks/use-pause-session-pending-pause-offer-navigation.ts)` for adopt/resync flows.

## Analytics

Do **not** add new PostHog events here without updating `[docs/ops/event-taxonomy.md](../ops/event-taxonomy.md)`. Brief vs deep **ratios** for product metrics stay **SQL-first** on `**v_pause_full`** / `**pause_step_events**` per [pause-system](../systems/pause-system.md) — avoid duplicating that in client-only events unless product explicitly asks.

## Best practices for edits

- Keep **pure** branch logic and restores in `src/lib/` with **Vitest** (`pause-session-`*, `pause-api` boundaries typed here).
- Prefer **named hooks** over growing `PauseSession.tsx` — one vertical slice per concern (already split: shell, breath, decide, gate, etc.).
- **i18n:** use `t('pause…')` where the tree already externalizes strings.
- **RPC ordering:** Decide / dismiss / `completed` wait semantics are easy to break — read [pause-system §7.5](../systems/pause-system.md) before changing Decide handlers.
- **Migrations / edge:** if RPCs or HTTP entrypoints change, follow [deployment-sync-guide.md](../ops/deployment-sync-guide.md) and root [AGENTS.md](../../AGENTS.md).

## Archive — retrospective decision (not `/pause`)

The **Archive** Pauses and Echoes tabs use separate `**v_pause_archive_*`** lists (see [pause-system §9](../systems/pause-system.md)). For terminal rows **`expired` or `dismissed`** that still lack `**outcome_logged**`, the app offers **Log decision** on each card: it opens a sheet that calls `**pause_log_step**` with the same three retrospective outcomes as Home bulk-hold (**held / bought / sold** — `**src/screens/archive/components/ArchivePauseRetrospectiveOutcomeSheet.tsx**` reuses **PauseDecide**). That path does **not** navigate to `/pause`. For **many** expired instances at once, Home **`BulkHoldCard`** still provides the bulk review flow.

## Related reading

- [Pause system](../systems/pause-system.md) — canonical **data model**, RPCs, client ritual §7, **§10 Related docs and code** (file index).
- [AI-powered pause](../systems/pause/ai-powered-pause-system.md) — edges, orchestrator, triggers.
- [React screen orchestration](../fundamentals/react-screen-orchestration.md) — playbook (Home walkthrough + patterns reused here).
- [Home screen](home.md) — producer of `/pause` `location.state` and pause card UX.
- [Phase 2: manual pause pipeline](../reviews/phase-2-manual-pause-pipeline.md) — producer/consumer contract for manual flows.