# Pause feature module

**Product truth:** [docs/systems/pause-system.md](../../../docs/systems/pause-system.md)  
**Layout:** [frontend-module-layout.md](../../../docs/fundamentals/frontend-module-layout.md) §3

Companions, reflect, and breathing live **inside** this feature — not a separate `features/companion/`.

## Folder map

```text
features/pause/
  domain/                         # rules + vocabulary (no React, no Supabase)
    ritual-types.ts               # RitualDepth ('brief' | 'deep'), BriefPauseStep
    pause-ritual-steps.ts         # deep macro steps (feel → decide)
    brief-ritual-steps.ts         # brief macro order
    pause-state.ts                # engaged / complete gates
    …
  application/
    use-cases/                    # named intentions (orchestration)
      session/                    # hydrate, persist, shell VM, navigation
      ritual/
        brief/                    # brief-only navigation helpers
        deep/                     # deep go-back, brief→deep upgrade
      breathing/
      reflect/
      companion/
      feedback/                   # toasts (thin; may move to presentation later)
      archive/
      bulk-hold/
      library/
      …                           # flat use-case files at use-cases/*.ts
    queries/                      # query keys + invalidation (no Supabase in application)
  infrastructure/                 # Supabase, invokeEdge, TanStack query modules
    pause-rpc-client.ts           # RPC implementations + analytics side effects
    supabase-pause-repository.ts  # default PauseRepository adapter
  ports/
    pause-repository.ts           # mutation port (create, logStep, logCompanion, …)
  presentation/                   # thin hooks; ritual UI in src/screens/pause/
  public.ts | public-queries.ts | public-rpc.ts | public-hooks.ts
```

**Brief vs deep:** one bounded context. Depth is `RitualDepth` on the instance / persisted session — not separate feature folders.

## Tests

Unit tests sit **next to** the module under `domain/` and `application/use-cases/`. Screen hook tests: `src/screens/pause/hooks/`. Flows: `src/test/integration/flows/`.

## Imports

Other features and screens use `@/features/pause/public` (and `public-queries` / `public-rpc` / `public-hooks`). Do not import deep paths from `application/use-cases/` outside this feature.
