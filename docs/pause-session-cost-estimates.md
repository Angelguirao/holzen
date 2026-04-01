# Pause session API cost estimates

This document estimates **third-party API spend** for a Holzen pause session when content is **live-generated** (no companion cache hits, no curated fallbacks). It ties numbers to [Perplexity Sonar API pricing](https://docs.perplexity.ai/docs/getting-started/pricing) and [Lovable AI / Cloud usage billing](https://docs.lovable.dev/integrations/ai), and to how the repo actually calls those services.

**Not included here:** Lovable **workspace subscription**, **Cloud hosting** (database compute, egress, instance size), **Supabase** plan fees, **Stripe**, email (Resend), push (VAPID), or CoinGecko usage inside `check-volatility`. Those are real costs but are billed on different dashboards. Lovable documents Cloud vs AI balance separately in [Usage-based Cloud and AI pricing](https://docs.lovable.dev/integrations/cloud#usage-based-cloud-and-ai-pricing).

**Admin “Cost” card** in `/admin` sums `generation_attempts.estimated_cost_usd` (see `v_companion_cost_per_day`). That uses the same **token + Per-request fee** model as `supabase/functions/_shared/observe.ts`; it is an **estimate**, not an invoice. Question-mode generation (`generateQuestion`) does **not** currently log `generation_attempts`, so a small slice of Lovable usage can be missing from that dashboard.

---

## 1. What runs, and when

### 1.1 Reflection step (message + optional haiku)

- **Manual path:** `holzen-reflect` → `generateUnifiedReflection` → Lovable AI Gateway `https://ai.gateway.lovable.dev/v1/chat/completions`.
- **Automatic path:** `check-volatility` calls the **same** `generateUnifiedReflection` inline after inserting `pause_ai_call` (parity with manual).

Models tried (in order): `google/gemini-3-flash-preview`, then `google/gemini-2.5-flash` on failure (`reflection-generate.ts`).

### 1.2 Companion step (Signal, Grounding, History, Zoom Out)

- **Client:** `use-companion-data` invokes `companion-orchestrate` when the user reaches the reflect/companion UI and cached rows are missing.
- **Automatic pause:** `check-volatility` POSTs `companion-orchestrate` with service auth after inserting the reflection row.

Generators (in `supabase/functions/_shared/generators/`):

| Companion        | Perplexity (`sonar-pro`) | Lovable / Gemini (structuring or deep-time) |
|-----------------|---------------------------|-----------------------------------------------|
| **Signal**      | Yes; 1–3 chat calls possible (retries without domain filter / wide search) | Yes; `google/gemini-2.5-flash` → `google/gemini-2.5-flash-lite` |
| **Grounding**   | Yes; 1–2 calls (retry without domain filter) | Same Gemini pair as Signal |
| **History**     | Yes; 1 call typical       | Same Gemini pair |
| **Zoom Out**    | No (BTC prices from `btc_price_cache`, filled by `refresh-btc-prices`) | Same Gemini pair for deep-time JSON |

**Intervention question mode** adds another Lovable call (`google/gemini-3-flash-preview`) from `generateQuestion.ts`; it is **not** logged to `generation_attempts` today.

Default profile flags used when automatic pause runs (`check-volatility`): `companion_signal`, `companion_grounding`, `companion_history`, `companion_zoom_out` default to **true** unless the user turned them off.

---

## 2. Pricing inputs (external docs)

### 2.1 Perplexity Sonar Pro

From [Perplexity pricing — Sonar API](https://docs.perplexity.ai/docs/getting-started/pricing):

- **Token pricing:** **$3 / 1M input**, **$15 / 1M output** (Sonar Pro).
- **Request fee (on top of tokens):** depends on **search context size**. For **low** context, Sonar Pro is **$6 per 1,000 requests** → **$0.006 per request** (table “Request Pricing by Search Context Size”).
- **Total per query** = token cost + request fee (same page: “Total cost per query = Token costs + Request fee”).

Holzen’s `observe.ts` uses the same order of magnitude: `sonar-pro` → `[3, 15]` per 1M tokens and **$0.006** per request (`DEFAULT_PERPLEXITY_REQUEST_FEE_USD`). If the API uses **medium** or **high** search context, Perplexity’s per-request fee is higher ($0.010 or $0.014 per request for Sonar Pro); the code does not model that unless you set `PERPLEXITY_REQUEST_FEE_USD_JSON`.

### 2.2 Lovable AI (Gemini via gateway)

[Lovable AI — Usage and pricing](https://docs.lovable.dev/integrations/ai) states usage-based AI is billed like the **underlying provider**; [Cloud & AI balance](https://docs.lovable.dev/integrations/cloud#usage-based-cloud-and-ai-pricing) is where workspace AI spend accrues.

Holzen maps Gemini-style models in `observe.ts`, e.g. `google/gemini-2.5-flash` → **$0.15 / 1M input**, **$0.60 / 1M output** (defaults; override with `COST_MAP_OVERRIDE` if your contract differs).

---

## 3. Cost model (per call)

**Perplexity Sonar Pro (one successful chat completion, low context):**

\[
\text{USD} \approx \frac{\text{prompt\_tokens}}{10^6}\times 3 + \frac{\text{completion\_tokens}}{10^6}\times 15 + 0.006
\]

**Gemini via Lovable (one successful completion, using observe defaults for 2.5 Flash):**

\[
\text{USD} \approx \frac{\text{prompt\_tokens}}{10^6}\times 0.15 + \frac{\text{completion\_tokens}}{10^6}\times 0.60
\]

Use **$0.15 / $0.60** for `google/gemini-3-flash-preview` in code defaults as well; provider list pricing may drift—treat as **approximate**.

---

## 4. Representative token assumptions (live generation)

Exact tokens vary with language, context length, and search results. Round numbers below are **engineering estimates** for order-of-magnitude only.

| Step | Assumed input tokens | Assumed output tokens | Notes |
|------|----------------------|------------------------|--------|
| Reflection (one successful model) | 2,500–4,000 | 350–600 | Large system prompt + user context + JSON |
| Perplexity per companion search | 800–1,500 | 2,000–4,000 | Long search-backed body + citations |
| Gemini structuring (signal / grounding / history) | 5,000–12,000 | 400–900 | Search text pasted into user message |
| Zoom Out deep-time | 1,200–2,000 | 200–400 | Shorter JSON |

---

## 5. Estimated cost per live session

### 5.1 Reflection only (user or cron generates message/haiku)

Using **Gemini 3 Flash preview** defaults (~3k in, 500 out):

- Token part: \(3000\times 0.15 + 500\times 0.60\) / 1e6 ≈ **$0.00075** (plus a second attempt if the first fails).

**Order of magnitude: well under one cent** per successful reflection, unless prompts grow much larger or models change.

### 5.2 Per companion (each live path, “happy path” 1× Perplexity + 1× Gemini success)

Example midpoint: **1,200** in / **3,000** out on Sonar Pro, **8,000** in / **600** out on Gemini 2.5 Flash:

- **Perplexity:** \(1200\times 3 + 3000\times 15\) / 1e6 + 0.006 ≈ **$0.0546**
- **Gemini structuring:** \(8000\times 0.15 + 600\times 0.60\) / 1e6 ≈ **$0.00156**

So **~$0.055–0.06 API** per companion that uses Perplexity + structuring, **before** retries.

**Zoom Out (live):** only the Gemini deep-time call → typically **$0.001–0.004** with the assumptions above.

### 5.3 Full pause: reflection + all four companions enabled (all live)

Rough **sum** (happy path, 1 Perplexity call each for Signal, Grounding, History; no Signal wide retry):

| Piece | Approx. API USD |
|-------|-----------------|
| Reflection | ~0.001 |
| Signal | ~0.056 |
| Grounding | ~0.056 |
| History | ~0.056 |
| Zoom Out | ~0.003 |
| **Total** | **~$0.17–0.22** |

If **Signal** hits **3** Perplexity requests (retries) and **Grounding** hits **2**, add roughly **2× ~$0.055** extra → total moves toward **~$0.28–0.38**. If search context is **medium/high**, add **$0.004–0.008** per extra Perplexity request vs low.

**Question mode** adds roughly **$0.0005–0.002** per session (still small vs Sonar Pro).

---

## 6. “Pro user”, sensitive thresholds, cron every 15 minutes

### 6.1 What the product actually limits

- **`check-volatility`** is often scheduled **every 15 minutes** (see [cron-setup.md](./cron-setup.md)), but that only **evaluates** users; it does **not** mean one new pause per user every 15 minutes.
- **Automatic** pauses require thresholds **and** passing **`last_trigger_at` + `cooldown_hours`** (default **6 hours** in `check-volatility` when `last_trigger_at` is set). So in the worst **sustained** volatile market, expect on the order of **~4 automatic full generations per user per day**, not 96.
- **Manual** pauses: each full flow does **reflection** (`pause_ai_call`) + **orchestrate**. `companion-orchestrate` uses `checkRateLimit` (**30** allowlisted AI events per **60** minutes per user). That caps **combined** frequency with other features that emit the same events (see `ratelimit.ts` allowlist).

So “unlimited pauses” in product terms still has a **practical ceiling** from rate limits and from how often a user actually completes sessions.

### 6.2 Scenario: thresholds at 1% (up/down) and 3% cumulative

With **1%** daily and **3%** cumulative, users enter the eligible pool **often** while the market moves. **Cooldown** remains the main brake on **automatic** repeat cost.

**Worst-case automatic (illustrative):**

- 4 full sessions/day × **~$0.20** API ≈ **~$0.80/day** ≈ **~$24/month** API per user **if** every automatic run is all-live and all companions stay on.

**Worst-case manual (illustrative, rate-limit bound):**

- **30** sessions/hour × 16 waking hours is not realistic; if you assume **30** full live sessions in a rolling hour (the orchestrator limit), API cost ≈ 30 × **$0.20** ≈ **$6/hour** for that hour—again **before** cache, fallbacks, or user actually hitting the limit every hour.

Use these as **stress bounds**, not typical behavior.

### 6.3 “Manual every 15 minutes” vs BTC refresh

The **15-minute** cadence in ops docs is the **volatility cron** schedule and aligns with how often **eligibility** is re-checked. It is **not** the same as a user tapping “pause” every 15 minutes. **BTC spot prices** for Zoom Out are maintained on a separate schedule (`refresh-btc-prices`; comments in `zoom-out.ts` refer to ~15 minute freshness).

---

## 7. How to reconcile with real bills

1. **Perplexity:** Use the provider dashboard for **actual** Sonar Pro token and request/context charges.
2. **Lovable:** Use **Settings → Cloud & AI balance** for **AI** line items ([docs](https://docs.lovable.dev/integrations/cloud#usage-based-cloud-and-ai-pricing)).
3. **Holzen Admin:** Compare trends in **Cost** to `generation_attempts`; tune `COST_MAP_OVERRIDE` / `PERPLEXITY_REQUEST_FEE_USD_JSON` if your negotiated rates differ.

---

## 8. Changelog

- **2026-04-01:** Initial version (estimates + code pointers; pricing cites Perplexity + Lovable docs as of that date).
