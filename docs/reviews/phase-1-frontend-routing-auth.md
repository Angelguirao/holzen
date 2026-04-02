# Phase 1: Frontend routing & authentication review

Reviewed starting points:

- `src/App.tsx` (routing + `ProtectedRoute` / `PublicOnlyRoute`)
- `src/hooks/use-auth.tsx` (`AuthProvider` + referral recording)
- `src/integrations/supabase/client.ts` (Supabase browser client wrapper)
- `src/main.tsx` (boot sequence + boot-crash screen)

## Findings (highest priority first)

1. **Potential unhandled rejection / noisy failure path in referral recording**
   - In `src/hooks/use-auth.tsx`, the `SIGNED_IN` handler calls `supabase.functions.invoke('record-referral', ...)` without awaiting or attaching a `.catch(...)`.
   - If the function invocation rejects (network/server/auth error), it can surface as an unhandled promise rejection (or at minimum be silent depending on browser/console behavior).

2. **Referral code is removed from localStorage before the invoke result**
   - Still in `use-auth.tsx`, `localStorage.removeItem('holzen_ref')` happens immediately when `holzen_ref` exists.
   - If the invoke fails, the referral code is lost and won’t be retried on subsequent auth state changes.

## Recommended fixes

In `src/hooks/use-auth.tsx`, make the referral call fire-and-forget safely:

- Keep `holzen_ref` until the invoke succeeds.
- Ensure errors are handled and logged (`.catch(...)`).

Applied in this branch: `src/hooks/use-auth.tsx` now retains `holzen_ref` until `record-referral` resolves, and logs failures in a `.catch(...)` handler.

## What I’m reviewing next (Phase 2)

After we address auth/referral robustness, I’ll trace one end-to-end flow:

- `/pause` -> `PauseSession` -> `use-holzen` -> reflection insert -> `use-companion-data` -> `companion-orchestrate`

Then we’ll review the related edge function(s) and the SQL tables they write.

