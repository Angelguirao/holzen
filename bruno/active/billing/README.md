# Billing (Stripe Edge Functions)

Requires a **signed-in user JWT** (`../auth/01-sign-in-password` or paste `SUPABASE_ACCESS_TOKEN`). User must have **email** on the account (functions use it for Stripe customer lookup).

| Request | Edge function | Body |
|---------|----------------|------|
| `01-create-checkout` | [create-checkout](../../supabase/functions/create-checkout/index.ts) | None — returns `{ url }` to Stripe Checkout. |
| `02-check-subscription` | [check-subscription](../../supabase/functions/check-subscription/index.ts) | JSON: `{ "force": false }` — set **`force`: true** to bypass profile cache (see function). |
| `03-customer-portal` | [customer-portal](../../supabase/functions/customer-portal/index.ts) | None — returns `{ url }` to Stripe Billing Portal; **requires** an existing Stripe customer. |
| `04-ensure-trial-subscription` | [ensure-trial-subscription](../../supabase/functions/ensure-trial-subscription/index.ts) | `{}` — starts or returns existing **7-day** Stripe trial (onboarding path; no Checkout redirect). |

## Local vs hosted

- **Hosted:** `STRIPE_SECRET_KEY` is set in the Supabase project; Checkout/Portal work if Stripe test/live keys match your dashboard.
- **Local `supabase functions serve`:** set secrets (e.g. `supabase secrets set` or `.env` per [Supabase local functions docs](https://supabase.com/docs/guides/functions/secrets)); without `STRIPE_SECRET_KEY`, responses will be **500** with a clear error message.

Bruno does **not** run Stripe webhooks — use Stripe CLI or dashboard for webhook testing.
