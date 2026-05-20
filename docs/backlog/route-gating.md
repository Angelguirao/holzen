# Route Gating (Shipped 2026-04)

## What shipped

While `AuthProvider.loading` is true, **`ProtectedRoute`** / **`PublicOnlyRoute`** still render **`AuthLoading`** only (no protected content flash).

**UX / a11y:** `src/components/AuthLoading.tsx` now shows translated copy **`auth.restoringSession`** (“Restoring your session…”) above the skeleton, with **`role="status"`**, **`aria-live="polite"`**, and **`aria-busy="true"`**, plus a screen-reader-only duplicate for clarity.

**Diagnostics:** `RouterLocationLog` in `src/App.tsx` already logs **`authLoading`** with pathname changes under `[holzen:router]`.

## Original goals (reference)

- Keep the safety rule: never show protected content until auth is resolved.
- Avoid ambiguous blank screens during session restore.

### Related code pointers

- Route guards: `src/App.tsx` (`ProtectedRoute` / `PublicOnlyRoute`)
- Auth state source: `@/features/auth/public` (`AuthProvider` / `useAuth`; `loading` lifecycle)
- Loading UI: `src/components/AuthLoading.tsx`

### Acceptance criteria (met)

1. No flash of protected content before auth settles.
2. During `loading`, the UI shows an explicit “restoring session” state (copy + skeleton + live region).
3. Logged-out users redirect to `/welcome` (protected) or `/` (public-only) without loops.
