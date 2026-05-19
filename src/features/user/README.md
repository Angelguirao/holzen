# User feature module

Profile, signals, quiet windows, settings-backed preferences. Migrate from `src/hooks/use-profile.ts` and settings-related `src/lib/`.

**Notifications** (inbox bell, web push hooks) live in [`features/notifications/`](../notifications/README.md).

Import profile hooks via `@/features/user/public-hooks`. Email and quiet-hour toggles stay here (`useProfile`).
