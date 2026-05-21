# Pause feature module

**Product truth:** [docs/systems/pause-system.md](../../../docs/systems/pause-system.md)  
**Client target (canonical interior):** [docs/systems/pause-client-architecture.md](../../../docs/systems/pause-client-architecture.md) §3  
**Repo map / waves:** [frontend-module-layout.md](../../../docs/fundamentals/frontend-module-layout.md) §10–11

Companions, reflect, and breathing live **inside** this feature — not a separate `features/companion/`.

## Folder map (target)

```text
features/pause/
  domain/                         # rules + vocabulary (no React, no Supabase); e.g. companion/related-biases
  application/use-cases/
    trigger/ session/
    ritual/
      feel/ breathe/ reflect/ frame/ decide/ done/
    archive/                      # Pauses + Echoes reads (not user collections — legacy)
  ports/                          # PauseRepository, ReflectGenerator, ReflectionStepLogStorage, …
  infrastructure/                 # supabase, edge, queries/
  presentation/                   # React conductors only — ritual JSX in src/screens/pause/
    reflect/                      # holzen-reflect, post-it note/tags, reflect/decide conductor
    companion/                    # frame slots, orchestrate, fullview, section, related biases
    session/                      # scaffold payloads, ritual body prop types
  public.ts | public-navigation.ts | public-trigger.ts | public-home.ts | public-scheduling.ts | public-session.ts | public-queries.ts | public-rpc.ts | public-hooks.ts | public-ritual-frame.ts (+ brief/reflect/breathe/done barrels)
```

**Transitional paths (May 2026):** reflect use cases under `application/use-cases/ritual/reflect/` (backlog #1 done); frame / companion orchestration under `application/use-cases/ritual/frame/` (backlog #2 done). **`public-rpc`** exports wired port adapters (`supabasePauseRepository`, `supabaseCompanionOrchestrator`, `supabaseReflectGenerator`, …). PWA install analytics: `logPwaInstallAnalyticsEvent` on `public-queries` via `pwa-install-analytics-query` (May 2026). Admin `logDevModeSetting` lives on `public-queries` via `dev-mode-admin-query` (May 2026). `logPauseCompanion` use case is wired in presentation/infrastructure only (no `public-rpc` facade). Companion slot orchestrate + intervention bootstrap: `use-companion-slot-run-orchestrate` / `use-companion-intervention-fetch` (+ retry/UI state) → `ritual/frame/*` + `supabaseCompanionOrchestrator` (off `public-rpc`, May 2026). Orchestrate session load: `use-companion-orchestrate-session` → `loadCompanionOrchestrateSession` + `loadMoodHistoryForOrchestrate` (off `public-rpc` / `public-queries`, May 2026). **`public-ports.ts` removed** (May 2026). Companion feedback vote **read** uses `companion-feedback-vote-query` → `runFetchCompanionFeedbackVote` + `supabasePauseAnalyticsRepository`; **write**: `use-companion-feedback-vote` → `runLogCompanionFeedbackVote` + `supabasePauseAnalyticsRepository` (off `public-rpc`, May 2026). Fullview open telemetry: `use-fullview-telemetry` → `runLogCompanionFullviewOpened` + `supabasePauseAnalyticsRepository` (off `public-rpc`, May 2026). Fullview page + inline section helpers: `use-companion-fullview-page` / `use-companion-section` → `ritual/frame/full-view-page-helpers` + `section-visibility` (off `public-rpc`, May 2026). Reflect/session/companion/home/archive **presentation hooks** bind RPC through `presentation/**/**-io.ts` modules (default adapters from `public-rpc` only inside those files — May 2026). Examples: `pause-reflect-*-io.ts`, `pause-session-breath-io.ts`, `pause-session-pending-offer-io.ts`, `pause-ritual-done-io.ts`, `pause-home-io.ts`, `pause-home-bulk-hold-io.ts`, `pause-archive-io.ts`, `pause-companion-orchestration-io.ts`. **`public.ts`** is cross-context slim; screens use `public-hooks` / `public-queries` / `public-rpc`. Remaining Phase A: `public-ritual-frame` barrel peel and any stray mutations still bypassing `PauseRepository`. User **collections** → `src/legacy/archive-collections/`.

**Brief vs deep:** one bounded context. Depth is `RitualDepth` on the instance / persisted session — not separate feature folders.

## Tests

Unit tests sit **next to** the module under `domain/`, `application/use-cases/`, and `presentation/` (hooks). `/pause` route-only scaffold chrome registry: `src/screens/pause/components/pause-scaffold-chrome-registry.tsx`. Flows: `src/test/integration/flows/`.

## Imports

Other features and screens use `@/features/pause/public` (and `public-queries` / `public-rpc` / `public-hooks`). Do not import deep paths from `application/use-cases/` outside this feature.
