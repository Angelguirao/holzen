# Pregenerate companions (cache warmer)

**Pregenerate Companions** is the background job that **maintains and grows** the shared `companion_cache` table so `companion-orchestrate` can often serve **Signal**, **Grounding**, **History (Look Back)**, and **Zoom Out (deep time)** from the **cache** phase of the phase stack (see [phase config](../../../../supabase/functions/_shared/phase-config.ts) and [content library pipeline](../../../../supabase/functions/_shared/content-library.ts): library → **cache** → live AI → curated).

It is **not** the same as a user tap or cron calling `companion-orchestrate` with multiple slots; pregenerate only **inserts pool rows** (and adjusts scores). **Haiku** is not pregenerated here.

## Is it “working”?

Yes, as an implemented and deployed path:

- **Edge function:** `supabase/functions/pregenerate-companions/index.ts` — HTTP handler wrapped in `withRequestLogging`, logged as `fn: pregenerate-companions`.
- **Schedule:** `pg_cron` posts to the function URL (project-specific URL in migrations; typical schedule is every **6 hours** — see [cron-setup.md](../../../ops/cron-setup.md) § “Cache Warmer” and [observability-setup.md](../../../ops/observability-setup.md) for heartbeat).
- **Auth:** `verifyServiceAuth` — `Authorization: Bearer` must be **service role** or **`CRON_SECRET`** (same pattern as other cron workers; see [cron-worker-auth-consistency.md](../../../backlog/cron-worker-auth-consistency.md)).
- **Secrets:** Requires **`PERPLEXITY_API_KEY`** and **`LOVABLE_API_KEY`** on the edge runtime. Missing keys → **500** with `{ error: "Missing API keys" }`.
- **Kill switches:** `guardAiFeature(svcClient, "pregenerate", { providers: ["perplexity", "lovable"] })` in `_shared/ratelimit.ts` — if the **`pregenerate`** app-config flag is off, daily budget / panic mode blocks, etc., the function returns **200** with `{ skipped: true, reason: "..." }` and does not burn APIs.
- **Top-up targets (tunable):** `app_config.pregenerate_cache_topup` — per `companion_type`, **min** count of *healthy* rows (`quality_score` ≥ 2, not expired) and **max** new rows to attempt per cron. Loaded via `loadAppConfig` (~30s cache on edge). Editable in **Admin → Tools** (“Pregenerate cache top-up”) without redeploy. Defaults are seeded in `20260425120000_app_config_pregenerate_cache_topup.sql`.

## What one run does (high level)

1. **Cache lifecycle (smart `companion_cache` housekeeping)**  
   - Promote **quality_score ≥ 3** to permanent (`expires_at = null`).  
   - Auto-promote **quality_score ≥ 2** and **used_count ≥ 3** similarly (bump score to 3).  
   - **Prune** low quality (**&lt; 2**) older than **3 days**.  
   - **Expire** non-permanent medium rows older than **30 days** (still below permanent threshold).

2. **Warm the pool (English `en` rows) — need-based:** for each type, the cron counts healthy rows; if count is below the configured **min**, it generates up to **max** new rows (per type) this run, with short delays between API-heavy steps. **0** max disables generation for that type. In practice: **Grounding** — Perplexity `sonar-pro` (academic) → Lovable `return_grounding_nudge` tool; **Signal** — Perplexity → Lovable `return_signal`; **History** — Perplexity → Lovable JSON; **Zoom out deep time** — Lovable only. Exact per-run counts appear in the JSON `results` as a `Top-up plan:` line.

3. **Dedup:** Inserts are skipped when `isCompanionCacheDuplicate` / fingerprints match existing cache (logs may show `SKIPPED duplicate` in results). See [cache-dedup-near-duplicates.md](../../../backlog/cache-dedup-near-duplicates.md).

4. **Quality nudges from feedback:** Last **24h** of `analytics_events` where `event = 'companion_feedback'`; aggregates up/down per `metadata.cache_id` and clamps `quality_score` to **0–3**.

5. **Observability:** `generation_attempts` / `logAttempt` records provider usage; structured logs use `holzen_event: pregenerate_companions_cron`.

## How that connects to a real pause

When a user (or service job) invokes **`companion-orchestrate`**, the generators in `_shared/generators/{signal,grounding,history,zoom-out}.ts` can **read** matching rows from `companion_cache` according to [phase-config](../../../../supabase/functions/_shared/phase-config.ts). Pregenerate **feeds** that pool; it does not write to `pause_ai_artifacts` by itself.

**Admin:** Companion cache table and hints about the warmer appear in the admin surface ([Admin.tsx](../../../../src/screens/admin/AdminScreen.tsx) copy references `pregenerate-companions`).

## Ops and cost

- **Bruno manual invoke:** [bruno/service-cron/pregenerate-companions.bru](../../../../bruno/service-cron/pregenerate-companions.bru) — `SERVICE_CRON_BEARER`.  
- **AI cost model:** [ai-cost-model.md](../../costs/ai-cost-model.md) (pregenerate is cron; can skip when gated).  
- **Broader pause context:** [ai-powered-pause-system.md](../ai-powered-pause-system.md) §10 (background jobs).

For **creating or adjusting the cron job and heartbeats** in a database, use [cron-setup.md](../../../ops/cron-setup.md) and the heartbeat backlog / SQL in `docs/backlog/pg-cron-heartbeat-*.md` rather than duplicating project URLs in this file.
