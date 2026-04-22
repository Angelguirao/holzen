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
| Pro | `$4.99/mo` | Unlimited pauses/reflections, `12` premium companion unlocks/month, `5` wallpapers/month, weekly digest + night reflection |
| Pro+ | `$9.99/mo` | Unlimited pauses/reflections, `30` premium companion unlocks/month, `15` wallpapers/month, higher regeneration limits, richer report depth |

Notes:

- Keep trial at `7` days (current behavior).
- "Premium companion unlock" means a high-value companion card render
  (signal/grounding/history). Internal backend path is irrelevant to users.
- `zoom-out` can remain included at low/no unlock consumption internally.

### 3.2 Add-on packs

| Pack | Price | Included |
| --- | --- | --- |
| Companion Pack S | `$1.99` | `+10` premium companion unlocks |
| Companion Pack M | `$3.99` | `+25` premium companion unlocks |
| Wallpaper Pack | `$1.99` | `+20` wallpapers |

Auto top-up is optional and can be added later after usage stabilizes.

---

## 4. Sustainability check (low-cache assumption)

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
- Prior drafts like `30` companions in Pro or `120` in Pro+ are not sustainable
  under low-cache/worst-case assumptions.

This is why v1 plan limits are intentionally conservative.

---

## 5. Scope of AI features per tier

### 5.1 Free

- Included: pause ritual, reflection message, basic history.
- Excluded: premium companions, wallpapers, advanced AI insights/reports.

### 5.2 Pro

- Included: all core and premium features.
- Metered: premium companion unlocks and wallpaper generation.
- Included with sensible internal throttles: digest/night reflection, journal
  prompts, standard insights cadence.

### 5.3 Pro+

- Same feature set as Pro with materially higher allowances and processing
  priority under load.
- Intended for heavy but legitimate personal use.

---

## 6. Customer-facing language guidelines

Use:

- "Unlimited pauses."
- "Includes monthly premium companion unlocks."
- "Optional packs if you want more this month."

Avoid:

- "live generation credits"
- "cache mode"
- provider/model names in pricing copy

Fair-use clause (short form):

> Plans are designed for personal use. Reasonable safeguards may apply to
> abusive or automated usage to keep quality and reliability high for everyone.

---

## 7. Operational guardrails (internal)

Keep current controls active regardless of pricing:

- `app_config` cost ceilings (global daily, per-user daily, monthly global)
- panic mode and feature flags
- provider circuit breakers
- rate limit and regeneration limits
- daily AI cost alert email

These are required to enforce downside protection even with package limits.

---

## 8. KPI thresholds and adjustment policy

Track weekly:

- AI COGS / MRR (target <= `30%`)
- Top `5%` user share of AI spend
- Companion cache/library hit-rate trend
- Conversion and churn by tier
- Pack attach rate

Adjustment rules:

- If AI COGS / MRR > `35%` for 2 consecutive weeks:
  - reduce included unlocks by `10-20%` for new signups, or
  - raise Pro+ price / tighten wallpaper cap.
- If AI COGS / MRR < `20%` for 6 weeks and retention is stable:
  - increase included unlocks by `10-20%` or improve pack value.

---

## 9. Rollout plan

1. Ship copy update (pricing page + FAQ + settings microcopy) with no technical
   backend terminology.
2. Release v1 limits above.
3. Monitor 30 days before changing plan values.
4. Only then decide whether to:
   - add annual pricing discount,
   - introduce auto top-up,
   - relax allowances due to stronger cache economics.

---

## 10. Canonical references

- `docs/systems/costs/ai-cost-model.md` (cost assumptions, guardrails, runbooks)
- `docs/systems/pause/pause-session-cost-estimates.md` (pause-only case study)
- `src/lib/pricing.ts` (app-facing base pricing constants)
- `supabase/functions/_shared/observe.ts` (runtime cost map)
- `supabase/functions/_shared/ratelimit.ts` (cost ceilings and feature guards)
