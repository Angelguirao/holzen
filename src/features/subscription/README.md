# Subscription feature module

Stripe / entitlements / billing. Migrate from `src/hooks/use-subscription.ts` and related `src/lib/` in small PRs.

## Presentation (shell-mounted)

| File | Mounted from |
|------|----------------|
| `presentation/CheckoutConfirmation.tsx` | `AppLayout` — Stripe return modal on any authenticated tab |
| `presentation/PaywallSubscribedTracker.tsx` | `AppLayout` — `paywall.subscribed` PostHog after checkout |

Import via `@/features/subscription/public` (not deep `presentation/` paths from `app/`).
