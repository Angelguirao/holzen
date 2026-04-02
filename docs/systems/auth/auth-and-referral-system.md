# Auth system (Supabase) + referral side-effect

This system doc explains how authentication works end-to-end in Holzen:

- client-side Supabase session setup
- `AuthProvider` lifecycle (`onAuthStateChange` + initial `getSession`)
- how protected vs public routes are decided
- where the referral recording side-effect runs (optional, runs only on first `SIGNED_IN`)

## Diagram — full runtime auth flow

```mermaid
flowchart TD
  U[User signs in] --> A[Supabase Auth]
  A --> P[AuthProvider:onAuthStateChange]

  P --> S[Set `user` + `loading=false`]

  S --> G{Route needs auth?}
  G -- no --> R1[Render public route]
  G -- yes --> UDR{`ProtectedRoute` checks `user`}
  UDR -- loading --> L1[Show `AuthLoading`]
  UDR -- no user --> W[Redirect to `/welcome`]
  UDR -- user --> OK[Render protected UI]

  P --> REF{`holzen_ref` exists?}
  REF -- no --> X[Done]
  REF -- yes --> I[invoke edge function<br/>`record-referral`]
  I -->|success| R[remove `holzen_ref` from localStorage]
  I -->|failure| C[log error; keep `holzen_ref` for retry]
```

## Step-by-step runtime behavior

### 1) Session setup (Supabase browser client)

Holzen creates the browser Supabase client in `src/integrations/supabase/client.ts` with:

- `auth.storage = localStorage`
- `persistSession = true`
- `autoRefreshToken = true`

That means the app can keep `session` across reloads and refresh tokens automatically.

### 2) AuthProvider lifecycle

`src/hooks/use-auth.tsx`’s `AuthProvider` is the source of truth for `useAuth()`:

1. On mount, it subscribes to Supabase auth events via `supabase.auth.onAuthStateChange(...)`.
2. For every auth change it updates:
   - `user` from `session?.user ?? null`
   - `loading` to `false`
3. Separately, it also calls `supabase.auth.getSession()` once to populate initial state on page load.

### 3) Route gating (ProtectedRoute / PublicOnlyRoute)

In `src/App.tsx`:

- `ProtectedRoute`:
  - shows `AuthLoading` while `loading` is true
  - redirects unauthenticated users to `/welcome`
  - renders children only when `user` is present
- `PublicOnlyRoute`:
  - shows `AuthLoading` while `loading` is true
  - redirects authenticated users to `/`
  - renders children only when `user` is absent

### 4) Referral recording side-effect (optional)

1. User signs in via Supabase auth.
2. `AuthProvider` receives the `SIGNED_IN` event.
3. If `localStorage.getItem('holzen_ref')` is present, the app calls:
   - `supabase.functions.invoke('record-referral', { body: { referral_code } })`
4. After success, it removes `holzen_ref` from `localStorage`.
5. If it fails, it logs the error and keeps `holzen_ref` for a later retry.

## “Fire-and-forget” (what it means here)

In this codebase:

- “Fire-and-forget” means **we do not `await`** the referral invocation in the auth-state callback.
- We still treat it as a real side effect:
  - we attach a `.catch(...)`,
  - and we only mutate local state (`removeItem('holzen_ref')`) after success.

## Server-side handler (what the edge function does)

Edge function: `supabase/functions/record-referral/index.ts`

High-level behavior:
- validates the request token (`Authorization` header),
- finds the referrer profile from `referral_code`,
- records the referral row,
- updates the referred user’s profile,
- and then applies milestone rewards (Stripe + email) if configured.

## Best practices / pitfalls to watch

- **Never delete retry-critical local state before the server call succeeds**.
- Keep “fire-and-forget” safe:
  - attach error handling,
  - decide whether retry is possible on failure.
- Confirm that `record-referral` remains compatible with the body shape `{ referral_code }`.

## See also

- `docs/systems/routing/route-gating-system.md` - how `ProtectedRoute` / `PublicOnlyRoute` apply `user` + `loading` to the route table.

