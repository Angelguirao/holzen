# Stripe: staging vs production

**Status:** operational runbook (2026-05)  
**Pairs with:** [staging-supabase-setup.md](staging-supabase-setup.md), [production-supabase-setup.md](production-supabase-setup.md), [lovable-staging-and-platform-exit.md](lovable-staging-and-platform-exit.md)

Holzen uses **one Stripe account** with two **modes** (test + live). The React app never holds Stripe keys — billing runs through Supabase Edge Functions, and each Supabase project gets its own secret set.

---

## Mental model

| Layer | Staging / dev | Production |
|-------|---------------|------------|
| Frontend `VITE_SUPABASE_*` | `holzen-staging` (`ksplyxxdvandkwzundql`) | `holzen-prod` (`geqkxsnyqvhtascjghuu`) |
| Edge `STRIPE_SECRET_KEY` | `sk_test_…` | `sk_live_…` |
| Edge price IDs | Test-mode `price_…` | Live-mode `price_…` |
| Stripe webhook URL | `https://ksplyxxdvandkwzundql.supabase.co/functions/v1/stripe-webhook` | `https://geqkxsnyqvhtascjghuu.supabase.co/functions/v1/stripe-webhook` |
| Vercel env scope | **Preview** → staging Supabase | **Production** → prod Supabase |

Customers, subscriptions, and checkout sessions in **test mode never mix** with live billing data.

---

## Prerequisites (do these first)

### 1. Edge functions must be deployed

Billing endpoints return **404** until functions are deployed to the target project.

```sh
npx supabase login
npx supabase link --project-ref ksplyxxdvandkwzundql   # staging
npm run staging:deploy                                 # db push + active edges

npx supabase link --project-ref geqkxsnyqvhtascjghuu   # prod
npm run prod:deploy                                    # after staging sign-off
```

Quick probe (expect **400** `Missing stripe-signature`, not **404**):

```sh
curl.exe -s -w "\nHTTP:%{http_code}" -X POST \
  "https://ksplyxxdvandkwzundql.supabase.co/functions/v1/stripe-webhook" \
  -H "Content-Type: application/json" -d "{}"
```

CI alternative: [staging-deploy.yml](../../.github/workflows/staging-deploy.yml) and [deploy-production.yml](../../.github/workflows/deploy-production.yml).

### 2. Stripe Dashboard access

Account: **Holzen** (connected). You need **Developers → API keys** and **Developers → Webhooks** for both test and live toggles.

---

## Supabase Edge secrets (both projects)

Copy `.env.staging.secrets.example` → `.env.staging.secrets` (test Stripe) or `.env.prod.secrets.example` → `.env.prod.secrets` (live Stripe), fill values, then:

```sh
npm run staging:secrets-set   # holzen-staging
npm run prod:secrets-set      # holzen-prod
```

Or set manually in **Dashboard → Project Settings → Edge Functions → Secrets**.

| Secret | Staging | Production |
|--------|---------|------------|
| `STRIPE_SECRET_KEY` | Restricted test key (`rk_test_…`) or `sk_test_…` | Restricted live key (`rk_live_…`) or `sk_live_…` |
| `STRIPE_WEBHOOK_SECRET` | From **test** webhook endpoint (`whsec_…`) | From **live** webhook endpoint |
| `STRIPE_PRICE_ID_PRO` | Test `price_…` (recurring, Pro) | Live `price_…` |
| `STRIPE_PRICE_ID_FLEX_PACK_S` | Test one-time `price_…` | Live one-time `price_…` |
| `STRIPE_PRICE_ID_FLEX_PACK_M` | Test one-time `price_…` | Live one-time `price_…` |

**Not used by active checkout code today:** `STRIPE_PRICE_ID_PRO_PLUS` (Pro+ tier is documented for future packaging; `create-checkout` only sells Pro + flex packs).

Price IDs are **mode-specific** — a live `price_…` will fail if pasted into staging secrets with a test secret key.

---

## Stripe products (live catalog — May 2026)

Use these **live** products/prices on **holzen-prod** (verify IDs in Dashboard → Products; names below are canonical):

| Product | Type | Amount | Maps to secret |
|---------|------|--------|----------------|
| Holzen Pro | Recurring monthly | $4.99 | `STRIPE_PRICE_ID_PRO` |
| Holzen Flex Pack S | One-time | $2.49 | `STRIPE_PRICE_ID_FLEX_PACK_S` |
| Holzen Flex Pack M | One-time | $3.99 | `STRIPE_PRICE_ID_FLEX_PACK_M` |

**Legacy live products** (older Lovable-era naming — do **not** wire to secrets):

