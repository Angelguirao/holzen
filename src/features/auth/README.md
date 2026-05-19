# Auth feature module

Session and identity projection.

| Layer | Path |
|-------|------|
| Application | `application/auth-funnel-events.ts`, `application/auth-observability.ts` |
| Infrastructure | `infrastructure/auth-signed-in-side-effects.ts` (welcome email, referral queue) |
| Presentation | `presentation/AuthProvider.tsx` — `AuthProvider`, `useAuth` |
| Ports | `ports/session.ts` — scaffold for future adapter split |
| Public API | `public.ts` — `AuthSessionState` only (no React) |

**App wiring:** `src/App.tsx` imports `AuthProvider` from `@/hooks/use-auth` (thin re-export). Cross-feature code should import types from `@/features/auth/public` only.

See [docs/systems/auth/auth-and-referral-system.md](../../docs/systems/auth/auth-and-referral-system.md).
