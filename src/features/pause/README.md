# Pause feature module

**Product truth:** [docs/systems/pause-system.md](../../../docs/systems/pause-system.md)  
**Target use-case layout:** [frontend-module-layout.md](../../../docs/fundamentals/frontend-module-layout.md) §3

Companions, reflect, and breathing are **inside this feature** (`application/companion/`, `application/reflect/`, `application/breathing/`), not a sibling `features/companion/`.

## Layout

```text
features/pause/
  domain/              # pure types + rules
  application/         # session, brief-ritual, breathing, reflect, use-cases
  infrastructure/      # Supabase, invokeEdge, queries
  presentation/        # thin hooks re-exported via public-hooks.ts
  public.ts            # cross-feature API (no eager Supabase)
  public-queries.ts    # TanStack query modules
  public-rpc.ts        # pause_log_step and RPC clients
```

Ritual UI stays in [`src/screens/pause/`](../../screens/pause/README.md) (hooks + components).

## Tests

Unit tests live **next to** `domain/` and `application/` modules (e.g. `application/session/gate-flags.test.ts`). Hook tests live under `screens/pause/hooks/`. Shipped journeys: `src/test/integration/flows/`.

## `public.ts`

Export only what other features (e.g. home screen) need — instance ids, trigger helpers, not internal step hooks.
