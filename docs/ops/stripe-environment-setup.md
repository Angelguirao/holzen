# Stripe: local test vs production

**Status:** operational runbook  
**Pairs with:** [production-supabase-setup.md](production-supabase-setup.md), [environment-matrix.md](environment-matrix.md), [branch-model.md](branch-model.md)

Holzen uses **one Stripe account** with two **modes** (test + live). The React app never holds Stripe keys — billing runs through Supabase Edge Functions.

**Canonical targets:** local Docker → **test** mode; **holzen-prod** → **live** mode. Legacy holzen-staging (`ksplyxx…`) was deleted 2026-07-16 — do not recreate.

---

## Mental model

| Layer | Local Docker | Production |
|-------|--------------|------------|
| Frontend `VITE_SUPABASE_*` | Local stack (`npm run dev:local`) | `holzen-prod` (`geqkxsnyqvhtascjghuu`) |
| Edge `STRIPE_SECRET_KEY` | `sk_test_…` in `supabase/.env.local` | `sk_live_…` / `rk_live_…` |
| Edge price IDs | Test-mode `price_…` | Live-mode `price_…` |
| Stripe webhook URL | `stripe listen --forward-to` local functions | `https://geqkxsnyqvhtascjghuu.supabase.co/functions/v1/stripe-webhook` |
| Vercel env scope | — | **Production** (+ Preview may share prod keys carefully) |

Customers, subscriptions, and checkout sessions in **test mode never mix** with live billing data.

---

## Prerequisites (do these first)

### 1. Edge functions must be deployed (prod)

Billing endpoints return **404** until functions are deployed to holzen-prod.

```sh
npx supabase login
npx supabase link --project-ref geqkxsnyqvhtascjghuu
npm run prod:deploy
```

Quick probe (expect **400** `Missing stripe-signature`, not **404**):

```sh
curl.exe -s -w "\nHTTP:%{http_code}" -X POST \
  "https://geqkxsnyqvhtascjghuu.supabase.co/functions/v1/stripe-webhook" \
  -H "Content-Type: application/json" -d "{}"
```

CI: [deploy-production.yml](../../.github/workflows/deploy-production.yml).

### 2. Stripe Dashboard access

Account: **Holzen**. You need **Developers → API keys** and **Developers → Webhooks** for both test and live toggles.

---

## Supabase Edge secrets (holzen-prod)

Copy `.env.prod.secrets.example` → `.env.prod.secrets` (live Stripe), fill values, then:

```sh
npm run prod:secrets-set
# or: npm run stripe:bootstrap-secrets
```

Or set manually in **Dashboard → Project Settings → Edge Functions → Secrets**.

| Secret | Local Docker | Production |
|--------|--------------|------------|
| `STRIPE_SECRET_KEY` | `sk_test_…` / `rk_test_…` | `sk_live_…` / `rk_live_…` |
| `STRIPE_WEBHOOK_SECRET` | From `stripe listen` | From **live** webhook endpoint |
| `STRIPE_PRICE_ID_PRO` | Test `price_…` | Live `price_…` |
| `STRIPE_PRICE_ID_FLEX_PACK_S` | Test one-time `price_…` | Live one-time `price_…` |
| `STRIPE_PRICE_ID_FLEX_PACK_M` | Test one-time `price_…` | Live one-time `price_…` |

**Not used by active checkout code today:** `STRIPE_PRICE_ID_PRO_PLUS`.

Price IDs are **mode-specific** — a live `price_…` fails with a test secret key.

---

## Stripe products (live catalog)

Use these **live** products/prices on **holzen-prod** (verify IDs in Dashboard → Products):

| Product | Type | Amount | Maps to secret |
|---------|------|--------|----------------|
| Holzen Pro | Recurring monthly | $4.99 | `STRIPE_PRICE_ID_PRO` |
| Holzen Flex Pack S | One-time | $2.49 | `STRIPE_PRICE_ID_FLEX_PACK_S` |
| Holzen Flex Pack M | One-time | $3.99 | `STRIPE_PRICE_ID_FLEX_PACK_M` |

