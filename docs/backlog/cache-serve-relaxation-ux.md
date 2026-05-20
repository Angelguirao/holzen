# Cache serve: relaxation transparency — **shipped (2026-04)**

## What shipped

- **`serveFromCache`** (`supabase/functions/_shared/cache.ts`) returns `relaxation`: `none` | `market` | `repeat_or_lower_quality`, and emits structured Edge logs `holzen_event: "cache_serve"` with `cache_relaxation`.
- Generators and **`CompanionResult`** propagate **`cacheRelaxation`**; **`companion_serves.cache_relaxation`** stores it (migration **`20260404120000_companion_serves_cache_relaxation.sql`**).
- **Client**: `companion-orchestrate` slot payloads include `cacheRelaxation`; **`useCompanionData`** / **`CompanionSection`** show subtle copy when the tier is `market` or `repeat_or_lower_quality` (not for strict `none`).
- i18n: **`companions.cacheRelaxation.*`** in **`src/locales/en.json`**.

## Related code

- `supabase/functions/_shared/cache.ts` — `serveFromCache`
- `src/features/pause/application/use-cases/companion/orchestrate-slot-apply.ts` — slot state + `EMPTY_COMPANION_SLOT_RELAXATIONS`
- `features/pause/presentation/use-companion-data.ts` — wires hydration + lazy fetch + regenerate

## Optional follow-ups

- Stricter user setting (“fewer repeats, allow empty”) — product validation first.
- Localize **`cacheRelaxation`** strings beyond English.
