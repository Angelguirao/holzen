-- Reschedule pause-first HTTP crons on an owned project (staging/prod).
-- Requires vault secrets: holzen_project_url, CRON_SECRET (or holzen_cron_service_role).
-- Run: npm run staging:reschedule-crons (or npm run prod:reschedule-crons)
-- Note: direct UPDATE cron.job often fails with 42501 on hosted Supabase; unschedule + schedule works.

SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname IN (
  'check-volatility',
  'pregenerate-companions',
  'refresh-market-prices',
  'process-email-queue'
);

SELECT cron.schedule(
  'check-volatility',
  '*/15 * * * *',
  $$
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
  $$
);

SELECT cron.schedule(
  'pregenerate-companions',
  '0 */6 * * *',
  $$
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
  $$
);

SELECT cron.schedule(
  'refresh-market-prices',
  '*/15 * * * *',
  $$
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
  $$
);

SELECT jobid, jobname, schedule, active
FROM cron.job
WHERE jobname IN ('check-volatility', 'pregenerate-companions', 'refresh-market-prices')
ORDER BY jobname;
