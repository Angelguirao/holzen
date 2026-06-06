-- Reschedule shipped local HTTP crons against the local Supabase gateway.
-- Requires vault secrets:
--   - holzen_project_url = http://api.supabase.internal:8000
--   - CRON_SECRET = same bearer used by local Edge Functions
-- Run via: npm run supabase:cron:local

DO $cron$
BEGIN
  PERFORM cron.unschedule(jobid)
  FROM cron.job
  WHERE jobname IN (
    'check-volatility',
    'pregenerate-companions',
    'refresh-market-prices'
  );

  PERFORM cron.schedule(
    'check-volatility',
    '0 * * * *',
    $cmd$
    SELECT net.http_post(
      url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'holzen_project_url' LIMIT 1)
        || '/functions/v1/check-volatility',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET' LIMIT 1)
      ),
      body := '{}'::jsonb
    );
    SELECT public.emit_heartbeat('check_volatility');
    $cmd$
  );

  PERFORM cron.schedule(
    'pregenerate-companions',
    '0 */6 * * *',
    $cmd$
    SELECT net.http_post(
      url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'holzen_project_url' LIMIT 1)
        || '/functions/v1/pregenerate-companions',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET' LIMIT 1)
      ),
      body := '{}'::jsonb
    );
    SELECT public.emit_heartbeat('pregenerate_companions');
    $cmd$
  );

  PERFORM cron.schedule(
    'refresh-market-prices',
    '*/15 * * * *',
    $cmd$
    SELECT net.http_post(
      url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'holzen_project_url' LIMIT 1)
        || '/functions/v1/refresh-market-prices',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET' LIMIT 1)
      ),
      body := '{}'::jsonb
    );
    SELECT public.emit_heartbeat('refresh_market_prices');
    $cmd$
  );
EXCEPTION
  WHEN undefined_table OR invalid_schema_name THEN
    RAISE NOTICE 'pg_cron not available — skip local reschedule';
END $cron$;
