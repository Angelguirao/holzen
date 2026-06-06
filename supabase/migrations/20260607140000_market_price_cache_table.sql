-- Tier 2 market naming: btc_price_cache → market_price_cache; refresh cron → refresh-market-prices.

ALTER TABLE public.btc_price_cache RENAME TO market_price_cache;

COMMENT ON TABLE public.market_price_cache IS
  'UTC date-keyed closing prices for tracked assets (bitcoin today). Written by refresh-market-prices edge cron.';

-- Preserve wired BetterStack UUID when prod already configured heartbeat.refresh_btc_prices.
INSERT INTO public.app_config (key, value, description)
SELECT
  'heartbeat.refresh_market_prices',
  value,
  'BetterStack heartbeat UUID for the refresh-market-prices pg_cron job. Empty = not wired.'
FROM public.app_config
WHERE key = 'heartbeat.refresh_btc_prices'
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.app_config (key, value, description) VALUES
  (
    'heartbeat.refresh_market_prices',
    '""'::jsonb,
    'BetterStack heartbeat UUID for the refresh-market-prices pg_cron job. Empty = not wired.'
  )
ON CONFLICT (key) DO NOTHING;

DO $cron$
BEGIN
  PERFORM cron.unschedule(jobid)
  FROM cron.job
  WHERE jobname IN ('refresh-btc-prices', 'refresh-market-prices');

  PERFORM cron.schedule(
    'refresh-market-prices',
    '*/15 * * * *',
    $cmd$
    SELECT net.http_post(
      url := 'https://edgbwdecaoottowliimu.supabase.co/functions/v1/refresh-market-prices',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (
          SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET' LIMIT 1
        )
      ),
      body := '{}'::jsonb
    );
    SELECT public.emit_job_heartbeat('refresh_market_prices');
    $cmd$
  );
EXCEPTION
  WHEN undefined_table OR invalid_schema_name THEN
    RAISE NOTICE 'pg_cron not available — skip refresh-market-prices reschedule';
END $cron$;
