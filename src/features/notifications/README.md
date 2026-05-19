# Notifications feature module

**Product truth:** [docs/systems/notifications-delivery.md](../../../docs/systems/notifications-delivery.md)  
**Architecture:** [holzen-application-architecture.md](../../../docs/fundamentals/holzen-application-architecture.md) §7.1

Multi-channel delivery: in-app inbox, web push, email (server paths in `supabase/functions/_shared/notifications-deliver-pause-offer.ts`).

## Folder map

```text
features/notifications/
  domain/           # DeliveryChannel, inbox row types
  application/
    use-cases/
      delivery/     # pause-offer-policy, delivery-channels
  ports/            # NotificationDeliveryGateway (server orchestration target)
  infrastructure/queries/
  presentation/     # NotificationBell, usePushNotifications
  public.ts | public-queries.ts | public-hooks.ts
```

**User** context still owns `profiles.email_notifications` and quiet hours; settings toggles call `useProfile` there.

## Shell

`NotificationBell` — `AppLayout` via `@/features/notifications/public-hooks`.
