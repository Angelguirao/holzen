# Holzen AI cost model

Canonical source for what every AI-powered feature costs, where that cost is
enforced, and how to respond when spend goes sideways. Supersedes the old
pause-only estimates doc (which is now a focused case study — see link in §7).

> **Scope.** Third-party AI API spend only: Perplexity (Sonar Pro, Sonar) and
> Lovable AI Gateway (Google Gemini models). **Not** included: Lovable
> workspace subscription, Cloud hosting, Supabase plan fees, Stripe, Resend,
> VAPID, CoinGecko usage. Those are real costs but bill on separate dashboards
> and don't scale with AI usage.

---

## 1. Providers and current pricing

Pricing is mirrored in `supabase/functions/_shared/observe.ts` as
`DEFAULT_COST_MAP` + `DEFAULT_PERPLEXITY_REQUEST_FEE_USD`. Override at runtime
with env vars `COST_MAP_OVERRIDE` and `PERPLEXITY_REQUEST_FEE_USD_JSON` if your
negotiated rate differs.

### 1.1 Perplexity — [pricing docs](https://docs.perplexity.ai/docs/getting-started/pricing)

| Model        | Input $/1M | Output $/1M | Per-request fee (low context) |
|--------------|-----------:|------------:|------------------------------:|
| `sonar-pro`  |         $3 |         $15 |                        $0.006 |
| `sonar`      |         $1 |          $1 |                        $0.005 |

> **Watch:** request fee jumps to $0.010 / $0.014 per request at medium/high
> search context. We currently bill as low; tune `PERPLEXITY_REQUEST_FEE_USD_JSON`
> if that changes.

### 1.2 Lovable AI Gateway — [pricing docs](https://docs.lovable.dev/integrations/ai)

| Model                             | Input $/1M | Output $/1M |
|-----------------------------------|-----------:|------------:|
| `google/gemini-2.5-flash`         |      $0.15 |       $0.60 |
| `google/gemini-3-flash-preview`   |      $0.15 |       $0.60 |
| `google/gemini-2.5-flash-lite`    |     $0.075 |       $0.30 |
| `google/gemini-2.5-flash-image`   |      $0.30 |      $30.00 |

The image model bills output tokens at a premium (~1,290 output tokens per
image → ~$0.039 per generated image). A Lovable usage-based surcharge may
apply on top of Google list pricing — verify in
**Workspace Settings → Cloud & AI balance**.

### 1.3 Pricing drift policy

- Re-verify quarterly or when a provider publishes changes.
- Treat all numbers in §5 / §6 as **order-of-magnitude** until reconciled with
  the provider dashboards per §8.

---

## 2. Every AI-powered feature

Every row is protected by `guardAiFeature()` (feature flag + panic mode +
cost ceilings). Rows with "✓" for logging appear in the admin Cost tab's
per-feature breakdown. Logging is how per-user daily caps know anything was
spent — a row without logging still runs but cannot be capped per-user.

