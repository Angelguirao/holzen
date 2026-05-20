# Subscription client architecture (target)

**Status:** scaffold (May 2026) — expand during Phase B slices  
**Audience:** engineers touching `src/features/subscription/` or billing UI  
**Server authority:** Stripe edges (`check-subscription`, `create-checkout`, `stripe-webhook`, …), `profiles.subscription_status` — [active-surface.md](../ops/active-surface.md) § Subscription  
**Template:** [pause-client-architecture.md](pause-client-architecture.md) §9  
**Principles:** [holzen-application-architecture.md](../fundamentals/holzen-application-architecture.md)

---

## 1. Thesis

**Subscription is one bounded context** for entitlement projection, checkout, and billing UX. It **gates** pause engage; it does not own ritual logic.

---

## 2. Client rings

| Ring | Owns |
|------|------|
| **Feature** | Entitlement helpers, checkout suppression, subscription snapshot queries, `useProGate` |
| **App shell** | `CheckoutConfirmation`, `PaywallSubscribedTracker` (mount from `AppLayout` only) |
| **Screens** | Settings billing sections — import `public*` only |

---

## 3. Target interior (`src/features/subscription/`)

```text
features/subscription/
  domain/                 # Entitlement, subscription status vocabulary
  application/use-cases/
    checkout/             # return URL handling, suppression window
    trial/                # ensure-trial flows (client side effects)
    portal/               # customer portal invoke
    entitlement/          # map profiles row → client entitlement
  ports/
    subscription-gateway.ts   # Stripe / edge invoke (future explicit port)
  infrastructure/
    queries/              # subscription snapshot TanStack modules
    edge/                 # invokeEdge wrappers (x-cid)
  presentation/
    use-subscription.ts
    use-pro-gate.ts
    CheckoutConfirmation.tsx    # shell-only
    PaywallSubscribedTracker.tsx  # shell-only
  public.ts | public-queries.ts | public-hooks.ts
```

Group `use-cases/` by **billing lifecycle**, not route names.

---

## 4. Public API

| Barrel | Purpose |
|--------|---------|
| `public.ts` | Types, pure entitlement helpers — no eager Supabase |
| `public-queries.ts` | Subscription snapshot query options |
| `public-hooks.ts` | `useSubscription`, `useProGate` |
| `public-rpc.ts` | *(future)* checkout / portal invoke facades |

---

## 5. Non-negotiables

1. **Entitlement truth** — server (`user_can_engage_pause`, Stripe webhook); client projects for UX only.
2. **Shell components** — checkout confirmation / paywall tracker mount from **app**, not random screens.
3. **Cross-context** — pause imports `@/features/subscription/public-hooks` for gating; subscription does not import pause screens.

---

## 6. Transitional state

Partially aligned today — see [src/features/subscription/README.md](../../src/features/subscription/README.md). Expand this doc when a Phase B slice changes structure.

---

## 7. Related

- [src/features/subscription/README.md](../../src/features/subscription/README.md)
- [docs/systems/costs/pricing-strategy.md](costs/pricing-strategy.md) (product pricing — not client layout)
