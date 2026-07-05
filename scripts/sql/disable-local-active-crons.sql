-- Disable shipped local HTTP crons when no local CRON_SECRET is configured.
-- This prevents the local DB from invoking stale remote URLs after migrations.
-- Run via: npm run supabase:cron:local

DO $$
BEGIN
  PERFORM cron.unschedule(jobid)
  FROM cron.job
  WHERE jobname IN (
    'check-volatility',
    'pregenerate-companions',
    'refresh-market-prices'
  );
EXCEPTION
  WHEN undefined_table OR invalid_schema_name THEN
    RAISE NOTICE 'pg_cron not available — skip local disable';
END $$;
