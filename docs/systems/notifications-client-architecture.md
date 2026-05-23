# Notifications client architecture (target)

**Status:** scaffold (May 2026) — expand during Phase B slices  
**Audience:** engineers touching inbox, push, or delivery vocabulary  
**Server authority:** [notifications-delivery.md](notifications-delivery.md)  
**Template:** [pause-client-architecture.md](pause-client-architecture.md) §9  
**Principles:** [holzen-application-architecture.md](../fundamentals/holzen-application-architecture.md)

---

## 1. Thesis

**Notifications is one bounded context** for in-app inbox, web push registration, and delivery **vocabulary**. Producers (pause, market cron) write server-side; this context owns **read models and bell UI**.

---

## 2. Client rings

| Ring | Owns |
|------|------|
| **Feature** | Inbox queries, `NotificationBell`, `usePushNotifications`, delivery use cases |
| **App shell** | Mounts bell in `AppLayout` |
| **User (peer)** | `profiles.email_notifications`, quiet hours — settings toggles via `useProfile` |

---

## 3. Target interior (`src/features/notifications/`)

```text
features/notifications/
  domain/                 # DeliveryChannel, inbox row types
  application/use-cases/
    delivery/             # pause-offer-policy, channel selection
    push/                 # subscribe / unsubscribe orchestration
    inbox/                # read, dismiss, mark read
  ports/
    notification-delivery-gateway.ts
  infrastructure/queries/
  presentation/
    NotificationBell.tsx
    use-push-notifications.ts
  public.ts | public-queries.ts | public-hooks.ts
```

---

## 4. Public API

| Barrel | Purpose |
|--------|---------|
| `public.ts` | Types, pure delivery helpers |
| `public-queries.ts` | Inbox query options |
| `public-hooks.ts` | Bell, push hooks — **app shell import surface** |

---

## 5. Non-negotiables

1. **User prefs** — email/quiet hours on **user** context; notifications consumes, does not own profile columns.
2. **Pause deep links** — navigate state types may live in pause domain; bell routes using them imports pause `public` types only.
3. **Single delivery intent (north star)** — edge producers should converge on `NotificationDeliveryGateway`; client documents channel UX only.

---

## 6. Transitional state

See [src/features/notifications/README.md](../../src/features/notifications/README.md) and server doc § Client boundaries.

---

## 7. Related

- [user-client-architecture.md](user-client-architecture.md) — prefs vs delivery
