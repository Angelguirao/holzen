# Pause feature module

**Product truth:** [docs/systems/pause-system.md](../../../docs/systems/pause-system.md)  
**Target use-case layout:** [frontend-module-layout.md](../../../docs/fundamentals/frontend-module-layout.md) §3

Companions, reflect, and breathing are **inside this feature** (`application/companion/`, `application/reflect/`, `application/breathing/`), not a sibling `features/companion/`.

## Migration status

Skeleton only — implementation still lives in `src/lib/pause-*`, `src/hooks/use-pause-*`, `src/components/pause/`. Move files here in small PRs; re-export from old paths temporarily if needed.

## `public.ts`

Export only what other features (e.g. home screen) need — instance ids, trigger helpers, not internal step hooks.
