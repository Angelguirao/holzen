# Route Gating (Pending Enhancements)

## Enhancement 2: UX clarity for strict gating vs perceived latency

### Current problem
The correctness invariant is: do not render protected content until auth is resolved (`loading` is false and we know whether the user is authenticated).

When auth takes time (network, session restore), the app can feel "stuck" or "broken" if the UI does not explicitly explain that it is waiting for auth.

### Implications if we leave it as-is
- Users may interpret expected gating delays as failures.
- Support/diagnostics get noisier because "blank screen" is ambiguous (loading vs bug vs logged-out redirect).
- Even if correctness is preserved, perceived reliability can drop.

### Proposed improvement
Keep the safety rule (never show protected content early), but make the UX explicit by:
- ensuring protected routes show a consistent skeleton/loading/placeholder state while `AuthProvider.loading` is true
- adding clear copy/logging for "waiting for session" vs "not authorized"

### Related code pointers
- Route guards: `src/App.tsx` (`ProtectedRoute` / `PublicOnlyRoute`)
- Auth state source: `src/hooks/use-auth.tsx` (`loading` lifecycle)

### Acceptance criteria / how to verify
1. There is no flash of protected content before auth settles (safety invariant remains).
2. During `loading`, the UI consistently shows an explicit "auth is loading / session restoring" state (no ambiguous blank screens).
3. Logged-out users are clearly routed away (or shown "not authorized") with no redirect loops.

