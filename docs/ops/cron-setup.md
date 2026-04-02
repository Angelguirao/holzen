# Cron Job Setup

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
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
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
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
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
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
```

Replace `YOUR_SERVICE_ROLE_KEY` with your Supabase service role key (found in Settings → API → service_role key).

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
-- Run every 15 minutes
SELECT cron.schedule(
  'check-volatility',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://<YOUR_SUPABASE_PROJECT_ID>.supabase.co/functions/v1/check-volatility',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
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
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
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
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
```
