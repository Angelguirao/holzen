# Holzen pricing strategy (sustainability-first)

Decision document for pricing and packaging after the AI cost-model audit.
This translates cost analysis into a customer-facing pricing model that is
simple, defensible, and resilient while cache coverage is still maturing.

---

## 1. Executive decision

1. Keep a free tier for acquisition, but make it cheap to serve.
2. Keep "unlimited pauses" as the core promise.
3. Do not promise unlimited premium companions in low-price plans.
4. Package premium companion usage with monthly allowances per plan.
5. Use add-on packs to monetize heavy users instead of subsidizing outliers.

Customer copy should never mention cache/live/provider internals. We sell
quality and outcomes; infra routing remains internal.

---

## 2. Why this strategy

From `docs/systems/costs/ai-cost-model.md`:

- Full all-live pause baseline is around `$0.18` (planning average `$0.21`).
- Perplexity-backed companion calls dominate variable cost.
- At current plan pricing, literal unlimited premium companions is not viable
  without very high cache hit rates and sustained low effective cost per serve.

Therefore the sustainable pattern is:

- Unlimited core habit loop (pause + reflection),
- Metered premium companion depth,
- Optional packs for power usage,
- Internal guardrails (caps, panic mode, feature flags, circuit breakers).

---

## 3. Pricing architecture

### 3.1 Plan table (v1 launch)

| Plan | Price | Included |
| --- | --- | --- |
| Free | `$0` | `3` pauses/month, core ritual + reflection, no premium companions, no AI extras |
| Pro | `$4.99/mo` | Unlimited pauses/reflections, `12` premium companion + guidance actions/month, `5` wallpapers/month, `4` on-demand insight generations/month, weekly digest + night reflection |
| Pro+ | `$9.99/mo` | Unlimited pauses/reflections, `30` premium companion + guidance actions/month, `15` wallpapers/month, `12` on-demand insight generations/month, higher regeneration limits, richer report depth |

Notes:

- Keep trial at `7` days (current behavior).
- "Premium companion + guidance action" means a high-value companion card render
  (signal/grounding/history) or a user-triggered AI guidance action
  (`journal-prompt`, `suggest-grounding`, `suggest-ritual`).
- `zoom-out` remains included and is not metered separately in v1.

### 3.2 Add-on packs

| Pack | Price | Included |
| --- | --- | --- |
| Companion Pack S | `$1.99` | `+10` premium companion + guidance actions |
| Companion Pack M | `$3.99` | `+25` premium companion + guidance actions |
| Wallpaper Pack | `$1.99` | `+20` wallpapers |

Auto top-up is optional and can be added later after usage stabilizes.

### 3.3 Feature inclusion matrix (plan clarity)

| Feature path | Free | Pro (`$4.99`) | Pro+ (`$9.99`) | Add-on packs |
| --- | --- | --- | --- | --- |
| Pause ritual + reflection (core) | `3`/month | Unlimited | Unlimited | N/A |
| Premium companion cards (signal/grounding/history) | Not included | Included, counts toward `12` companion+guidance actions/month | Included, counts toward `30` companion+guidance actions/month | Companion Pack S/M |
| AI guidance: journal prompts | Not included | Included, counts toward companion+guidance pool | Included, counts toward companion+guidance pool | Companion Pack S/M |
| AI guidance: suggest grounding | Not included | Included, counts toward companion+guidance pool | Included, counts toward companion+guidance pool | Companion Pack S/M |
| AI guidance: suggest ritual | Not included | Included, counts toward companion+guidance pool | Included, counts toward companion+guidance pool | Companion Pack S/M |
| Wallpaper generation | Not included | `5`/month | `15`/month | Wallpaper Pack |
| On-demand reflection insights (manual generate/refresh) | Not included | `4`/month | `12`/month | Not in v1 (future insight pack optional) |
| Weekly digest AI summary | Not included | Included (reasonable-use throttles) | Included (reasonable-use throttles) | N/A |
| Monthly report AI summary | Not included | Included (reasonable-use throttles) | Included (reasonable-use throttles) | N/A |
| Night reflection | Not included | Included (reasonable-use throttles) | Included (reasonable-use throttles) | N/A |
| Companion `zoom-out` perspective | Not included | Included (not metered separately in v1) | Included (not metered separately in v1) | N/A |

