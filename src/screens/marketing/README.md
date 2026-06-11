# Marketing / public screens

Public routes (no auth shell). **Marketing HTML** (`/welcome`, `/about`, `/blog`, legal) is Astro — see `apps/site/`. This folder keeps SPA-only public flows.

| Screen | Route | Notes |
|--------|-------|-------|
| `MarketingDevFallback` | `/welcome`, `/about`, `/blog`, `/terms`, `/privacy` | Dev stub → Astro on :4321 |
| `AuthScreen` | `/auth` | Product SPA |
| `ResetPasswordScreen` | `/reset-password` | Product SPA |
| `NotFoundScreen` | `*` catch-all | Product SPA |
| `UnsubscribeScreen` | `/unsubscribe` | Product SPA |
| ~~`AboutScreen`~~ etc. | — | **legacy** `src/legacy/marketing-spa-screens/` |

`components/PublicFooter.tsx` — still used by quarantined legacy roadmap/reserve screens.

`App.tsx` lazy-loads `screens/marketing/*Screen` directly.

Internal ops routes live under [`screens/ops/`](../ops/README.md).
