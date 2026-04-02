# Phase 4: Cron workers, caching, and content pipelines

## Scope

- `supabase/functions/refresh-btc-prices/index.ts`
- `supabase/functions/fetch-source-feeds/index.ts`
- `supabase/functions/pregenerate-companions/index.ts`

## What these workers guarantee

### 1. `refresh-btc-prices` (Zoom Out dependency)

Purpose (per code + `docs/ops/cron-setup.md`):

- Runs on a schedule (cron every ~15 minutes).
- Keeps `btc_price_cache` fresh so Zoom Out never has to call CoinGecko during user sessions.

Key behaviors:

- Auth gate:
  - allows `Authorization: Bearer <service_role_key>` or `CRON_SECRET`, and also accepts `x-supabase-cron: true`.
- Writes:
  - upserts current BTC price daily key (`date`)
  - upserts historical “on this day” prices (1-4 years ago) when missing or older than 24h
- Uses a 2s delay between CoinGecko calls to reduce rate-limit pressure.

### 2. `fetch-source-feeds` (active content library)

Purpose:

- Fetches latest content from `signal_sources.url`.
- Scrapes + cleans with Firecrawl if configured; otherwise falls back to Perplexity search.
- Uses the Lovable AI gateway to structure content into entries for `content_library`.

Key behaviors:

- Auth gate:
  - allows service role key or `CRON_SECRET` (via `Authorization` or `x-supabase-cron` header).
- Inserts into `content_library` with:
  - `companion_types`: `signal` category maps to `signal`; others map to `ground_nudge`
  - title/summary/citation/url + tags
  - basic `quality_score: 2`
- Dedup:
  - checks existing `content_library` by exact `title` match before inserting.

### 3. `pregenerate-companions` (companion_cache lifecycle + warm pool)

Purpose:

- Runs periodically to keep `companion_cache` filled with high-quality cached companion payloads.
- Also processes feedback (analytics_events where `event = companion_feedback`) to up/down-vote quality scores.

Key behaviors:

- Auth gate:
  - requires either `SUPABASE_SERVICE_ROLE_KEY` or `CRON_SECRET`.
- Cache lifecycle:
  - promotes high-quality (`quality_score >= 3` and/or `>=2` with `used_count >= 3`) to permanent entries (`expires_at = null`)
  - prunes low-quality (`quality_score < 2` older than 3 days)
  - expires medium entries (`quality_score 1-2` older than 30 days, not permanent)
- Generation loop:
  - generates a small number of grounding (2), signal (1), history (1), zoom-out deep-time (1)
  - dedups using “title similarity” checks against existing `companion_cache` content for the companion type
- Feedback processing:
  - reads feedback events from the last 24 hours
  - adjusts `quality_score` within bounds [0..3]

## Risks / things to validate

1. **Dedup keys vs “meaningful duplicates”**
   - `fetch-source-feeds` dedups only by exact `content_library.title`.
   - `pregenerate-companions` uses a fuzzy-ish dedup on `companion_cache.content.title`.
   - If your titles drift (or structure prompt changes), the caches could grow with near-duplicates.

2. **Auth gating correctness across cron execution paths**
   - `refresh-btc-prices` supports `x-supabase-cron: true` as a third signal; confirm other workers follow the same convention.

3. **Timing windows**
   - `refresh-btc-prices` only refreshes historical snapshots when missing or older than 24h, so “on this day” accuracy depends on the cron cadence + date-key semantics.

## Suggested next step

Trace one “cache → UI” example end-to-end:

- Zoom Out card reads `btc_price_cache` produced by `refresh-btc-prices`
- Signal/Grounding/History cards prefer `companion_cache` (and fall back to curated pools)

