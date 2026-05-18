# Phase 4: Cron workers, caching, and content pipelines review

> **Pre-strip / security reference (2026-05).** `content_library` / `fetch-source-feeds` are legacy; shipped companions: cache → live → curated per [active-surface.md](../ops/active-surface.md).

This phase is the fourth "mental model pass": after Phase 3 (`check-volatility` and automatic pause), we review **other scheduled edge workers** that **warm caches** and **fill content libraries** so companion generation, Zoom Out, and Signal/Grounding have cheap inputs at user time. These workers are not the volatility trigger; they **feed** the pause ecosystem.

If these workers drift (stale prices, bad dedup, permissive auth), you get wrong Zoom Out numbers, bloated caches, or noisy duplicates — often **before** Phase 5 quality gates run.

## Table of Contents

- [What to understand first (priority)](#what-to-understand-first-priority)
- [Mental Models & Useful Concepts](#mental-models--useful-concepts)
- [CS/SE Concepts to Know (for this phase)](#csse-concepts-to-know-for-this-phase)
- [Reviewed starting points (file-by-file)](#reviewed-starting-points-file-by-file)
- [Runtime touchpoints: endpoints, events, and side effects](#runtime-touchpoints-endpoints-events-and-side-effects)
- [Data models affected](#data-models-affected)
- [Systems that emerge from this review](#systems-that-emerge-from-this-review)
- [Reviewer Questions Checklist](#reviewer-questions-checklist)
- [Conclusions and Tradeoffs](#conclusions-and-tradeoffs)
- [What to Review Next and Why](#what-to-review-next-and-why)

## What to understand first (priority)

1. **Separation from Phase 3**: `refresh-btc-prices`, `fetch-source-feeds`, and `pregenerate-companions` run on their own schedules; they do not replace `check-volatility`.
2. **Price cache for Zoom Out**: `btc_price_cache` is populated so user sessions avoid hitting CoinGecko for historical "on this day" paths.
3. **Content library for Signal/Grounding**: `fetch-source-feeds` ingests from `signal_sources` into `content_library` for curated-style cards.
4. **Companion cache warm pool**: `pregenerate-companions` maintains `companion_cache` quality tiers, pruning, and feedback-driven score adjustments.

## Mental Models & Useful Concepts

- **Background producers**: workers run on cron/service role; **users** consume rows via edge functions and UI — eventual consistency between worker run and next user request.
- **Cache vs source of truth**: `btc_price_cache` and `companion_cache` are **performance** layers; companion orchestration still may generate fresh content when cache misses.
- **Dedup strategy shapes growth**: exact title dedup vs fuzzy title similarity — different false-negative rates for "near duplicate" content.
- **Cron auth**: `docs/ops/cron-setup.md` and Vault-backed `net.http_post` should send **`Authorization: Bearer …`** (service role or `CRON_SECRET`); do not rely on `x-supabase-cron` as auth on public Edge URLs.

## CS/SE Concepts to Know (for this phase)

- **TTL and freshness**: historical BTC rows refresh when missing or older than policy thresholds; correctness depends on cron cadence.
- **Idempotency and dedup**: insert paths must tolerate retries without unbounded duplicate rows (title checks, similarity checks).
- **Resource protection**: rate limits to external APIs (e.g. delays between CoinGecko calls).
- **Garbage collection**: cache lifecycles (promote/prune/expire) — classic cache policy problem.

## Reviewed starting points (file-by-file)

### `supabase/functions/refresh-btc-prices/index.ts` — Zoom Out price dependency

- Scheduled (cron ~15 minutes per `docs/ops/cron-setup.md`).
- Keeps `btc_price_cache` fresh so Zoom Out does not call CoinGecko during user sessions.
- **Auth**: `Authorization: Bearer <service_role>` or `CRON_SECRET` ([`verifyServiceAuth`](../../supabase/functions/_shared/auth.ts)).
- **Logs**: structured JSON — **`"fn":"refresh-btc-prices"`**; stable **`msg`** tokens such as **`refresh_btc_current`**, **`refresh_btc_historical`**, **`refresh_btc_complete`** (see [logging-strategy.md](../ops/logging-strategy.md)).
- **Writes**: upsert current daily key; upsert historical "on this day" prices (1–10 years ago; `btc-on-this-day-config.ts`) when missing or older than 24h.
- **Rate pressure**: ~2s delay between CoinGecko calls.

### `supabase/functions/fetch-source-feeds/index.ts` — active content library

- Reads `signal_sources.url` (and related config); scrapes via Firecrawl when configured, else Perplexity fallback; structures entries via Lovable AI gateway into `content_library`.
- **Auth**: `SERVICE_CRON_BEARER` / `verifyServiceAuth` (service role or `CRON_SECRET`).
- **Logs**: structured JSON — **`"fn":"fetch-source-feeds"`**; grep **`fetch_feeds_`** in **`msg`** / **`holzen_event`** (see [content-library-fetch-source-feeds.md](../systems/content-library-fetch-source-feeds.md)).
- **Inserts**: `companion_types` mapping (`signal` vs `ground_nudge`), title/summary/citation/url/tags, `quality_score: 2`.
- **Dedup**: exact `title` match against existing `content_library` before insert.

### `supabase/functions/pregenerate-companions/index.ts` — companion_cache lifecycle

- Periodic fill of `companion_cache` with high-quality payloads; processes `companion_feedback` via `analytics_events`.
- **Auth**: Bruno **`SERVICE_CRON_BEARER`** (service_role JWT or `CRON_SECRET`); Edge: [`verifyServiceAuth`](../../supabase/functions/_shared/auth.ts).
- **Logs**: structured JSON — **`"fn":"pregenerate-companions"`** (request **`log`** from **`withRequestLogging`**).
- **Lifecycle**: promote high-quality entries to permanent (`expires_at = null`); prune low-quality after 3 days; expire medium tiers after 30 days.
- **Generation loop**: **need-based** top-up per type (targets in `app_config.pregenerate_cache_topup`); when below target, may run Perplexity + Lovable (or Lovable-only for deep-time zoom) to insert into `companion_cache` — this path does **not** call `companion-orchestrate`; dedup via title/URL/body vs existing cache rows. See [pregenerate.md](../systems/pause/companions/pregenerate.md).
- **Feedback**: last 24h feedback events adjust `quality_score` within [0..3].

### `docs/ops/cron-setup.md`

- Schedules and HTTP call patterns for these workers alongside `check-volatility`.

## Runtime touchpoints: endpoints, events, and side effects

- **Scheduled HTTP**: pg_cron (or equivalent) POSTs to each edge function URL with documented headers/secrets.
- **External APIs**: CoinGecko (`refresh-btc-prices`); Firecrawl / Perplexity / Lovable gateway (`fetch-source-feeds`); AI generation inside `pregenerate-companions`.
- **No direct user browser invoke** in normal flows — all three are worker-oriented.

## Data models affected

- **`btc_price_cache`**: daily and historical "on this day" rows for Zoom Out.
- **`content_library`**: ingested articles/snippets for Signal/Grounding-style consumption.
- **`signal_sources`**: feed URLs and metadata (read by `fetch-source-feeds`).
- **`companion_cache`**: pregenerated companion payloads, quality scores, expiry.
- **`analytics_events`**: `companion_feedback` (or equivalent) for score adjustments in `pregenerate-companions`.

## Systems that emerge from this review

1. **Pause system (architecture)**: `docs/systems/pause/ai-powered-pause-system.md`
   - These workers are **inputs** to companion and Zoom Out behavior described there.

2. **Ops / cron**: `docs/ops/cron-setup.md`
   - Operational schedule and security for invoking workers.

## Reviewer Questions Checklist

1. Does each worker's auth gate match how cron actually calls it (Bearer + Vault / secrets)?
2. Are dedup keys stable if prompts or titles change slightly (exact title vs similarity)?
3. Is `btc_price_cache` fresh enough for Zoom Out given the 24h historical refresh rule and cron cadence?
4. Can `pregenerate-companions` prune or promote in a way that surprises users (empty cache, sudden drops)?
5. **Cache → UI**: trace one path (Zoom Out reads `btc_price_cache`; companions prefer `companion_cache` then fall back) — does the UI handle empty cache gracefully?

## Conclusions and Tradeoffs

- **Coherent story**: three workers **warm** price data, **ingest** library content, and **maintain** a companion cache pool — each reduces latency or API load at user time.
- **Risks** (folded from prior "risks / validate"):
  - **Dedup vs near-duplicates**: exact title dedup in `fetch-source-feeds` and similarity dedup in `pregenerate-companions` can both miss "almost the same" rows if titles drift; caches can grow. Backlog: `docs/backlog/cache-dedup-near-duplicates.md`.
  - **Auth consistency**: workers use **`verifyServiceAuth`** + Bearer only; cron SQL must send a real secret (see `docs/backlog/cron-worker-auth-consistency.md`).
  - **Timing windows**: historical BTC snapshots depend on cron cadence + "older than 24h" semantics; **on this day** accuracy is bounded by that policy. Backlog: `docs/backlog/btc-price-cache-freshness.md`.

Tradeoffs / alternatives:

- **Stricter dedup** (hash body, URL, normalized title) vs **fewer false merges** — more compute, less duplicate content (see `cache-dedup-near-duplicates.md`).
- **More frequent cron** vs **API rate limits** — higher cost, fresher data (see `btc-price-cache-freshness.md`).
- **Larger cache warm pool** vs **storage and generation cost** — product decision.

## What to Review Next and Why

**Phase 5** moves from **scheduled data producers** to **shared policy** inside edge functions: **rate limiting**, **daily budget**, **quality gates**, and **cache serve/write helpers** (`ratelimit.ts`, `quality.ts`, `cache.ts`, `companion-data.ts`). That is the natural next step because:

1. Phase 4 showed **where** cached and library data **comes from**; Phase 5 shows **how** generation is **bounded and rejected** when quality or cost limits fail.
2. Companion orchestration and manual/cron paths **reuse** these shared modules; Phase 5 connects worker output (Phase 4) to **runtime guardrails**.

**Phase 5 scope (pointer):**

- Shared `_shared` modules for rate limit, quality, cache, companion writes — see `docs/reviews/phase-5-quality-gates-rate-limit-cache.md`.

Step-by-step review doc: `docs/reviews/phase-5-quality-gates-rate-limit-cache.md` (same section layout as Phases 1-4).