| Function | Trigger | Provider / model(s) | Logs `generation_attempts` | Fallback on block |
|---|---|---|---|---|
| `holzen-reflect` | user / cron (`check-volatility`) | Lovable `gemini-3-flash-preview` → `gemini-2.5-flash` | ✓ | Curated fallback pool |
| `companion-orchestrate` → signal | user / cron | Perplexity `sonar-pro` + Lovable `gemini-2.5-flash(-lite)` | ✓ | Library → cache → curated |
| `companion-orchestrate` → grounding | user / cron | Perplexity `sonar-pro` + Lovable `gemini-2.5-flash(-lite)` | ✓ | Library → cache → curated |
| `companion-orchestrate` → history | user / cron | Perplexity `sonar-pro` + Lovable `gemini-2.5-flash(-lite)` | ✓ | Cache → curated |
| `companion-orchestrate` → zoom-out | user / cron | Lovable `gemini-2.5-flash(-lite)` (BTC prices from cache) | ✓ | Cache → curated |
| `companion-orchestrate` → intervention (question) | user / cron | Lovable `gemini-3-flash-preview` | ✓ (conditional) | Skip question |
| `regenerate-only` | user (targeted refresh) | One of the above generators | ✓ | 503 with reason |
| `journal-prompt` | user | Lovable `gemini-2.5-flash` | ✓ | 503 |
| `suggest-grounding` | user | Perplexity `sonar` + Lovable | ✓ | 503 |
| `suggest-ritual` | user | Lovable `gemini-3-flash-preview` | ✓ | Canned ritual template |
| `generate-wallpaper` | user (Pro) | Lovable `gemini-2.5-flash-image` | ✓ | 503 |
| `night-reflection` | cron | Lovable `gemini-2.5-flash` → `gemini-2.5-flash-lite` | ✓ | Static localized fallback |
| `reflection-insights` | cron / user | Lovable Gemini | ✓ | Skip run / 503 |
| `weekly-digest` | cron | Lovable `gemini-2.5-flash-lite` | ✓ | Digest email sent **without** AI insight |
| `monthly-report` | cron | Lovable `gemini-2.5-flash-lite` | ✓ | Report email sent **without** AI paragraph |
| `grounding-enrich` | user | Lovable `gemini-2.5-flash` (cache hits skip) | (via `createLogger`) | 503 |
| `admin-library-preview` | admin | Lovable `gemini-2.5-flash-lite` | ✓ | 503 |
| `pregenerate-companions` | cron | Perplexity + Lovable (same as orchestrate) | ✓ | Skip run |
| `fetch-source-feeds` | cron | Lovable + optional Perplexity | ✓ | Skip run |
| `personalized-nudge` | cron | **none** — CoinGecko + Resend only | N/A | N/A |
| `deliver-letters` | cron | **none** — stored letters + push | N/A | N/A |
| `holzen-number` | user | **none** | N/A | N/A |

---

## 3. Per-invocation cost estimates

Engineering estimates using midpoint token counts. Actuals vary with locale,
context length, and search depth. Use as order of magnitude only.

### 3.1 Lovable Gemini (text models)

Assume 5,000 input tokens / 500 output tokens on `gemini-2.5-flash`:

```
USD ≈ (5000 × 0.15 + 500 × 0.60) / 1e6 ≈ $0.00105
```

`gemini-2.5-flash-lite` is ~half that. `gemini-3-flash-preview` uses the
same default rate as `2.5-flash` in our `COST_MAP` until provider pricing
diverges.

### 3.2 Perplexity Sonar Pro

Assume 1,200 input tokens / 3,000 output tokens, low context:

```
USD ≈ (1200 × 3 + 3000 × 15) / 1e6 + 0.006 ≈ $0.0546
```

This is the dominant per-call cost in a pause session and the number the
`$10/day` global cap is really sizing against.

### 3.3 Wallpaper (Gemini image)

Flat ~$0.039 per image at current `COST_MAP` rate. Output tokens
(~1,290/image) multiply at the $30/1M output rate.

### 3.4 Reflection

Under one cent per successful reflection. Intentionally cheap — that's why
reflection is **exempt** from panic mode: you want a user to see a reflection
message even when the expensive companions are bypassed.

---

## 4. Scenario modeling

Each scenario assumes Pro users (who consume AI) and excludes free-tier users
past their 3-pause/month cap. These are stress figures; the cache warmer, the
reflection_companions skip-cache path, and user behavior all cut real numbers
below them.

### 4.1 100 Pro DAU

- **Pauses.** 100 × 2 full pauses/day × $0.20 (all-live happy path) ≈ $40/day.
- **Auxiliary AI** (journal prompts, night reflections, wallpapers at 20%
  weekly adoption, digests, reports): ~$3–5/day.
- **Total.** ~$45/day ≈ **~$1,350/month** AI spend. Well above the default
  $300/month cap → you either raise the cap or let panic mode + feature flags
  degrade non-essential features.

### 4.2 1,000 Pro DAU

- **Pauses.** 1000 × 2 × $0.20 ≈ $400/day.
- **Auxiliary.** ~$30–50/day.
- **Total.** ~$430–450/day ≈ **~$13,000/month**. At this scale the pause
  path is the binding constraint; prioritize caching (`pregenerate-companions`
  hit rate) and Perplexity rate negotiation.

### 4.3 10,000 Pro DAU

