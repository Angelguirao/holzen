# Notifications feature module

**Product truth:** [docs/systems/notifications-delivery.md](../../../docs/systems/notifications-delivery.md)  
**Architecture:** [holzen-application-architecture.md](../../../docs/fundamentals/holzen-application-architecture.md) §7.1 (`notifications` context)

Multi-channel delivery: **in-app inbox** (`notifications` table), **web push** (`register-push`, service worker), **email** (edge + `profiles.email_notifications`). Producers today are mostly **pause** (DB triggers) and **market** (`check-volatility`); this context owns **client read models**, **channel prefs UI** (via settings), and the **header bell**.

## Layout

| Layer | Role |
|-------|------|
| `domain/` | Inbox row types, `DeliveryChannel` |
| `application/` | Channel constants; future `notifyUser` use cases |
| `ports/` | `NotificationDeliveryGateway` (server orchestration target) |
| `infrastructure/queries/` | Inbox + push subscription TanStack modules |
| `presentation/` | `NotificationBell`, `usePushNotifications` |

## Shell

| File | Mounted from |
|------|----------------|
| `presentation/NotificationBell.tsx` | `AppLayout` via `@/features/notifications/public-hooks` |

Settings notifications panel uses `usePushNotifications` from `public-hooks`. **User** context still owns `profiles` row updates (`email_notifications`, quiet hours).

## Cross-context imports

- **pause** — `NotificationNavigateState` for deep links (import `@/features/pause/public` in presentation only).
- **user** — profile toggles stay in `features/user`; do not move `useProfile` email/quiet-hour mutations here without a port.
