-- check-volatility: quarter-hour → hourly (product cadence change; refresh-market-prices stays */15).

DO $cron$
BEGIN
  PERFORM cron.unschedule(jobid)
  FROM cron.job
  WHERE jobname = 'check-volatility';

  PERFORM cron.schedule(
    'check-volatility',
    '0 * * * *',
    $cmd$
    SELECT net.http_post(
      url := 'https://edgbwdecaoottowliimu.supabase.co/functions/v1/check-volatility',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (
          SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET' LIMIT 1
        )
      ),
      body := '{}'::jsonb
    );
    SELECT public.emit_job_heartbeat('check_volatility');
    $cmd$
  );
EXCEPTION
  WHEN undefined_table OR invalid_schema_name THEN
    RAISE NOTICE 'pg_cron not available — skip check-volatility hourly reschedule';
END $cron$;