Infeasible without substantially higher cache hit rates (>70%) and tighter
per-user ceilings. The doc exists so nobody can say we didn't see it coming.

### 4.4 What caps actually stop

The defaults in `app_config` (`$10` daily global / `$1` daily per-user /
`$300` monthly global) map to roughly **50 all-live pauses globally per day**.
That's the ceiling, not the expected usage. The ceiling is intentionally
aggressive so you raise it on purpose, not by accident. Raise the cap in the
admin Tools tab when you see the daily spend bar sustain >60% for a week.

---

## 5. Guardrail architecture

The defense-in-depth layers, outermost first:

1. **Provider-side caps** — Perplexity auto-reload ceiling and Lovable
   workspace monthly cap. See §8 for recommended numbers.
2. **Engineering global caps** — `app_config.budget_daily_usd_global`,
   `budget_monthly_usd_global`. Block requests when exceeded.
3. **Engineering per-user caps** — `app_config.budget_daily_usd_per_user`.
   Catches a single runaway account without punishing everyone.
4. **Feature flags** — `app_config.feature_flags`. Turn off wallpaper,
   letters, nudges, digest, reports, etc. independently of cost state.
5. **Panic mode** — `app_config.panic_mode`. Bypasses the 5 companion
   generators + `pregenerate`. Reflection still runs.
6. **Per-user rate limit** — `checkRateLimit`, 30 AI events/60 min. Applies
   to the orchestrator and its event allowlist only; see
   `supabase/functions/_shared/ratelimit.ts`.
7. **Provider 402 / 429** — last-resort failure handling returns the feature's
   natural fallback (curated pool, canned template, silent no-op).

### 5.1 Where each cap is enforced today

| Path | Global daily | Per-user daily | Monthly | Panic mode | Feature flag |
|---|:-:|:-:|:-:|:-:|:-:|
| `companion-orchestrate` | ✓ | ✓ | ✓ | ✓ | (per generator) |
| `regenerate-only` | ✓ | ✓ | ✓ | ✓ | — |
| `holzen-reflect` | ✓ | ✓ | ✓ | **✗ (by design)** | — |
| `journal-prompt` | ✓ | ✓ | ✓ | — | `journal_prompt` |
| `suggest-grounding` | ✓ | ✓ | ✓ | — | `suggest_grounding` |
| `suggest-ritual` | ✓ | ✓ | ✓ | — | `suggest_ritual` |
| `generate-wallpaper` | ✓ | ✓ | ✓ | — | `wallpaper` |
| `grounding-enrich` | ✓ | ✓ | ✓ | — | `grounding_enrich` |
| `admin-library-preview` | ✓ | ✓ | ✓ | — | `admin_library_preview` |
| `night-reflection` | ✓ | — | ✓ | — | `night_reflection` |
| `weekly-digest` | ✓ | — | ✓ | — | `digest` |
| `monthly-report` | ✓ | — | ✓ | — | `reports` |
| `reflection-insights` | ✓ | — | ✓ | — | `reflection_insights` |
| `pregenerate-companions` | ✓ | — | ✓ | ✓ | `pregenerate` |
| `fetch-source-feeds` | ✓ | — | ✓ | — | `fetch_source_feeds` |

Per-user caps only apply when a specific `userId` is available (user-facing
endpoints); cron paths that loop over many users can't meaningfully cap
"per user" at the dispatch site.

---

## 6. Admin observability

The `/admin` UI exposes three surfaces relevant to cost:

- **Monitor tab** — daily cost chart, cache hit rates, failure rates. Same
  data as before; scales with `generation_attempts` logging.
- **Cost tab (new)** — per-feature breakdown, projected monthly at 7-day
  burn, top users by cost (7d), and **attempt-logging coverage**. If a
  feature is missing from the coverage grid, its spend isn't visible and
  per-user caps don't enforce on it.
- **Tools tab** — edit signup gate, cost ceilings, panic mode, feature
  flags at runtime. DB-backed; ~30 s propagation.

The numbers in the Cost tab come from `generation_attempts.estimated_cost_usd`
(same source the Monitor tab uses) and should match within noise.

---

## 7. Runbooks

### 7.1 Daily spend alert fires / ceiling hit