- “Holzen Pro” @ $5.00/mo and $3.00/mo — superseded by the v1 packaging table in [pricing-strategy.md](../systems/costs/pricing-strategy.md).

For **staging**, create matching products in **Test mode** (Products → ⋮ → *Copy to test mode*, or create manually), then paste the **test** `price_…` IDs into staging secrets.

---

## Webhook endpoints (Stripe Dashboard)

Create **one endpoint per Supabase project per mode**.

### URL

| Mode | Endpoint URL |
|------|----------------|
| Test (staging backend) | `https://ksplyxxdvandkwzundql.supabase.co/functions/v1/stripe-webhook` |
| Live (prod backend) | `https://geqkxsnyqvhtascjghuu.supabase.co/functions/v1/stripe-webhook` |

### Events to subscribe

Minimum set (matches [stripe-webhook](../../supabase/functions/stripe-webhook/index.ts)):

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

After saving, copy the **Signing secret** → `STRIPE_WEBHOOK_SECRET` on the matching Supabase project.

**Lovable cutover:** If a live webhook still points at the retired Lovable-linked Supabase ref, update it to `geqkxsnyqvhtascjghuu` or disable the old endpoint to avoid missed subscription sync.

### Local webhook testing (optional)

```sh
stripe login
stripe listen --forward-to http://127.0.0.1:55421/functions/v1/stripe-webhook
# paste printed whsec_… into local supabase secrets
```

---

## Frontend (Vercel)

No Stripe env vars on Vercel. Scope Supabase only:

| Vercel scope | `VITE_SUPABASE_URL` | Effect on billing |
|--------------|---------------------|-------------------|
| Production | `https://geqkxsnyqvhtascjghuu.supabase.co` | Live Stripe via prod edges |
| Preview | `https://ksplyxxdvandkwzundql.supabase.co` | Test Stripe via staging edges |

Local staging QA:

```sh
cp .env.staging.example .env.staging.local
# fill staging URL + publishable key
npm run dev:staging
```

---

## Verification checklist

### A. Secrets + prices (in-app)

1. Sign in as a user with `profiles.is_admin = true` (see [environment-matrix.md](environment-matrix.md)).
2. Open **`/admin`** → **Stripe Price Check** (calls `admin-check-stripe-prices`).
3. All three required prices should show **ok** with correct recurrence (Pro = recurring, flex = one_time).

### B. Checkout smoke (staging)

1. `npm run dev:staging` → Settings → start checkout / trial path.
2. Card `4242 4242 4242 4242`, any future expiry, any CVC.
3. Confirm redirect back; `profiles.subscription_status` updates (webhook path).

### C. Bruno (API-only)

[bruno/active/billing/README.md](../../bruno/active/billing/README.md) — `01-create-checkout-trial`, `02-check-subscription`, `04-ensure-trial-subscription` (idempotent read / legacy). Requires JWT + deployed edges + Stripe secrets.

### D. Webhook delivery

Stripe Dashboard → Webhooks → endpoint → **Recent deliveries** — expect **2xx** after a test checkout. Failures with `Invalid signature` → wrong `STRIPE_WEBHOOK_SECRET` for that project.

---

## Troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| `Requested function was not found` (404) | Edges not deployed to that Supabase project |
| `STRIPE_SECRET_KEY is not set` | Missing edge secret; redeploy not required after secret set |
| `Missing Stripe price id for checkout kind` | `STRIPE_PRICE_ID_*` not set for that project |
| Admin price check: `prod_…` error | Product ID pasted instead of **Price** ID |
| Checkout works but profile never updates | Webhook URL wrong, wrong signing secret, or endpoint not receiving events |
| Test card works on “prod” site | Vercel Production still pointing at **staging** Supabase URL |

---

## Security notes

- Prefer Stripe **restricted keys** scoped to Customers, Checkout Sessions, Subscriptions, Billing Portal, and Webhooks read-only where possible.
- Never commit `sk_*`, `rk_*`, or `whsec_*` to git.
- Store prod vs staging secrets in a password manager with labels matching Supabase project refs.

---

## Related billing edges

| Function | Role |
|----------|------|
| `create-checkout` | Stripe Checkout Session URL |
| `check-subscription` | Profile cache + Stripe subscription read |
| `create-checkout` (`trial: true`) | 7-day trial via Stripe Checkout (card on file; $0 today) |
| `ensure-trial-subscription` | Idempotent trial status read; returns `checkout_required` when a new trial must start via Checkout |
| `stripe-webhook` | Subscription sync + flex credit grants |
| `customer-portal` | Billing portal URL |
| `admin-check-stripe-prices` | Secret/price validation (admin) |

Client architecture: [subscription-client-architecture.md](../systems/subscription-client-architecture.md).
