# Cache helpers: async error handling

**Status:** done (2026-04).

## What shipped

- **`supabase/functions/_shared/cache.ts`:** `updateServeStats` and `recordUserServe` fire-and-forget promises now use **`.catch`** and emit a single JSON line per failure (`fn: "cache"`, `op`, `level`, `msg`) so transient Supabase errors do not become unhandled rejections.

## Related code

- `supabase/functions/_shared/cache.ts`