1. Open **Admin → Cost**. Who are the top 3 users over the last 24 h? Any
   single user >50% of the per-user cap is your first suspect.
2. Check **Admin → Cost → logging coverage**. A feature suddenly listed in
   the breakdown that wasn't there yesterday is worth investigating.
3. If a cron loop is suspect, **flip the relevant feature flag off** in
   Admin → Tools. Cron runs will skip it until you flip it back.
4. If unclear what's spending, **enable panic mode** in Admin → Tools. That
   buys you 15–30 min of near-zero AI spend to investigate while users still
   get reflections.
5. Once the source is clear, raise the cap (Admin → Tools) or leave panic
   mode on and deploy a fix.

### 7.2 Perplexity returns 402 (credit exhausted)

- Edge functions already degrade to cache/library/fallback on 402.
- Open Perplexity dashboard, verify auto-reload fired (§8). If reload is off
  or the monthly cap was hit, top up manually.
- Check Admin → Cost for unexpected spend in the last 24 h.

### 7.3 Lovable AI 402

- Same pattern: functions degrade on 402.
- Open Lovable **Workspace Settings → Cloud & AI balance**. Apply auto
  top-up settings per §8 if not already in place.
- Worth checking all feature flags in Admin → Tools — the `wallpaper` flag
  gets the most out-sized individual call cost (image model).

### 7.4 Panic mode on — when to turn it off

Panic mode is designed to be safe to leave on for hours. Turn off when:
- Cause is identified and fixed.
- Daily spend bar in Admin → Tools has recovered below 50% of cap.
- Pregenerate crons are unpaused and cache warm enough that the next wave
  of live generation won't immediately re-trigger the cap.

---

## 8. Recommended provider auto top-up

Philosophy: small automated top-ups so a buggy cron can't blow 4-figure sums
overnight, with monthly caps sized at roughly 2× current scale so we hit our
engineering cap first, not the provider cap.

### 8.1 Perplexity (Billing → Auto Reload)

| Setting | Value |
|---|---|
| Reload when balance below | **$20** |
| Reload amount | **$50** |
| Monthly spend cap | **$300** |

Each $50 top-up buys ~250 Sonar Pro calls at the current midpoint. The $300
cap is ~2× current 100 Pro DAU forecast (§4.1) so it provides cushion for
moderate growth without going wild during an incident.

### 8.2 Lovable AI (Workspace → Cloud & AI balance → Auto top-up)

| Setting | Value |
|---|---|
| Reload when balance below | **$15** |
| Reload amount | **$40** |
| Monthly spend cap | **$150** |

Lovable spend is dominated by cheap Gemini flash tokens; wallpaper images
are the outlier. $150/month covers ~3,800 wallpapers + all other Gemini
usage at current scale.

### 8.3 What **not** to enable

- Unlimited auto-reload on either provider.
- Lovable workspace-subscription auto-upgrade.
- Any provider-side "usage escalation" that bypasses monthly caps.

The engineering layer (panic mode + cost ceilings) is the primary defense.
Provider top-up is a secondary net.

---

## 9. Related docs

- [`docs/systems/pause/pause-session-cost-estimates.md`](../pause/pause-session-cost-estimates.md)
  — pause-only case study. Still valid for that narrow scope; this doc is
  the superset.
- [`docs/ops/deployment-sync-guide.md`](../../ops/deployment-sync-guide.md)
  — pre-push checklist. Add a note to re-run the cost estimates whenever
  `DEFAULT_COST_MAP` or new edge functions land.
- `supabase/migrations/20260419120000_app_config.sql` — schema for caps + flags.
- `supabase/functions/_shared/app-config.ts` — loader with TTL cache.
- `supabase/functions/_shared/ratelimit.ts` — `checkCostCeilings` + `guardAiFeature`.
- `src/components/admin/AppConfigTools.tsx` — Admin Tools UI.
- `src/components/admin/CostAnalytics.tsx` — Admin Cost tab.

---

## 10. Changelog

- **2026-04-19:** Initial version. Supersedes pause-only estimates doc as
  canonical. Covers all 17 AI-touching edge functions. Adds guardrail map,
  scenario bounds, runbooks, auto top-up recommendations.
