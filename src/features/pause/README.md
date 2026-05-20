# Pause feature module

**Product truth:** [docs/systems/pause-system.md](../../../docs/systems/pause-system.md)  
**Client target (canonical interior):** [docs/systems/pause-client-architecture.md](../../../docs/systems/pause-client-architecture.md) §3  
**Repo map / waves:** [frontend-module-layout.md](../../../docs/fundamentals/frontend-module-layout.md) §10–11

Companions, reflect, and breathing live **inside** this feature — not a separate `features/companion/`.

## Folder map (target)

```text
features/pause/
  domain/                         # rules + vocabulary (no React, no Supabase)
  application/use-cases/
    trigger/ session/
    ritual/
      feel/ breathe/ reflect/ frame/ decide/ done/
    archive/                      # Pauses + Echoes reads (not user collections — legacy)
  ports/                          # PauseRepository, ReflectGenerator, …
  infrastructure/                 # supabase, edge, queries/
  presentation/                   # React conductors only — ritual JSX in src/screens/pause/
  public.ts | public-queries.ts | public-rpc.ts | public-hooks.ts
```

**Transitional paths (move incrementally):** reflect use cases (generation, step log, favorite toggle, metadata log, persist-error helpers) are under `application/use-cases/ritual/reflect/`. Companion use cases still at `application/use-cases/companion/` → target `ritual/frame/` (leaves under `ritual/frame/` include `estimate-read-time`, `url`, `signal-source-trusted`, `format-companion-history-relative-day`, `generation-taxonomy`, `related-biases`, `recency-hints`, `section-visibility`, `breathing-ui-complete`, `companion-ui-completion-types`, `zoom-out-payload`, `log-pause-companion`, `companion-data-from-artifacts`, `log-companion-feedback-vote`, `intervention-idempotency-telemetry`, `next-expanded-with-lazy-fetch`, `companion-intervention-telemetry`, `orchestrate-invoke-error`, `artifact-cache-parse`, `apply-companion-orchestrate-retry-reset`, `companion-generation-telemetry`, `full-view-page-helpers`, `persist-ui-step-completion`, `companion-slot-ui-state`). User **collections** code is in `src/legacy/archive-collections/` (not shipped MVP).

**Brief vs deep:** one bounded context. Depth is `RitualDepth` on the instance / persisted session — not separate feature folders.

## Tests

Unit tests sit **next to** the module under `domain/`, `application/use-cases/`, and `presentation/` (hooks). `/pause` route-only chrome: `src/screens/pause/lib/`. Flows: `src/test/integration/flows/`.

## Imports

Other features and screens use `@/features/pause/public` (and `public-queries` / `public-rpc` / `public-hooks`). Do not import deep paths from `application/use-cases/` outside this feature.
