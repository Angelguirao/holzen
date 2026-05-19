# Auth feature module

Session and identity projection.

| Layer | Path |
|-------|------|
| Application | `application/auth-funnel-events.ts`, `application/auth-observability.ts` |
| Infrastructure | `infrastructure/auth-signed-in-side-effects.ts` (welcome email, referral queue) |
| Presentation | `presentation/AuthProvider.tsx` — `AuthProvider`, `useAuth` |
| Ports | `ports/session.ts` — scaffold for future adapter split |
| Public API | `public.ts` — `AuthProvider`, `useAuth`, `AuthSessionState` |

**App wiring:** `src/App.tsx` and screens import `AuthProvider` / `useAuth` from `@/features/auth/public`. `src/hooks/use-auth.tsx` remains a deprecated re-export for legacy paths only.

See [docs/systems/auth/auth-and-referral-system.md](../../docs/systems/auth/auth-and-referral-system.md).