### 3.4 What packs apply to

| Pack | Applies to features | Does not apply to |
| --- | --- | --- |
| Companion Pack S / M | Premium companion cards + AI guidance actions (`journal-prompt`, `suggest-grounding`, `suggest-ritual`) | Wallpapers, on-demand reflection insights |
| Wallpaper Pack | `generate-wallpaper` | Companion+guidance pool, on-demand reflection insights |

---

## 4. V1 flex credit schema (recommended)

This is the concrete hybrid model: keep per-feature included allowances in plans,
and add one universal top-up pack for overage.

### 4.1 Credit burn rates (per action)

| Feature/action | Credit cost | Rationale (cost-weighted) |
| --- | --- | --- |
| Premium companion/guidance action (`signal`, `grounding`, `history`, `journal-prompt`, `suggest-grounding`, `suggest-ritual`) | `3` credits | Highest variable-cost path in normal usage |
| Wallpaper generation (`generate-wallpaper`) | `2` credits | Mid-cost path |
| On-demand reflection insights (`reflection-insights` user-triggered) | `1` credit | Lowest-cost premium action |

### 4.2 Plan inclusions (keep current UX language)

| Plan | Included monthly allowances | Credit-equivalent value (internal) |
| --- | --- | --- |
| Free | `3` pauses, no premium AI actions | `0` credits |
| Pro | `12` companion+guidance, `5` wallpapers, `4` insights | `50` credits (`12*3 + 5*2 + 4*1`) |
| Pro+ | `30` companion+guidance, `15` wallpapers, `12` insights | `132` credits (`30*3 + 15*2 + 12*1`) |

### 4.3 Universal top-up packs (single pack type)

| Pack | Price | Credits granted | Notes |
| --- | --- | --- | --- |
| Flex Pack S | `$2.49` | `30` credits | Straight top-up |
| Flex Pack M | `$3.99` | `55` credits | Includes bonus credits |

Pack semantics:

- Credits are consumed only when included monthly allowance for that feature is
  exhausted.
- Credits apply across all premium actions using the burn-rate table above.
- Credits do not apply to core pause/reflection.

### 4.4 Sustainability envelope check (worst-case mix)

- Worst-case is all credits spent on companion/guidance:
  - `3` credits/action and `~$0.05-0.06` cost/action => `~$0.0167-0.0200` cost/credit.
- Revenue per credit:
  - Pack S: `$2.49 / 30 = $0.083`
  - Pack M: `$3.99 / 55 = $0.073`
- Worst-case COGS per sold pack:
  - Pack S (`30` credits): `~$0.50-0.60` (`~20-24%` COGS)
  - Pack M (`55` credits): `~$0.92-1.10` (`~23-28%` COGS)

This stays inside the `<=30%` AI COGS target under conservative assumptions.

### 4.5 Mapping to current Supabase model (minimal-change path)

Current state already in production:

- `profiles.subscription_tier` caches tier.
- `monthly_feature_usage` tracks included monthly usage for:
  - `premium_companion`
  - `wallpaper`
  - `reflection_insights`
- `consume_monthly_feature_quota()` enforces included limits.

Recommended V1 extension:

1. Keep included monthly quotas exactly as-is.
2. Add persistent wallet + ledger:
   - `credit_wallets`
   - `credit_ledger`
3. Add RPC `consume_feature_allowance_or_credits(...)`:
   - consume remaining included allowance first
   - consume flex credits for any overage
   - fail atomically when credits are insufficient
