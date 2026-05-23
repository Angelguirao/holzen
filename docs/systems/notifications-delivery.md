# Notifications delivery (inbox, push, email)

**Status:** shipped (pause-first)  
**Client context:** `src/features/notifications/`  
**Related:** [pause-system.md](pause-system.md), [active-surface.md](../ops/active-surface.md)

Holzen reaches users through three channels on the active surface. This document is the **canonical** map for producers, prefs, and client modules — not a duplicate of pause ritual rules.

## Channels

| Channel | Shipped | User prefs | Client module | Server / edge |
|---------|---------|------------|---------------|---------------|
| **In-app inbox** | Yes | Dismiss/read in bell (local + row `dismissed_at`) | `NotificationBell`, `notifications-inbox-query` | `notifications` table; rows from pause triggers (`notifications_from_pause_instances`) |
| **Web push** | Yes | Settings → push toggle; browser permission | `usePushNotifications`, `register-push` | `check-volatility` sends after claim; `push_subscriptions` |
| **Email** | Yes (pause/volatility) | `profiles.email_notifications` | Settings panel (via `useProfile` in **user**) | `check-volatility` → Lovable mail; `process-email-queue` cron |

**Not scheduled post-cutover:** digest, letters, badge, night-reflection notification types (rows/types removed or cron off — see [active-surface.md](../ops/active-surface.md)).

## Producers (who creates an event)

| Producer | What it does today | Target inbox type |
|----------|-------------------|-------------------|
| **Pause instance lifecycle** | DB trigger → `notifications_upsert` | `pause` |
| **check-volatility** | Creates/reuses pause, updates profile; calls `_shared/notifications-deliver-pause-offer.ts` for email + push | `pause` (inbox via trigger after instance write) |
| **Transactional email queue** | Templates for product email | Not always mirrored to inbox |

**Future:** producers (pause, market, subscription) should call a single **delivery intent** (see `NotificationDeliveryGateway` in `features/notifications/ports/`) instead of scattering channel logic in edge workers.

## Client boundaries

| Context | Owns |
|---------|------|
| **notifications** | Inbox read model, bell UI, push subscribe/unsubscribe, delivery vocabulary |
| **user** | `profiles.email_notifications`, quiet hours, signal prefs (settings content) |
| **pause** | Ritual deep-link state (`NotificationNavigateState`) |
| **market** | Eligibility inputs to `check-volatility` (thresholds, quiet windows read server-side) |
| **app** | Mounts `NotificationBell` in `AppLayout` only |

Import rules: screens and app use `@/features/notifications/public-hooks` and `public-queries`; not deep `presentation/` except shell via `public-hooks`.

## Deep links

- Bell and push often navigate to `/pause` with `{ pauseInstanceId }` in router state or `?pause=ready` (see `use-auto-trigger`, service worker `notificationclick`).
- Hydration is the same contract as manual pause entry ([phase-2-manual-pause-pipeline.md](../reviews/phase-2-manual-pause-pipeline.md)).

## Observability

- Push/email edge paths: `x-cid` via `invokeEdge` / `withRequestLogging` on `register-push` and `check-volatility`.
- Product analytics for subscribe/checkout are separate from this doc ([event-taxonomy.md](../ops/event-taxonomy.md)).

## Server delivery helper

Post-claim **email + web push** for automatic pause offers: [`supabase/functions/_shared/notifications-deliver-pause-offer.ts`](../../supabase/functions/_shared/notifications-deliver-pause-offer.ts) (`deliverPauseOfferChannels`, `initWebPushVapidFromEnv`). Called from `check-volatility` after `pause_create_or_reuse_as`.

Client policy mirror (which channels apply): `features/notifications/application/use-cases/delivery/pause-offer-policy.ts` (`channelsForPauseOffer`, `buildPauseOfferNotifyIntent`).

## Follow-ups

1. Re-enable non-pause notification types only with explicit types in inbox mapper + active-surface rows.
2. Add `packages/notifications` when monorepo extraction gate passes ([ADR](../decisions/2026-05-17-modular-monolith-hexagonal-client.md) §8).
3. Optional RPC `notifications_deliver_pause_offer` if more edges need the same send path without importing Deno shared code.
