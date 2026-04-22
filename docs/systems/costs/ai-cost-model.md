# Holzen AI cost model

Canonical source for what every AI-powered feature costs, where that cost is
enforced, and how to respond when spend goes sideways. Supersedes the old
pause-only estimates doc (which is now a focused case study — see link in §7).

> **Scope.** Third-party AI API spend only: Perplexity (Sonar Pro, Sonar) and
> Lovable AI Gateway (Google Gemini models). **Not** included: Lovable
> workspace subscription, Cloud hosting, Supabase plan fees, Stripe, Lovable Email,
> VAPID, CoinGecko usage. Those are real costs but bill on separate dashboards
> and don't scale with AI usage.

---

## 1. Providers and current pricing

Pricing is mirrored in `supabase/functions/_shared/observe.ts` as
`DEFAULT_COST_MAP` + `DEFAULT_PERPLEXITY_REQUEST_FEE_USD`. Override at runtime
with env vars `COST_MAP_OVERRIDE` and `PERPLEXITY_REQUEST_FEE_USD_JSON` if your
negotiated rate differs.

### 1.1 Perplexity — [pricing docs](https://docs.perplexity.ai/docs/getting-started/pricing)


| Model       | Input $/1M | Output $/1M | Per-request fee (low context) |
| ----------- | ---------- | ----------- | ----------------------------- |
| `sonar-pro` | $3         | $15         | $0.006                        |
| `sonar`     | $1         | $1          | $0.005                        |


> **Watch:** the per-request fee is tiered by `search_context_size`.
>
> - Sonar Pro fast search: **low $0.006 / medium $0.010 / high $0.014** per request.
> - Sonar fast search: **low $0.005 / … / high $0.012** per request.
> - Sonar Pro with the **Pro Search auto-classifier** enabled: **$0.014–$0.022** per
> request on top of the same $3/$15 token rates.
>
> We currently bill as low-context in `DEFAULT_PERPLEXITY_REQUEST_FEE_USD`.
> If the generators ever pass `search_context_size: "medium" | "high"`, override
> via `PERPLEXITY_REQUEST_FEE_USD_JSON`.

### 1.2 Lovable AI Gateway — [pricing docs](https://docs.lovable.dev/integrations/ai)

