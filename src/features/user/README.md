# User feature module

Profile, signals, quiet windows, settings-backed preferences. Migrate from `src/hooks/use-profile.ts` and settings-related `src/lib/`.

## Presentation (shell-mounted)

| File | Mounted from |
|------|----------------|
| `presentation/NotificationBell.tsx` | `AppLayout` header |

Import via `@/features/user/public`.