4. Add RPC `add_flex_credits(...)`:
   - idempotent grants keyed by Stripe event id
5. Invocation flow in premium functions:
   - step A: attempt included allowance
   - step B: fallback to flex credits
   - step C: if both unavailable, return `402` with usage + credit hints
6. `check-subscription` returns wallet balance for UI.

Stripe wiring for this flow:

- `create-checkout` supports:
  - `checkoutKind: "subscription"` + `planTier: "pro" | "pro_plus"`
  - `checkoutKind: "flex_pack_s" | "flex_pack_m"`
- `stripe-webhook` handles `checkout.session.completed` /
  `checkout.session.async_payment_succeeded` and grants credits idempotently.
- Required env vars:
  - `STRIPE_PRICE_ID_PRO`
  - `STRIPE_PRICE_ID_PRO_PLUS`
  - `STRIPE_PRICE_ID_FLEX_PACK_S`
  - `STRIPE_PRICE_ID_FLEX_PACK_M`
  - `STRIPE_WEBHOOK_SECRET`

### 4.6 UX copy guardrails

- Keep plan messaging feature-first ("includes X/month"), not token-first.
- Show credits only as overflow currency:
  - "Need more this month? Add Flex credits."
- Never expose provider/model terminology in customer copy.

---

## 5. Sustainability check (low-cache assumption)

This section uses conservative envelope math to avoid overfitting to best-case
cache performance.

Assumptions:

- Target AI COGS <= `30%` of subscription revenue.
- Companion worst-case marginal cost envelope: `~$0.05-0.06` per premium serve.
- Wallpaper estimate: `~$0.039` each.
- Reflection and lightweight recurring AI remain comparatively cheap.

At these assumptions:

- Pro (`12` companions + `5` wallpapers) stays near target with moderate room.
- Pro+ (`30` companions + `15` wallpapers) is viable if routing and fallback
  controls continue to suppress sustained worst-case paths.

---

## 6. Scope of AI features per tier

### 6.1 Free

- Included: pause ritual, reflection message, basic history.
- Excluded: premium companions, wallpapers, advanced AI insights/reports.

### 6.2 Pro

- Included: all core and premium features.
- Metered: premium companion + guidance actions and wallpaper generation.
- Included with sensible internal throttles: digest/night reflection, standard
  insights cadence.
- Metered by package: user-triggered "Generate/Refresh insights" action.

### 6.3 Pro+

- Same feature set as Pro with materially higher allowances and processing
  priority under load.

---

## 7. Customer-facing language guidelines

Use:

- "Unlimited pauses."
- "Includes monthly premium companion actions."
- "Optional Flex credits if you want more this month."

Avoid:

- "live generation credits"
- "cache mode"
- provider/model names in pricing copy

---

## 8. Operational guardrails (internal)

- `app_config` cost ceilings (global daily, per-user daily, monthly global)
- panic mode and feature flags
- provider circuit breakers
- rate limits and regeneration limits
- daily AI cost alert email

---

## 9. KPI thresholds and adjustment policy

- Track AI COGS / MRR weekly (target `<=30%`).
- Monitor top `5%` user cost concentration.
- Monitor companion cache/library hit-rate trend.
- Monitor pack attach rate and tier conversion.

---

## 10. Rollout plan

1. Ship copy update (pricing page + FAQ + settings).
2. Release Flex packs + wallet/ledger backend.
3. Monitor 30 days before adjusting limits/prices.

---

## 11. Canonical references

- `docs/systems/costs/ai-cost-model.md`
- `supabase/functions/_shared/subscription-entitlements.ts`
- `supabase/functions/check-subscription/index.ts`
- `supabase/functions/create-checkout/index.ts`
- `supabase/functions/stripe-webhook/index.ts`
- `supabase/migrations/20260422090000_subscription_tiers_and_feature_quotas.sql`
- `supabase/migrations/20260422130000_flex_credits_wallet.sql`
