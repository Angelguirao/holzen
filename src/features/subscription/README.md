# Subscription feature module

Stripe / entitlements / billing.

## Hooks and shell UI

| Import from | Contents |
|-------------|----------|
| `@/features/subscription/public` | Domain types, entitlement helpers (no React) |
| `@/features/subscription/public-queries` | TanStack subscription snapshot |
| `@/features/subscription/public-hooks` | `useSubscription`, `useProGate` |
| `@/features/subscription/presentation/*` | Shell-only components (`CheckoutConfirmation`, `PaywallSubscribedTracker`) — mount from `app/components` only |

## Presentation (shell-mounted)

| File | Mounted from |
|------|----------------|
| `presentation/CheckoutConfirmation.tsx` | `AppLayout` — Stripe return modal on any authenticated tab |
| `presentation/PaywallSubscribedTracker.tsx` | `AppLayout` — `paywall.subscribed` PostHog after checkout |

## Tests

Vitest files beside modules: `application/*.test.ts`, `presentation/CheckoutConfirmation.*.test.tsx` (guard + no-refetch regression). Coverage thresholds in `vitest.config.ts` target `CheckoutConfirmation.tsx` and `checkout-suppression-window.ts`.
