# Bruno — pause-first shipped smoke

Thin HTTP checks for **deployed** edges after push. Use environment **`hosted`** ([`../environments/hosted.bru`](../environments/hosted.bru)).

## Sequence

1. `01-health.bru` — no auth
2. `02-check-subscription.bru` — user JWT; expect `subscription_status` / tier fields
3. `03-ensure-trial-subscription.bru` — user JWT; expect `{ ok: true, subscription_status }` (idempotent; creates Stripe trial without Checkout redirect)

Full billing flows: [`../billing/`](../billing/).

## Variables

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_ACCESS_TOKEN` (user session JWT)
