# Cron Job Setup

## Cron HTTP auth

Server-side functions that use `verifyServiceAuth` (e.g. `check-volatility`) accept:

- **`Authorization: Bearer <service_role_jwt>`** — the **service_role** key from **Project Settings → API** (full JWT string, not the anon key), or  
- **`Authorization: Bearer <CRON_SECRET>`** — if you set **`CRON_SECRET`** in Edge secrets and send the same value.

**pg_cron / `pg_net`:** Prefer **not** hardcoding the service role inside `cron.schedule` (it appears in `cron.job` metadata and backups). Build the header at run time when Postgres exposes the project secret, for example:

```sql
jsonb_build_object(
  'Content-Type', 'application/json',
  'Authorization', 'Bearer ' || current_setting('supabase.service_role_key', true)
)
```

Verify once in the **SQL Editor** (privileged session): `SELECT current_setting('supabase.service_role_key', true);` — if this is **NULL**, use [Vault](https://supabase.com/docs/guides/database/vault) or your host’s documented secret injection instead of embedding the key in SQL.

**Bruno** (`bruno/service-cron/*.bru`): **`401`** on these calls usually means **`SUPABASE_SERVICE_ROLE_KEY`** in the active environment does **not** exactly match the project’s current service role (wrong project, typo, stale copy). Redeploying the function does not fix a bad client key.

**Stale Edge deploy:** If keys are correct but behavior is wrong, redeploy the function and confirm **Edge Functions → Logs** show your expected `[holzen:volatility]` lines after [holzen-edge-log](../../supabase/functions/_shared/holzen-edge-log.ts) (see [browser-360-mcp-playbook.md](../fundamentals/browser-360-mcp-playbook.md)).

The SQL below uses **`jsonb_build_object` + `current_setting('supabase.service_role_key', true)`** for every job so the key is not stored inside `cron.job` text. For a one-off test in SQL Editor you can temporarily substitute a literal `Bearer …` string instead.

**Where jobs actually live:** This repo does **not** run `cron.schedule` in migrations. Schedules are created manually (SQL Editor or ops) on the Supabase project. To see what is installed: `SELECT jobid, jobname, schedule, command, active FROM cron.job;`.

## BTC Price Refresh (refresh-btc-prices) — MOST IMPORTANT

Keeps btc_price_cache fresh so the Zoom Out companion never needs to call CoinGecko during user sessions. Without this cron, Zoom Out won't have price data.

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
      'Authorization', 'Bearer ' || current_setting('supabase.service_role_key', true)
    ),
    body := '{}'::jsonb
  );
  $$
);
```

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
      'Authorization', 'Bearer ' || current_setting('supabase.service_role_key', true)
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
      'Authorization', 'Bearer ' || current_setting('supabase.service_role_key', true)
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
      'Authorization', 'Bearer ' || current_setting('supabase.service_role_key', true)
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
      'Authorization', 'Bearer ' || current_setting('supabase.service_role_key', true)
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
      'Authorization', 'Bearer ' || current_setting('supabase.service_role_key', true)
    ),
    body := '{}'::jsonb
  );
  $$
);
```
