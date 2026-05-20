# User feature module

**Client target:** [docs/systems/user-client-architecture.md](../../../docs/systems/user-client-architecture.md)

Profile, signals, quiet windows, settings-backed preferences.



**Notifications** (inbox bell, web push hooks) live in [`features/notifications/`](../notifications/README.md).



Import profile hooks via `@/features/user/public-hooks`. Email and quiet-hour toggles stay here (`useProfile`).

