# User feature module

Profile, signals, quiet windows, settings-backed preferences.

| Import from | Contents |
|-------------|----------|
| `@/features/user/public` | Domain types and pure helpers (no React) |
| `@/features/user/public-queries` | Profile / hold-goal TanStack modules |
| `@/features/user/public-hooks` | `useProfile`, `usePushNotifications`, `useHoldGoalProfile` |

## Presentation (shell-mounted)

| File | Mounted from |
|------|----------------|
| `presentation/NotificationBell.tsx` | `AppLayout` header |
