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

- **Current day** price: updated whenever this job runs successfully (~15 min when cron is healthy).
- **“On this day” (1–10 calendar years ago)** rows: refetched only when the row is **missing** or `fetched_at` is older than **24 hours** (see `refresh-btc-prices` — `recentThreshold`; count in `_shared/btc-on-this-day-config.ts`). Reduces CoinGecko calls; acceptable for **daily perspective copy**, not intraday precision.
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
- **`chunkDays`** (optional, default `45`): window size per `market_chart/range` call.
- **`maxChunks`** (optional, default `10`, max `25`): CoinGecko HTTP calls **per invocation** (edge wall-clock). If more work remains, the JSON response sets **`completed: false`** and **`resumeFrom`** (`YYYY-MM-DD`). Call again with **`from: resumeFrom`** and the **same** **`to`** until **`completed: true`** (e.g. a **10-year** daily gap needs many invocations or a small loop script—watch **429**; paid CoinGecko helps).

Bruno: `bruno/service-cron/backfill-btc-prices.bru`. Logs: filter **`holzen:backfill-btc`**.

**Local chaining (e.g. ~10 years):** `node scripts/backfill-btc-chain.mjs 2016-04-14 2026-04-14` with the same env vars as Bruno (stops on **429** / `abortReason`; rerun after a pause or upgrade CoinGecko).

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
