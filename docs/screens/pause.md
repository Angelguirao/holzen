# Pause session (`/pause`)

**Pause-first shipped scope (2026-05):** full ritual on `/pause`; reflect artifact kind **`reflection_text`**; post-pause exits go Home/Archive (no Journey stats). Lapsed users see engagement block via entitlement. Manifest: [active-surface.md](../ops/active-surface.md).

Authoritative orchestration: [`PauseSessionScreen.tsx`](../../src/screens/pause/PauseSessionScreen.tsx) → [`usePauseSessionScreen`](../../src/features/pause/public-hooks.ts) (presentation conductor + [`pause-scaffold-chrome-registry.tsx`](../../src/screens/pause/lib/pause-scaffold-chrome-registry.tsx) for route-only header slots).

**Cross-screen patterns:** the same **thin page + named hooks + feature/screen pure helpers** playbook as [Home](home.md) is spelled out in **[React screen orchestration](../fundamentals/react-screen-orchestration.md)**. Home **produces** navigation into this route; this doc is the **consumer** map for the full-screen volatility ritual.


| Piece                                        | File                                                                                              |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Route screen + conductor hook                | `[PauseSessionScreen.tsx](../../src/screens/pause/PauseSessionScreen.tsx)`, `[usePauseSessionScreen](../../src/features/pause/presentation/use-pause-session-screen.ts)` (export: `public-hooks`) |
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
| Header back visibility (pure)                | `[header-back.ts](../../src/features/pause/application/use-cases/session/header-back.ts)` (`isPauseSessionHeaderBackVisible` via `public`) |
| Scaffold chrome registry (route JSX)         | `[pause-scaffold-chrome-registry.tsx](../../src/screens/pause/lib/pause-scaffold-chrome-registry.tsx)` |


**Feature module (representative):** pure hydration (`[hydration.ts](../../src/features/pause/application/use-cases/session/hydration.ts)`), shell bootstrap (`[use-pause-session-shell-bootstrap.ts](../../src/features/pause/presentation/session/use-pause-session-shell-bootstrap.ts)`), fetch (`[use-pause-session-fetch.ts](../../src/features/pause/presentation/use-pause-session-fetch.ts)`), fetched instance (`[fetched-instance-from-fetch.ts](../../src/features/pause/application/use-cases/session/fetched-instance-from-fetch.ts)`), coalesced shell (`[shell-view-model.ts](../../src/features/pause/application/use-cases/session/shell-view-model.ts)`), gate predicates (`[gate-flags.ts](../../src/features/pause/application/use-cases/session/gate-flags.ts)`), local restore / step hydrate (`[step-map.ts](../../src/features/pause/application/use-cases/session/step-map.ts)`), scaffold ritual payloads (`[scaffold-ritual-payloads.ts](../../src/features/pause/presentation/session/scaffold-ritual-payloads.ts)`), mount log (`[mount-log-params.ts](../../src/features/pause/application/use-cases/session/mount-log-params.ts)`, `[use-pause-session-mount-log.ts](../../src/features/pause/presentation/session/use-pause-session-mount-log.ts)`), navigation state (`parsePauseSessionLocationState` in `public`).

Presentation hooks (`src/features/pause/presentation/use-pause-session-*.ts`, `presentation/session/use-pause-session-mount-log.ts`, `presentation/session/use-pause-session-step-handlers.ts`, `presentation/reflect/use-pause-reflect-*.ts`, `presentation/reflect/use-pause-session-initial-mood-handlers.ts`, `presentation/reflect/use-pause-session-feel-tiles-select.ts`, companion `use-companion-data.ts`): shell, mount log, step handlers (mood/breath/reflect/decide), step transition, breath handlers, decide, exit navigation, persist/storage sync, depth picker, pending offer navigation, etc. Import from [`public-hooks`](../../src/features/pause/public-hooks.ts) — not deep `application/` / `infrastructure/`. Shared [`useHolzen`](../../src/app/components/HolzenProvider.tsx) / [`useSubscription`](../../src/features/subscription/public-hooks) for shell + Decide.

## Purpose

