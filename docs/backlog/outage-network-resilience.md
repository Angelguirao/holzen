# Outage & network resilience (UX)

**Status:** in progress — ship in small slices.

## Progress (slices shipped)

| When | Slice |
|------|--------|
| 2026-04 | **Query client defaults** (`src/lib/query-client.ts`): `networkMode: 'online'`, smart **query** retries for transient failures (fewer blind retries on 4xx / PostgREST business errors), **mutations** stay at `retry: 0`. Wired from `App.tsx`. |
| 2026-04 | **Reachability banner**: `pingSupabaseReachability()` (`src/lib/supabase-reachability.ts`) + `OfflineBanner` shows a second state when the browser is **online** but **two consecutive** health checks to `/auth/v1/health` fail (debounced startup + interval). Copy in `common.*` i18n. |

## Goal

Improve real-world UX when **Supabase or the network is flaky** (distinct from Vite HMR reconnect noise in dev). Complement existing **`ErrorBoundary`**, **`OfflineBanner`** (`navigator.onLine`), per-feature error + retry (e.g. companions), and **`offline-queue`** for feedback.

## Not in scope (unless we revisit)

- Toasting every `functions.invoke` failure globally (noisy; prefer critical paths + inline UI).
- Replacing inline companion / reflection error states.
- Heavy “reachability” probes on every tab (current design: staggered checks, two failures before banner).

## Related

- [`OfflineBanner`](../../src/components/OfflineBanner.tsx), [`offline-queue`](../../src/lib/offline-queue.ts), [`ErrorBoundary`](../../src/components/ErrorBoundary.tsx).
- [Refactoring strategy](../fundamentals/refactoring-strategy.md) — keep slices small.