For **local test**, create matching products in **Test mode** (or `npm run stripe:bootstrap-secrets`), then paste test `price_…` IDs into `supabase/.env.local`.

---

## Webhook endpoints

### Production (live)

| Mode | Endpoint URL |
|------|----------------|
| Live (holzen-prod) | `https://geqkxsnyqvhtascjghuu.supabase.co/functions/v1/stripe-webhook` |

### Events to subscribe

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

After saving, copy the **Signing secret** → `STRIPE_WEBHOOK_SECRET` on holzen-prod.

**Lovable cutover:** If a live webhook still points at a retired Lovable-linked Supabase ref, update it to `geqkxsnyqvhtascjghuu` or disable the old endpoint.

### Local webhook testing

```sh
stripe login
stripe listen --forward-to http://127.0.0.1:55421/functions/v1/stripe-webhook
# paste printed whsec_… into supabase/.env.local
```

---

## Frontend (Vercel)

No Stripe env vars on Vercel. Scope Supabase only:

| Vercel scope | `VITE_SUPABASE_URL` | Effect on billing |
|--------------|---------------------|-------------------|
| Production | `https://geqkxsnyqvhtascjghuu.supabase.co` | Live Stripe via prod edges |
| Preview | Usually same prod URL (careful) | Hits live edges unless you use local/test keys elsewhere |

Local billing QA:

```sh
npm run supabase:start
npm run supabase:functions:serve
npm run dev:local
```

---

## Verification checklist

### A. Secrets + prices (in-app)

1. Sign in as a user with `profiles.is_admin = true`.
2. Open **`/admin`** → **Stripe Price Check**.
3. All three required prices should show **ok**.

### B. Checkout smoke (local test)

1. `npm run dev:local` → Settings → start checkout / trial path.
2. Card `4242 4242 4242 4242`, any future expiry, any CVC.
3. Confirm redirect back; `profiles.subscription_status` updates (with `stripe listen`).

### C. Bruno (API-only)

[bruno/active/billing/README.md](../../bruno/active/billing/README.md) — requires JWT + deployed edges + Stripe secrets.

### D. Webhook delivery

Stripe Dashboard → Webhooks → endpoint → **Recent deliveries** — expect **2xx**. `Invalid signature` → wrong `STRIPE_WEBHOOK_SECRET`.

---

## Troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| `Requested function was not found` (404) | Edges not deployed to holzen-prod |
| `STRIPE_SECRET_KEY is not set` | Missing edge secret |
| `Missing Stripe price id for checkout kind` | `STRIPE_PRICE_ID_*` not set |
| Admin price check: `prod_…` error | Product ID pasted instead of **Price** ID |
| Checkout works but profile never updates | Webhook URL wrong, wrong signing secret, or endpoint not receiving events |

---

## Security notes

- Prefer Stripe **restricted keys** scoped to Customers, Checkout Sessions, Subscriptions, Billing Portal, and Webhooks read-only where possible.
- Never commit `sk_*`, `rk_*`, or `whsec_*` to git.
- Store live secrets labeled for `geqkxsnyqvhtascjghuu`; keep test keys in local Docker env only.

---

## Related billing edges

| Function | Role |
|----------|------|
| `create-checkout` | Stripe Checkout Session URL |
| `check-subscription` | Profile cache + Stripe subscription read |
| `create-checkout` (`trial: true`) | 7-day trial via Stripe Checkout |
| `ensure-trial-subscription` | Idempotent trial status read |
| `stripe-webhook` | Subscription sync + flex credit grants |
| `customer-portal` | Billing portal URL |
| `admin-check-stripe-prices` | Secret/price validation (admin) |

Client architecture: [subscription-client-architecture.md](../systems/subscription-client-architecture.md).