`/pause` is the **full-screen** volatility ritual: choose **brief** vs **deep** (or resume from local storage), walk Feel → … → Decide, log steps through **`public-rpc`** (`pauseLogStep`, …), and finish on **Done** when Postgres reports **`completed`**. The page stays a **conductor**: props and callbacks are assembled from hooks and pure builders, not inlined business rules.

## Major dependencies


| Area                            | Source                                                                     | Notes                                                                                                  |
| ------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Reflection + open pause context | [`useHolzen`](../../src/app/components/HolzenProvider.tsx)                               | Message, companions, severity, `lastPauseInstanceId`, `dismissMessage`, `resyncOpenPauseFromDb`, etc.  |
| Subscription / Pro              | `[useSubscription](../../src/features/subscription/public-hooks)`        | Decide path refresh; favorite toggle                                                                   |
| Navigation in                   | `parsePauseSessionLocationState` ([`public`](../../src/features/pause/public.ts)) | `location.state` from Home / banners / manual flows — see [Home → Pause](home.md#navigation-to-pause) |
| RPC mutations                   | [`public-rpc`](../../src/features/pause/public-rpc.ts) (`runInitialEmotionSelect`, `pauseDismissCurrent`, …) | `PauseRepository` → `pause-rpc-client.ts`; canonical SQL in [pause-system §4](../systems/pause-system.md) |
| Local resume                    | [`persisted-session-storage.ts`](../../src/features/pause/infrastructure/session/persisted-session-storage.ts) | `loadSession` / `saveSession`; hydrate helpers in `step-map.ts` |
| Data + lifecycle contract       | [pause-system.md](../systems/pause-system.md)                              | Tables, state machine, `**v_pause_full`** / step events — **section 10** indexes this screen’s lib map |


## Rendering and hooks

`usePauseSessionScreen` runs **hooks in a stable order**; `PauseSessionScreen.tsx` is presentation-only. at the top (Holzen, subscription, shell, mount log, coalesced view-model, then large local `useState` blocks, then handler hooks, then derived memo/objects). There is **no** early return that skips hooks after a subset has run — same **Rules of Hooks** discipline as Home. Full-screen route: see `[App.tsx](../../src/App.tsx)` / route table (no bottom nav on `/pause`).

## User-visible modes (high level)

1. **Gate** — `PauseSessionGate`: profile not ready, instance fetch in flight, fetch failure, or “no shell message” vs waiting for hydration (see [`gate-flags.ts`](../../src/features/pause/application/use-cases/session/gate-flags.ts) via `public`).
2. **Depth picker** — user has a coalesced reflection message but `ritualEntry === 'picker'` (`PauseSessionDepthPickerStack`; gate flag in `gate-flags.ts`).
3. **Brief ritual** — four macro steps (`BriefPauseStep`); body in `PauseSessionBriefRitualBody`.
4. **Deep ritual** — full `PauseStep` rail; body in `PauseSessionDeepRitualBody` (Feel, Breathe, Reflect, Frame, second Breathe, Choose bridge, Decide).
5. **Done** — `phase === 'done'`; `PauseDone` with impact data after successful outcome path (see [pause-system §7.5](../systems/pause-system.md)).

## Navigation out

[`usePauseSessionExitNavigation`](../../src/features/pause/presentation/session/use-pause-session-exit-navigation.ts) (`public-hooks`) provides close/return handlers consumed by the gate and scaffold. Pending pause offers use [`usePauseSessionPendingPauseOfferNavigation`](../../src/features/pause/presentation/session/use-pause-session-pending-pause-offer-navigation.ts) for adopt/resync flows.

## Analytics

Do **not** add new PostHog events here without updating `[docs/ops/event-taxonomy.md](../ops/event-taxonomy.md)`. Brief vs deep **ratios** for product metrics stay **SQL-first** on `**v_pause_full`** / `**pause_step_events**` per [pause-system](../systems/pause-system.md) — avoid duplicating that in client-only events unless product explicitly asks.

## Best practices for edits

- Keep **pure** branch logic in `features/pause/application/use-cases/` with **Vitest** co-located; screens stay presentation-only.
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