# Stripe Radar — trial Checkout (prepaid block)

Holzen blocks **prepaid** cards on **trial Checkout only** in two layers:

| Layer | Where | Scope |
|-------|--------|--------|
| **Server (required)** | `stripe-webhook` → `finalizeTrialCheckoutSubscription` | Cancels trialing sub when `card.funding === 'prepaid'` |
| **Radar (optional)** | Stripe Dashboard custom **Block** rule | Fails in Checkout **before** success redirect; scoped via `::holzen_trial::` metadata |

**Reactivation** checkout (`create-checkout` without `trial: true`) is **not** prepaid-blocked by Holzen code or by the Radar rule below.

**Custom Radar rules** require **[Radar for Fraud Teams](https://stripe.com/radar/fraud-teams)** on the Stripe account. If you do not have it, the webhook layer still enforces prepaid rejection — users may complete Checkout and then see the in-app “card not accepted” message.

---

## 1. Prerequisites

1. **Stripe Dashboard** access for **staging** and **production** (configure both if you use two Stripe accounts).
2. **Radar for Fraud Teams** enabled (Dashboard → **Radar** → you should see **Rules** with **Add rule**).
3. **Edge deploy** with trial Checkout sending SetupIntent metadata (see `create-checkout` → `setup_intent_data.metadata.holzen_trial = 'true'`).
4. Webhook endpoint **`stripe-webhook`** deployed with prepaid finalize logic.

---

## 2. Enable Radar on SetupIntents

Trial Checkout collects a card with **no charge** ($0 trial) via a **SetupIntent**, not a PaymentIntent.

1. Dashboard → **Radar** → **Settings** (gear or **Fraud controls** depending on UI).
2. Find **Rules for SetupIntents** (or **Evaluate SetupIntents**).
3. **Turn on** rules for SetupIntents.
4. Save.

Without this, a Block rule on `:card_funding:` may not run during trial card collection.

---

## 3. Add the prepaid Block rule (trial only)

1. Dashboard → **Radar** → **Rules**.
2. **Add rule** → type **Block** (or **Block payment**).
3. In the rule editor, use:

```text
Block if :card_funding: = 'prepaid' and ::holzen_trial:: = 'true'
```

4. Name (suggested): `Holzen — block prepaid on trial Checkout`.
5. Save and **enable** the rule.

### Why the metadata clause?

A global `Block if :card_funding: = 'prepaid'` would also block **paid reactivation** with prepaid cards. Holzen only sets `holzen_trial: true` on **trial** Checkout sessions (`create-checkout` with `{ "trial": true }`).

Metadata key on the SetupIntent: **`holzen_trial`** → Radar attribute **`::holzen_trial::`**.

---

## 4. Optional second rule (only if abuse continues)

After 2–4 weeks of data, if farms still appear with **debit-labeled** virtual cards:

```text
Block if ::holzen_trial:: = 'true' and :card_country: != :billing_address_country:
```

Start in **Review** (not Block) if you want to tune false positives before blocking.

Do **not** maintain a long custom BIN list unless you see the same BIN repeatedly in Stripe logs.

---

## 5. Test (staging)

### A. Radar blocks prepaid in Checkout (if Fraud Teams + rule enabled)

1. Sign in to Holzen **staging** with a test user who has **not** consumed a trial.
2. Start onboarding trial → redirect to Stripe Checkout.
3. Use Stripe’s **prepaid** test PAN (see [Stripe test cards](https://docs.stripe.com/testing#cards)) — commonly documented as **`4000002500003155`** (verify in your Stripe docs version; funding type must show as prepaid in Dashboard).
4. **Expected:** Checkout shows a decline/block **before** returning to Holzen.

### B. Webhook fallback (always)

If Radar does not run or rule is off:

1. Complete Checkout with a prepaid card that Stripe allows through.
2. **Expected:** Redirect to `?trial_checkout=success`, then app shows **“We could not start your trial with this card…”** and onboarding **does not** complete.
3. Edge log: `trial_checkout_prepaid_rejected`.
4. PostHog: `trial.denied` with `reason: trial_card_not_accepted`.

### C. Happy path

1. Use a normal **debit/credit** test card (e.g. `4242424242424242`).
2. **Expected:** Trial active, onboarding completes, no auto-charge at trial end (`cancel_at` set in webhook).

---

## 6. Production rollout checklist

- [ ] Rule added on **production** Stripe account (not only staging).
- [ ] SetupIntents enabled for Radar (production).
- [ ] `create-checkout` + `stripe-webhook` deployed to production Supabase project.
- [ ] Spot-check one real trial signup after deploy.
- [ ] Monitor: `trial.denied` (`trial_card_not_accepted`), edge `trial_checkout_prepaid_rejected`, Stripe Radar **Blocked** volume.

---

## 7. Related code & docs

| Artifact | Path |
|----------|------|
| Trial Checkout session | `supabase/functions/create-checkout/index.ts` (`trial: true`, `setup_intent_data.metadata.holzen_trial`) |
| Prepaid cancel + `cancel_at` | `supabase/functions/_shared/trial-checkout-finalize.ts` |
| Client grant poll + UX | `src/features/subscription/application/trial-checkout-grant.ts` |
| Pricing / trial policy | [pricing-strategy.md](../systems/costs/pricing-strategy.md) |
| Bruno trial Checkout | `bruno/active/billing/01-create-checkout-trial.bru` |

Stripe references: [Radar rules](https://docs.stripe.com/radar/rules), [Supported attributes (`card_funding`)](https://docs.stripe.com/radar/rules/supported-attributes), [Risk evaluation on SetupIntents](https://docs.stripe.com/radar/risk-evaluation).
