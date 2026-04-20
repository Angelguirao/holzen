# Cron Job Setup

## Cron HTTP auth

Server-side functions that use `verifyServiceAuth` (e.g. `check-volatility`) accept:

- **`Authorization: Bearer <service_role_jwt>`** — the **service_role** key from **Project Settings → API** (full JWT string, not the anon key), or  
- **`Authorization: Bearer <CRON_SECRET>`** — if you set **`CRON_SECRET`** in Edge secrets and send the same value.

**pg_cron / `pg_net`:** Do **not** paste the service role JWT into `cron.schedule` command text (it is visible in `cron.job` and backups). On **Supabase Cloud**, `current_setting('supabase.service_role_key', true)` is usually **NULL** — that GUC is not a supported way to inject the key. Use **[Vault](https://supabase.com/docs/guides/database/vault)** instead (same approach as [Schedule Edge Functions](https://supabase.com/docs/guides/functions/schedule-functions)).

**One-time Vault setup** (SQL Editor, `postgres` role). Pick a stable secret name; this repo uses **`holzen_cron_service_role`** for the **raw** service_role JWT (no `Bearer ` prefix):

```sql
-- Paste the service_role value from Project Settings → API (never commit it to git).
SELECT vault.create_secret('<YOUR_SERVICE_ROLE_JWT>', 'holzen_cron_service_role');
```

Verify (shows rows; values stay hidden in normal listings — use only inside trusted SQL):

```sql
SELECT name FROM vault.secrets WHERE name = 'holzen_cron_service_role';
```

**Authorization header** (use in every `net.http_post` below):

```sql
jsonb_build_object(
  'Content-Type', 'application/json',
  'Authorization', 'Bearer ' || (
    SELECT decrypted_secret
    FROM vault.decrypted_secrets
    WHERE name = 'holzen_cron_service_role'
    LIMIT 1
  )
)
```

**Optional:** If you also store the project URL as `holzen_project_url` (`https://<ref>.supabase.co`), you can build `url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'holzen_project_url' LIMIT 1) || '/functions/v1/refresh-btc-prices'`.

**Self-hosted / rare setups:** If `SELECT current_setting('supabase.service_role_key', true)` is non-null, you may use that instead of Vault; on hosted Supabase, expect **false** / NULL.

**Bruno** (`bruno/service-cron/*.bru`): **`401`** usually means **`SERVICE_CRON_BEARER`** is wrong — it must match the project’s **service_role** JWT or **`CRON_SECRET`** (see [`bruno/service-cron/README.md`](../../bruno/service-cron/README.md)). Redeploying the function does not fix a bad client secret.

**Edge logs:** Cron workers emit **`[holzen:<tag>]`** (see [holzen-edge-log](../../supabase/functions/_shared/holzen-edge-log.ts)). **`holzenEdgeRun`** (request / auth) always appears; set secret **`HOLZEN_EDGE_LOG=0`** on the project to quiet other traces; **errors** still log.

**Stale Edge deploy:** If keys are correct but behavior is wrong, redeploy the function and confirm **Edge Functions → Logs** show the expected **`holzen:`** lines (see [browser-360-mcp-playbook.md](../fundamentals/browser-360-mcp-playbook.md)).

The SQL below uses **Vault** (`holzen_cron_service_role`) for the Bearer token so the JWT is not embedded in `cron.job`. For a disposable one-off test only, you may temporarily use a literal `'Bearer …'` header — do not schedule that.

**Where jobs actually live:** This repo does **not** run `cron.schedule` in migrations. Schedules are created manually (SQL Editor or ops) on the Supabase project. To see what is installed: `SELECT jobid, jobname, schedule, command, active FROM cron.job;`.

## BTC Price Refresh (refresh-btc-prices) — MOST IMPORTANT

Keeps btc_price_cache fresh so the Zoom Out companion never needs to call CoinGecko during user sessions. Without this cron, Zoom Out won't have price data.

### Freshness contract (Zoom Out / `btc_price_cache`)

- **Current day** price: updated whenever this job runs successfully (~15 min when cron is healthy) via `/simple/price`.
- **“On this day” (1–10 calendar years ago)** rows: fetched **once and never refreshed** — a closing price for a past UTC date is immutable, so once the row lands in `btc_price_cache` the cron skips it on every subsequent run (count in `_shared/btc-on-this-day-config.ts`). Prior iterations used a 24h TTL and re-fetched rows that were guaranteed not to have changed, which burned CoinGecko quota and produced noisy `historical: 0/9 matched` logs on the demo tier (see next bullet).
- **Endpoint (historical):** one call per missing anniversary date via `/coins/bitcoin/history?date=DD-MM-YYYY`. Calls run through the shared `_shared/btc-price-warm.ts` helper with **bounded parallelism (5 concurrent, 1.2s between batches)**, so 10 missing anniversaries finish in ~2-3s instead of the old ~10s sequential loop while staying well under the demo tier's ~30 req/min quota. The helper dedupes via a 15-min freshness check so the cron and the session-side warm-on-read don't double-fetch. **CoinGecko demo-tier limitation (observed mid-2026):** both `/market_chart/range` and `/coins/bitcoin/history` return 401 or non-OK for dates older than ~365 days, so the 2y–10y anniversary dates **cannot be resolved via this endpoint on the free plan**. Populate them once via **`seed-btc-history`** (see below); after that the cron only needs to fill the 1y anniversary as it rolls forward each day.
- **Session-side self-healing (warm-on-read):** `zoom-out.ts` reads `btc_price_cache` on every invocation. If fewer than 10/10 historical rows are present, it fires a non-blocking `EdgeRuntime.waitUntil(warmMissingBtcPrices(…))` for the missing dates. The current session still returns whatever it has (no added latency for the user); the next session sees a full timeline. Observable via the `btc warm-on-read: attempted=… upserted=…` orchestrate log line. Same helper, same dedupe — safe to run alongside the cron.
- **Calendar** alignment uses **UTC** date parts for “today” and anniversaries (same as the zoom-out generator).

Tightening TTL or cron frequency trades **freshness vs CoinGecko rate limits** — see `docs/backlog/btc-price-cache-freshness.md`.

```sql
-- Run every 15 minutes
SELECT cron.schedule(
  'refresh-btc-prices',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://<YOUR_SUPABASE_PROJECT_ID>.supabase.co/functions/v1/refresh-btc-prices',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'holzen_cron_service_role' LIMIT 1)
    ),
    body := '{}'::jsonb
  );
  $$
);
```

### Manual backfill (`backfill-btc-prices`)

**Not scheduled.** Service-auth POST to **`/functions/v1/backfill-btc-prices`** with JSON body:

- **`from`**, **`to`**: inclusive UTC calendar dates `YYYY-MM-DD` (same `date` keys as `btc_price_cache`). Span may be up to **4500** days (~12.3 years) per request.
- **`onlyMissing`** (optional, default `true`): only insert dates that are not already in the table (idempotent replays).
- **`dryRun`** (optional, default `false`): resolve prices from CoinGecko but **do not** write rows.
- **`mode`** (optional, default `"range"`): `"range"` uses `/market_chart/range` (bulk-efficient for contiguous spans but demo-tier caps at ~365 days back, returning empty arrays for older dates); `"per_date"` calls `/coins/bitcoin/history?date=…` once per date (works for any historical year, paced 1s apart, capped at **60** calls per invocation). Use `per_date` to fill sparse gaps like zoom-out's 10 anniversary dates across a decade — this is the same endpoint `refresh-btc-prices` now uses.
- **`chunkDays`** (optional, default `45`): window size per `market_chart/range` call. Ignored in `per_date` mode.
- **`maxChunks`** (optional, default `10`, max `25`): CoinGecko HTTP calls **per invocation** (edge wall-clock) in `range` mode. If more work remains, the JSON response sets **`completed: false`** and **`resumeFrom`** (`YYYY-MM-DD`). Call again with **`from: resumeFrom`** and the **same** **`to`** until **`completed: true`** (e.g. a **10-year** daily gap needs many invocations or a small loop script—watch **429**; paid CoinGecko helps). In `per_date` mode the cap is fixed at 60 calls and `resumeFrom` works the same way.

Bruno: `bruno/service-cron/backfill-btc-prices.bru`. Logs: filter **`holzen:backfill-btc`**.

**Local chaining (e.g. ~10 years):** `node scripts/backfill-btc-chain.mjs 2016-04-14 2026-04-14` with the same env vars as Bruno (stops on **429** / `abortReason`; rerun after a pause or upgrade CoinGecko).

**Seeding the 10 zoom-out anniversaries today (recommended one-off):** POST with `{"from": "2016-04-18", "to": "2026-04-18", "mode": "per_date", "onlyMissing": true}`. Only the ~10 missing anniversary dates are touched (`onlyMissing` filters everything else); uses the `/history` endpoint that works on free tier.

### Bulk historical seed (`seed-btc-history`)

**When `backfill-btc-prices` can't reach the years you need (CoinGecko demo tier returns 401 for dates >365d back), use this instead.** It pulls daily BTC-USD closing prices from **CryptoCompare**'s free `histoday` endpoint (no API key required, serves data back to 2010) and bulk-upserts into `btc_price_cache`. Same idempotent shape as `backfill-btc-prices`.

**Not scheduled.** Run **once** after deployment (or after a DB restore) to populate the 2y–10y anniversary rows that CoinGecko can't give us. After that, the `refresh-btc-prices` cron only needs to fill the 1y anniversary as it rolls forward each day.

Body (all optional):

- **`from`** (default `"2014-09-17"`): earliest UTC calendar date to fill. BTC daily data exists earlier but has no liquid USD spot reference before mid-2014.
- **`to`** (default today UTC).
- **`onlyMissing`** (default `true`): skip dates already in `btc_price_cache`.
- **`dryRun`** (default `false`): fetch + parse but don't upsert.
- **`batchLimit`** (default `2000`, max `2000`): rows per CryptoCompare call; ~12 years fit in 3 pages.

Recommended one-off from Bruno (`bruno/service-cron/seed-btc-history.bru`):

1. POST with `{"from": "2014-09-17", "onlyMissing": true, "dryRun": true}` — confirm the row count looks right (~4000+ rows on a fresh install).
2. POST again with `"dryRun": false` — takes ~3–5s, uses 3 pages.
3. Verify: `select count(*), min(date), max(date) from btc_price_cache;`.

Logs: filter **`holzen:seed-btc-history`**.

## Source Feed Fetcher (fetch-source-feeds)

Fetches latest content from signal_sources URLs, structures it, and stores in content_library. This is what makes sources actively feed the system.

```sql
-- Run twice daily (6 AM and 6 PM UTC)
SELECT cron.schedule(
  'fetch-source-feeds',
  '0 6,18 * * *',
  $$
  SELECT net.http_post(
    url := 'https://<YOUR_SUPABASE_PROJECT_ID>.supabase.co/functions/v1/fetch-source-feeds',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'holzen_cron_service_role' LIMIT 1)
    ),
    body := '{}'::jsonb
  );
  $$
);
```

## Cache Warmer (pregenerate-companions)

Generates fresh companion content for the cache, promotes high-quality entries to permanent, prunes low-quality ones, and processes user feedback.

### Setup in Supabase

1. **Enable pg_cron**: Supabase Dashboard → Database → Extensions → search for `pg_cron` → Enable

2. **Enable pg_net** (for HTTP calls): Supabase Dashboard → Database → Extensions → search for `pg_net` → Enable

3. **Schedule the cron job**: Run this in the SQL Editor:

```sql
-- Run cache warmer every 6 hours
SELECT cron.schedule(
  'pregenerate-companions',
  '0 */6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://<YOUR_SUPABASE_PROJECT_ID>.supabase.co/functions/v1/pregenerate-companions',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'holzen_cron_service_role' LIMIT 1)
    ),
    body := '{}'::jsonb
  );
  $$
);
```

### Verify it's running

```sql
-- Check scheduled jobs
SELECT * FROM cron.job;

-- Check recent executions
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
```

### Adjust frequency

```sql
-- Change to every 4 hours
SELECT cron.alter_job('pregenerate-companions', schedule := '0 */4 * * *');

-- Change to every 12 hours
SELECT cron.alter_job('pregenerate-companions', schedule := '0 */12 * * *');

-- Disable temporarily
SELECT cron.alter_job('pregenerate-companions', active := false);
```

## Volatility Checker (check-volatility)

Checks BTC price and triggers pause sessions for eligible users.

```sql
-- Run every 15 minutes (Authorization injected at runtime — see [Cron HTTP auth](#cron-http-auth))
SELECT cron.schedule(
  'check-volatility',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://<YOUR_SUPABASE_PROJECT_ID>.supabase.co/functions/v1/check-volatility',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'holzen_cron_service_role' LIMIT 1)
    ),
    body := '{}'::jsonb
  );
  $$
);
```

## Follow-up Check (check-followups)

Creates 24-48h follow-up entries for reflections where the user sold or bought. This feeds outcome data back into the Mirror intervention — without it, Mirror has no outcome history to surface.

**Required for Mirror to work correctly.**

```sql
-- Run every 6 hours
SELECT cron.schedule(
  'check-followups',
  '0 */6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://<YOUR_SUPABASE_PROJECT_ID>.supabase.co/functions/v1/check-followups',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'holzen_cron_service_role' LIMIT 1)
    ),
    body := '{}'::jsonb
  );
  $$
);
```

## Referral pending queue (process-referral-pending)

Processes rows in `referral_pending_jobs` when the client’s first `record-referral` invoke fails (network / transient errors). Uses `verifyServiceAuth` — same Bearer header as other service crons.

**Schedule this after deploying the migration and function** (otherwise the table/RPC is missing).

```sql
-- Run every 5 minutes
SELECT cron.schedule(
  'process-referral-pending',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://<YOUR_SUPABASE_PROJECT_ID>.supabase.co/functions/v1/process-referral-pending',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'holzen_cron_service_role' LIMIT 1)
    ),
    body := '{}'::jsonb
  );
  $$
);
```

## Night Reflection

Sends personalized end-of-day reflections to users.

```sql
-- Run every hour (function checks user timezone internally)
SELECT cron.schedule(
  'night-reflection',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://<YOUR_SUPABASE_PROJECT_ID>.supabase.co/functions/v1/night-reflection',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'holzen_cron_service_role' LIMIT 1)
    ),
    body := '{}'::jsonb
  );
  $$
);
```

## Purge Orphan Notification Reflections

Every cron-generated reflection that a user never engaged with (no outcome, no
`mood_after`, no `breathing_completed`) is an **ignored notification**. These
rows are already excluded from every metric via `src/lib/engaged-pause.ts`
(`isCompletedPause` / `isFullRitualPause`) and the server-side `v_reflections_*`
views — but they still accumulate in `public.reflections`.

This cron deletes them after a TTL to keep the table lean. Because
`pause_notifications.reflection_id` is `ON DELETE SET NULL`, the bell history
stays intact; only the dangling reflection row is removed. The purge function
lives in migration `20260420220000_reflection_source_and_engagement_views.sql`.

**Before scheduling:** confirm `v_notification_response_rate` (Admin → Monitor
→ Notification Response) looks reasonable — that view counts these rows, so a
too-short TTL shrinks its window.

Predicate (enforced inside the function):

```sql
source IS NOT NULL
AND source <> 'manual'
AND outcome IS NULL
AND mood_after IS NULL
AND (breathing_completed IS NULL OR breathing_completed = false)
AND created_at < now() - make_interval(days => <cutoff_days>)
```

### Schedule (daily at 03:15 UTC, 30-day TTL)

```sql
SELECT cron.schedule(
  'purge-orphan-notification-reflections',
  '15 3 * * *',
  $$
  SELECT public.purge_orphan_notification_reflections(30);
  $$
);
```

### Dry-run / one-off

```sql
-- How many rows would be purged at the current TTL (read-only probe).
SELECT count(*) AS candidates
FROM public.reflections
WHERE source IS NOT NULL
  AND source <> 'manual'
  AND outcome IS NULL
  AND mood_after IS NULL
  AND (breathing_completed IS NULL OR breathing_completed = false)
  AND created_at < now() - interval '30 days';

-- Run once manually (returns the actual deleted count).
SELECT public.purge_orphan_notification_reflections(30);
```

### Tuning the TTL

- **Shorter TTL** (7–14 days): leaner table, but the admin Notification
  Response card only sees the last N days of history.
- **Longer TTL** (60–90 days): more historical context for pipeline analysis at
  the cost of extra rows that the `idx_reflections_orphan_notifications`
  partial index already keeps cheap to scan.

Adjust with `cron.alter_job('purge-orphan-notification-reflections', schedule :=
'…')` and pass a different `cutoff_days` arg by updating the command body
(`SELECT public.purge_orphan_notification_reflections(<N>);`).
