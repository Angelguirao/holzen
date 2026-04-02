# Cache helpers: async error handling (Pending)

## Context (from Phase 5)

`supabase/functions/_shared/cache.ts` includes fire-and-forget async work (e.g. `recordUserServe`, `updateServeStats`) that may use `.then(...)` without a `.catch(...)`. Rejected Supabase calls can surface as **unhandled promise rejections** in noisy logs.

## Current problem

Transient DB/network errors from non-critical side effects still deserve **logged** failures without crashing the request path.

## Implications if we leave it as-is

- Console noise in edge logs; harder to spot real failures.
- Optional: some runtimes treat unhandled rejections more strictly.

## Proposed improvement

- Attach `.catch((err) => console.error(...))` (or structured logging) to fire-and-forget promises in `cache.ts` (and audit similar patterns in other `_shared` helpers).

## Related code pointers

- `supabase/functions/_shared/cache.ts`

## Acceptance criteria / how to verify

1. No unhandled rejection from `recordUserServe` / `updateServeStats` under forced Supabase failure in tests or manual invoke.
2. Errors are visible in logs with enough context to debug.
