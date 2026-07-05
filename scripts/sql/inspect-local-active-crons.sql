-- List shipped local HTTP crons when pg_cron is available.
-- Run via: npm run supabase:cron:local

DO $inspect$
DECLARE
  r RECORD;
  found boolean := false;
BEGIN
  IF to_regclass('cron.job') IS NULL THEN
    RAISE NOTICE 'pg_cron not available — skip local cron inspect';
    RETURN;
  END IF;

  FOR r IN
    SELECT jobid, jobname, schedule, active
    FROM cron.job
    WHERE jobname IN (
      'check-volatility',
      'pregenerate-companions',
      'refresh-market-prices'
    )
    ORDER BY jobname
  LOOP
    found := true;
    RAISE NOTICE '  % | id=% | schedule=% | active=%',
      r.jobname, r.jobid, r.schedule, r.active;
  END LOOP;

  IF NOT found THEN
    RAISE NOTICE '  (no shipped HTTP cron jobs registered)';
  END IF;
END $inspect$;
