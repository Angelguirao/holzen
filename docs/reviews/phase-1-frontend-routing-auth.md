# Phase 1: Frontend routing & authentication review

This phase is the first “mental model pass” for the codebase because authentication and routing determine:

1. Which code paths run for a given user (or when the user is still loading).
2. Whether unauthenticated/deep-linked users land in the correct UI state.
3. Where the “source of truth” for user state lives.

If we get auth/routing wrong, everything downstream (pause UI, journaling, admin surfaces, edge-function calls) becomes hard to reason about or debug.

## What to understand first (priority)

1. **Boot + provider wiring**: does `AuthProvider` wrap `Routes` so `useAuth()` is always available?
2. **Route guards**: do `ProtectedRoute` / `PublicOnlyRoute` correctly handle `loading` vs “no user”?
3. **Session persistence**: does the Supabase client persist sessions the way the app assumes?
4. **Side effects safety**: if auth triggers a side-effect (referral), is it error-safe and doesn’t corrupt local state?

## Reviewed starting points (file-by-file)

### `src/main.tsx` — boot + crash visibility

- Responsible for the app entrypoint: it loads `App.tsx`, loads i18n, and mounts React.
- Has a global crash screen so “auth never loads” failures don’t become silent.

### `src/App.tsx` — routing + route guard contracts

- Defines `ProtectedRoute` and `PublicOnlyRoute`.
- Controls the redirect behavior for:
  - protected pages (e.g. `/pause`, `/admin`): redirect to `/welcome` if unauthenticated
  - public-only pages (e.g. `/welcome`, `/auth`): redirect to `/` if authenticated

### `src/components/AppLayout.tsx` — the protected shell

- Renders the “app shell” that sits under protected routes.
- Hosts shared UI elements like the notification bell and pause auto-trigger banner.
- Important because it receives `Outlet` context from the route layer.

### `src/integrations/supabase/client.ts` — session persistence assumptions

- Creates the browser Supabase client.
- Defines how auth state is stored (localStorage) and refreshed (auto token refresh).
- This determines whether the app can assume “user survives reload” behavior.

### `src/hooks/use-auth.tsx` — source of truth for `useAuth()`

- `AuthProvider` is the single shared authority for:
  - `user`
  - `loading`
- It initializes state via `supabase.auth.getSession()` and keeps it updated via `supabase.auth.onAuthStateChange(...)`.
- Also triggers the referral recording side-effect when a user signs in.

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

## Systems that emerge from this review

1. **Auth system**: `docs/systems/auth/auth-and-referral-system.md`
   - Step-by-step runtime path for boot → auth state → route gating → optional referral side-effect.

2. **Route gating system** (emerges conceptually; may be documented next)
   - Contract for `loading` handling and redirects in `ProtectedRoute` / `PublicOnlyRoute`.

## What I’m reviewing next (Phase 2)

After we address auth/referral robustness, I’ll trace one end-to-end flow:

- `/pause` -> `PauseSession` -> `use-holzen` -> reflection insert -> `use-companion-data` -> `companion-orchestrate`

Then we’ll review the related edge function(s) and the SQL tables they write.