Lovable states explicitly that gateway pricing equals the underlying provider
list price: *"The cost of using Lovable AI is exactly the same as going
directly to the LLM provider. There are no hidden fees."* Numbers below are
Google Gemini API list rates ([source](https://ai.google.dev/gemini-api/docs/pricing)).


| Model                           | Input $/1M | Output $/1M | Notes                                                                                 |
| ------------------------------- | ---------- | ----------- | ------------------------------------------------------------------------------------- |
| `google/gemini-2.5-flash`       | $0.30      | $2.50       | GA pricing since Aug 2025 (was $0.15 / $0.60 under preview tiered pricing).           |
| `google/gemini-3-flash-preview` | $0.50      | $3.00       | Released Dec 17, 2025. Batch/flex tier is half.                                       |
| `google/gemini-2.5-flash-lite`  | $0.10      | $0.40       | Current GA rate.                                                                      |
| `google/gemini-2.5-flash-image` | $0.30      | $30.00      | ~1,290 output tokens/image → ~$0.039 per 1024×1024 image. Batch mode ≈ $0.0195/image. |


### 1.3 Pricing drift policy

- Re-verify **quarterly** and whenever a provider posts a changelog entry.
- `DEFAULT_COST_MAP` in `supabase/functions/_shared/observe.ts` carries a
`last verified` comment next to the map — bump the date when you update.
- Treat all numbers in §3–§4 as **order-of-magnitude**; reconcile with the
provider dashboards per §8 before making capacity decisions.

---

## 2. Every AI-powered feature

Every row is protected by `guardAiFeature()` (feature flag + panic mode +
cost ceilings). Rows with "✓" for logging appear in the admin Cost tab's
per-feature breakdown. Logging is how per-user daily caps know anything was
spent — a row without logging still runs but cannot be capped per-user.


| Function                                          | Trigger                          | Provider / model(s)                                        | Logs `generation_attempts` | Fallback on block                          |
| ------------------------------------------------- | -------------------------------- | ---------------------------------------------------------- | -------------------------- | ------------------------------------------ |
| `holzen-reflect`                                  | user / cron (`check-volatility`) | Lovable `gemini-3-flash-preview` → `gemini-2.5-flash`      | ✓                          | Curated fallback pool                      |
| `companion-orchestrate` → signal                  | user / cron                      | Perplexity `sonar-pro` + Lovable `gemini-2.5-flash(-lite)` | ✓                          | Library → cache → curated                  |
| `companion-orchestrate` → grounding               | user / cron                      | Perplexity `sonar-pro` + Lovable `gemini-2.5-flash(-lite)` | ✓                          | Library → cache → curated                  |
| `companion-orchestrate` → history                 | user / cron                      | Perplexity `sonar-pro` + Lovable `gemini-2.5-flash(-lite)` | ✓                          | Cache → curated                            |
| `companion-orchestrate` → zoom-out                | user / cron                      | Lovable `gemini-2.5-flash(-lite)` (BTC prices from cache)  | ✓                          | Cache → curated                            |
| `companion-orchestrate` → intervention (question) | user / cron                      | Lovable `gemini-3-flash-preview`                           | ✓ (conditional)            | Skip question                              |
| `regenerate-only`                                 | user (targeted refresh)          | One of the above generators                                | ✓                          | 503 with reason                            |
| `journal-prompt`                                  | user                             | Lovable `gemini-2.5-flash`                                 | ✓                          | 503                                        |
| `suggest-grounding`                               | user                             | Perplexity `sonar` + Lovable                               | ✓                          | 503                                        |
| `suggest-ritual`                                  | user                             | Lovable `gemini-3-flash-preview`                           | ✓                          | Canned ritual template                     |
| `generate-wallpaper`                              | user (Pro)                       | Lovable `gemini-2.5-flash-image`                           | ✓                          | 503                                        |
| `night-reflection`                                | cron                             | Lovable `gemini-2.5-flash` → `gemini-2.5-flash-lite`       | ✓                          | Static localized fallback                  |
| `reflection-insights`                             | cron / user                      | Lovable Gemini                                             | ✓                          | Skip run / 503                             |
| `weekly-digest`                                   | cron                             | Lovable `gemini-2.5-flash-lite`                            | ✓                          | Digest email sent **without** AI insight   |
| `monthly-report`                                  | cron                             | Lovable `gemini-2.5-flash-lite`                            | ✓                          | Report email sent **without** AI paragraph |
| `grounding-enrich`                                | user                             | Lovable `gemini-2.5-flash` (cache hits skip)               | (via `createLogger`)       | 503                                        |
| `admin-library-preview`                           | admin                            | Lovable `gemini-2.5-flash-lite`                            | ✓                          | 503                                        |
| `pregenerate-companions`                          | cron                             | Perplexity + Lovable (same as orchestrate)                 | ✓                          | Skip run                                   |
| `fetch-source-feeds`                              | cron                             | Lovable + optional Perplexity                              | ✓                          | Skip run                                   |
| `personalized-nudge`                              | cron                             | **none** — CoinGecko + Lovable Email only                  | N/A                        | N/A                                        |
| `deliver-letters`                                 | cron                             | **none** — stored letters + push                           | N/A                        | N/A                                        |
| `holzen-number`                                   | user                             | **none**                                                   | N/A                        | N/A                                        |


---

## 3. Per-invocation cost estimates

Engineering estimates using midpoint token counts. Actuals vary with locale,
context length, and search depth. Use as order of magnitude only.

### 3.1 Per-call assumptions and arithmetic

| Call type | Assumed token profile | Formula | Estimated USD / call |
| --- | --- | --- | --- |
| Perplexity Sonar Pro (low context) | 1,200 in / 3,000 out | `(1200×3 + 3000×15)/1e6 + 0.006` | `~$0.0546` |
| Gemini 2.5 Flash structuring | 8,000 in / 600 out | `(8000×0.30 + 600×2.50)/1e6` | `~$0.0039` |
| Reflection (Gemini 3 Flash Preview) | 3,000 in / 500 out | `(3000×0.50 + 500×3.00)/1e6` | `~$0.0030` |
| Zoom-out deep-time (Gemini 2.5 Flash) | 10,000 in / 400 out | `(10000×0.30 + 400×2.50)/1e6` | `~$0.0040` |
| Wallpaper (Gemini image) | ~1,290 output tokens / image | `1290×30/1e6` (output-dominated) | `~$0.039` |

Perplexity remains the dominant per-call cost in pause generation, so the
`$60/day` global cap is mainly sizing against Sonar Pro volume.

### 3.2 Full pause build-up (all-live, all companions on)

| Piece | Formula | Estimated USD |
| --- | --- | --- |
| 3x companion search+structure (signal, grounding, history) | `3 × (0.0546 + 0.0039)` | `~$0.1755` |
| Zoom-out | `1 × 0.0040` | `~$0.0040` |
| Reflection | `1 × 0.0030` | `~$0.0030` |
| **Total all-live baseline** |  | **`~$0.1825` (round to `~$0.18`)** |

For capacity planning, this doc uses `~$0.21` as a realistic average when some
sessions incur retries, larger contexts, or heavier prompt payloads.

> Note: these Lovable-side numbers are ~2x higher than older internal
> estimates from before the 2026-04-19 pricing refresh. See §10 changelog.

---

## 4. Scenario modeling

Each scenario assumes Pro users (who consume AI) and excludes free-tier users
past their 3-pause/month cap. These are stress figures; the cache warmer, the
reflection_companions skip-cache path, and user behavior all cut real numbers
below them.

### 4.0 Shared assumptions

- Scenario baseline uses **2 full pauses / user / day**.
- Full-pause **all-live baseline** from §3.2 is `~$0.18`.
- Planning average is `~$0.21` (same flow + retry/context overhead).
- Stress upper bound for heavy retry/context windows is `~$0.24`.

| Per-pause assumption | Cost |
| --- | --- |
| All-live baseline (direct arithmetic) | `~$0.18` |
| Planning average (used for cap sizing) | `~$0.21` |
| Stress upper bound | `~$0.24` |

### 4.1 100 Pro DAU

- **Pauses.** `100 × 2 × $0.21 ≈ $42/day` (planning average).
- **Auxiliary AI (current observed usage envelope).** `~$2–3/day`.
- **Total (planning).** `~$44–45/day` or `~$1,320–$1,380/month`.
- **Stress note.** If auxiliary usage ramps materially (for example, heavier
  wallpaper or digest/report uptake), `~$48–52/day` remains a reasonable
  stress envelope.

### 4.2 1,000 Pro DAU

- **Pauses.** `1000 × 2 × $0.21 ≈ $420/day`.
- **Auxiliary (scaled planning envelope).** `~$20–30/day`.
- **Total (planning).** `~$440–450/day` or `~$13,200–$13,500/month`.
- **Stress note.** `~$480–520/day` is still plausible under high auxiliary
  uptake or poor cache hit rates.

### 4.3 10,000 Pro DAU

Infeasible without substantially higher cache hit rates (>70%), tighter
per-user ceilings, and a provider contract. The doc exists so nobody can
say we didn't see it coming.

### 4.4 What caps actually stop

The current defaults in `app_config` (`$60` daily global / `$2.5` daily
per-user / `$1,800` monthly global) map to roughly:

- **~285 all-live pauses/day globally** (`$60 / ~$0.21`)
- **~11 all-live pauses/day for a single user** (`$2.5 / ~$0.21`)

This is a growth-ready operating envelope for the Flex-credit model, while
still preserving hard backstops. Raise caps intentionally (not reactively)
when spend bars stay elevated and conversion economics remain healthy.

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
6. **Circuit breakers** — per-provider auto-trip when error rate is elevated.
   See §5.2 below.
7. **Per-user rate limit** — `checkRateLimit`, 30 AI events/60 min. Applies
   to the orchestrator and its event allowlist only; see
   `supabase/functions/_shared/ratelimit.ts`.
8. **Provider 402 / 429** — last-resort failure handling returns the feature's
   natural fallback (curated pool, canned template, silent no-op).

### 5.2 Circuit breakers

Implemented in `supabase/functions/_shared/circuit-breaker.ts`. Two
independent breakers (`perplexity`, `lovable`) computed on the fly from
`generation_attempts` with a 30-second per-Edge-instance cache.

**Trip rule:** a provider is marked `degraded` when, in the last 10 minutes,
its error rate is ≥ 30% **and** it has ≥ 10 completed calls. The sample-size
gate is important — we never trip on "3 of 3 failed" because that isn't
statistically meaningful and a retry probably works.

**What "error" means here:** `status IN ('error', 'timeout', 'rate_limited')`.
**Not counted:** `quality_gate_failed` (that's a content issue, not a provider
health issue — a prompt regression shouldn't trip the breaker).

**Scope when tripped:**

| Breaker tripped | Affected generators | Behavior |
|---|---|---|
| `perplexity` | Signal, Grounding, History | Skip the live Perplexity + Lovable structuring step. Library + cache + curated fallback still serve. |
| `lovable` | Signal, Grounding, History, Zoom-Out, Intervention, Reflection, + all non-companion AI features | Same: skip live phase; cache/library/fallback still serve. Reflection falls back to the curated pool. |

**Cached serves are completely unaffected.** Rows already written to
`reflection_companions`, `companion_cache` hits, and `content_library` hits
all keep serving. Only *new* live generation is skipped for the duration
of the trip.

**Regeneration (user-initiated):** when a user explicitly taps "regenerate"
and the relevant breaker is tripped, `regenerate-only` returns a 503 with
`tripped: 'breaker_<provider>'` instead of silently serving cache. The
client UI can show a "provider having issues, try again in a few minutes"
message.

**Recovery:** automatic. The breaker recomputes on every call (after the
30 s instance-cache TTL expires). When new successes push the rolling 10-min
error rate below 30%, the provider state flips back to `ok` and live
generation resumes.

**Admin visibility:** `/admin → Cost` shows a live "Provider health" card
with the state, error rate, and sample count per provider. Auto-refreshes
every 30 s.

**Tuning:** if the defaults are too aggressive (false trips during normal
small-sample windows) or too loose (didn't trip during a real incident),
change the constants in `circuit-breaker.ts`. Not yet exposed as
`app_config` — provider-health tuning should be a deliberate code change
so we don't accidentally trip during an incident because someone edited
a threshold.

### 5.1 Where each cap is enforced today


| Path                     | Global daily | Per-user daily | Monthly | Panic mode        | Feature flag            |
| ------------------------ | ------------ | -------------- | ------- | ----------------- | ----------------------- |
| `companion-orchestrate`  | ✓            | ✓              | ✓       | ✓                 | (per generator)         |
| `regenerate-only`        | ✓            | ✓              | ✓       | ✓                 | —                       |
| `holzen-reflect`         | ✓            | ✓              | ✓       | **✗ (by design)** | —                       |
| `journal-prompt`         | ✓            | ✓              | ✓       | —                 | `journal_prompt`        |
| `suggest-grounding`      | ✓            | ✓              | ✓       | —                 | `suggest_grounding`     |
| `suggest-ritual`         | ✓            | ✓              | ✓       | —                 | `suggest_ritual`        |
| `generate-wallpaper`     | ✓            | ✓              | ✓       | —                 | `wallpaper`             |
| `grounding-enrich`       | ✓            | ✓              | ✓       | —                 | `grounding_enrich`      |
| `admin-library-preview`  | ✓            | ✓              | ✓       | —                 | `admin_library_preview` |
| `night-reflection`       | ✓            | —              | ✓       | —                 | `night_reflection`      |
| `weekly-digest`          | ✓            | —              | ✓       | —                 | `digest`                |
| `monthly-report`         | ✓            | —              | ✓       | —                 | `reports`               |
| `reflection-insights`    | ✓            | —              | ✓       | —                 | `reflection_insights`   |
| `pregenerate-companions` | ✓            | —              | ✓       | ✓                 | `pregenerate`           |
| `fetch-source-feeds`     | ✓            | —              | ✓       | —                 | `fetch_source_feeds`    |


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

### 7.5 Daily cost alert email

`supabase/functions/ai-cost-alert` fires a single email when one or more of:

| Trigger | Default threshold | Setting in `app_config` |
|---|---|---|
| Yesterday's global spend ≥ *X*% of `budget_daily_usd_global` | 70% | `ai_cost_alert_daily_threshold_pct` |
| Yesterday's spend ≥ *N*× the 7-day average | 1.8× | `ai_cost_alert_wow_multiplier` |
| Month-to-date projection > `budget_monthly_usd_global` | — | (always on) |

**Setup:**

1. Open `/admin → Tools → Daily cost alert email`.
2. Enable the master switch.
3. Add recipient addresses (comma-separated). Empty list = no email sent.
4. Leave thresholds at defaults unless you know your burn pattern.
5. Schedule the cron: point Supabase scheduled functions (or pg_cron) at
   `POST /functions/v1/ai-cost-alert` with the service-role key or
   `CRON_SECRET` in `Authorization`. Daily at **08:00 UTC** is the intended
   cadence; the function always looks at *yesterday UTC* so the dispatch
   time within the day doesn't matter.
6. Verify by running the function once manually; it logs either
   `ai-cost-alert: no triggers` or `ai-cost-alert: alert sent` with the
   numbers.

**When an alert fires:**

1. Open the email — it lists which triggers fired, yesterday's spend,
   7-day average, month-to-date, projected monthly, and top-3 users +
   features.
2. Follow §7.1 runbook from there.

**When an alert doesn't fire but you think it should:** check the scheduled
function actually ran (Supabase logs filter `holzen:ai-cost-alert`). A
`skipped: disabled` or `skipped: no_recipients` line means the Tools tab
config needs attention.

---

## 8. Recommended provider auto top-up

Philosophy: small automated top-ups so a buggy cron can't blow 4-figure sums
overnight, with monthly caps sized at roughly 2× current scale so we hit our
engineering cap first, not the provider cap.

### 8.1 Perplexity (Billing → Auto Reload)


| Setting                   | Value    |
| ------------------------- | -------- |
| Reload when balance below | **$50**  |
| Reload amount             | **$150** |
| Monthly spend cap         | **$1,200** |


Each $150 top-up buys ~750 Sonar Pro calls at the current midpoint. The
$1,200 cap keeps provider billing aligned with the new engineering monthly cap,
while still limiting blast radius during abnormal traffic.

### 8.2 Lovable AI (Workspace → Cloud & AI balance → Auto top-up)


| Setting                   | Value    |
| ------------------------- | -------- |
| Reload when balance below | **$30**  |
| Reload amount             | **$90**  |
| Monthly spend cap         | **$600** |


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

- `[docs/systems/costs/pricing-strategy.md](./pricing-strategy.md)` — final
pricing/package strategy derived from this cost model (plan limits, add-ons,
and sustainability thresholds).
- `[docs/systems/pause/pause-session-cost-estimates.md](../pause/pause-session-cost-estimates.md)`
— pause-only case study. Still valid for that narrow scope; this doc is
the superset.
- `[docs/ops/deployment-sync-guide.md](../../ops/deployment-sync-guide.md)`
— pre-push checklist. Add a note to re-run the cost estimates whenever
`DEFAULT_COST_MAP` or new edge functions land.
- `supabase/migrations/20260419120000_app_config.sql` — schema for caps + flags.
- `supabase/functions/_shared/app-config.ts` — loader with TTL cache.
- `supabase/functions/_shared/ratelimit.ts` — `checkCostCeilings` + `guardAiFeature`.
- `supabase/functions/_shared/subscription-entitlements.ts` — package limits + flex credit helpers.
- `supabase/functions/stripe-webhook/index.ts` — Stripe checkout pack grants to flex wallet.
- `src/components/admin/AppConfigTools.tsx` — Admin Tools UI.
- `src/components/admin/CostAnalytics.tsx` — Admin Cost tab.
- `supabase/functions/ai-cost-alert/index.ts` — daily alert email (§7.5).
- `supabase/migrations/20260419150000_ai_cost_alert_config.sql` — alert config seed.
- `supabase/functions/_shared/circuit-breaker.ts` — per-provider breakers (§5.2).
- `src/components/admin/ProviderHealthCard.tsx` — live breaker state in Admin Cost tab.

---

## 10. Changelog

- **2026-04-21:** Corrected scenario-model arithmetic language and added
  explicit per-call/per-pause tables in §3–§4. Reflection midpoint corrected
  to `~$0.003` (from `~$0.004`), and scenario totals now separate planning
  baseline (`~$0.21/pause`) from stress envelope.
- **2026-04-19 (evening):** Added per-provider circuit breakers (§5.2) +
  MRR / AI-cost ratio card on the Cost tab. Breakers skip **live** generation
  only; cache + library + curated fallback still serve. Regenerate surfaces
  a clear 503 when tripped. Added unit tests for the breaker math.
- **2026-04-19 (end of day):** Added `ai-cost-alert` daily email function + admin
  config (recipients, threshold %, WoW multiplier) + runbook §7.5.
- **2026-04-19 (later that day):** Pricing verification pass against Perplexity
and Google docs (via Context7). Updated `DEFAULT_COST_MAP` to current GA
rates:
  - `gemini-2.5-flash`: `[0.15, 0.60]` → `**[0.30, 2.50]`** (GA, Aug 2025).
  - `gemini-3-flash-preview`: `[0.15, 0.60]` → `**[0.50, 3.00]**` (released Dec 2025).
  - `gemini-2.5-flash-lite`: `[0.075, 0.30]` → `**[0.10, 0.40]**`.
  - Perplexity, `gemini-2.5-flash-image`: unchanged.
  Pre-drift doc had underestimated Lovable-side spend by ~2×. Scenario totals,
  per-pause arithmetic, and ceiling-math updated to match.
- **2026-04-19:** Initial version. Supersedes pause-only estimates doc as
canonical. Covers all 17 AI-touching edge functions. Adds guardrail map,
scenario bounds, runbooks, auto top-up recommendations.

