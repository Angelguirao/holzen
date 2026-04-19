-- Dead-man switch for scheduled jobs.
--
-- BetterStack Heartbeats (or equivalent) creates a unique URL per scheduled job. If the URL
-- is not hit within the job's expected interval + grace, BetterStack pages `#holzen-alerts`.
-- Every `pg_cron` schedule that runs an edge function should:
--   1. Do its real work.
--   2. Then (and only then) call `public.emit_heartbeat('<uuid>')`.
-- The two-step ordering means a broken job does NOT silence the alarm — a failure short-
-- circuits before the heartbeat is fired.
--
-- This migration installs the helper function. It does NOT automatically wire existing
-- cron schedules (those are managed via the Supabase Management API / dashboard on this
-- project — see supabase/migrations/20260418083854_email_infra.sql § POST-MIGRATION STEPS).
-- The runbook for wiring specific jobs lives in docs/ops/observability-setup.md §
-- "Heartbeats (BetterStack)".

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Non-blocking wrapper around net.http_get.
-- Failures are swallowed: a heartbeat forwarder outage must never fail a cron run.
-- The `uuid` argument is the per-job heartbeat ID (stored as text for flexibility — BetterStack
-- URLs are `https://uptime.betterstack.com/api/v1/heartbeat/<uuid>` but other providers follow
-- a different shape).
CREATE OR REPLACE FUNCTION public.emit_heartbeat(hb_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  base_url text;
  url text;
BEGIN
  IF hb_id IS NULL OR length(hb_id) = 0 THEN
    RETURN;
  END IF;

  -- Base URL is read from a DB setting. Default to BetterStack's hosted endpoint — operators
  -- can `ALTER DATABASE postgres SET app.heartbeat_base_url = '<your-host>/<path>/';` without
  -- touching code to route elsewhere.
  BEGIN
    base_url := current_setting('app.heartbeat_base_url', true);
  EXCEPTION WHEN others THEN
    base_url := NULL;
  END;
  IF base_url IS NULL OR length(base_url) = 0 THEN
    base_url := 'https://uptime.betterstack.com/api/v1/heartbeat/';
  END IF;

  url := base_url || hb_id;

  BEGIN
    PERFORM net.http_get(url);
  EXCEPTION WHEN others THEN
    -- Never fail the caller. A silent heartbeat miss produces a BetterStack alert anyway.
    PERFORM NULL;
  END;
END;
$$;

COMMENT ON FUNCTION public.emit_heartbeat(text) IS
  'Fires a non-blocking HTTP GET to the heartbeat endpoint (BetterStack Heartbeats by default). Wire into each cron job AFTER its real work. See docs/ops/observability-setup.md.';

-- ── Reference mapping (do NOT edit without updating docs/ops/observability-setup.md) ──
--
-- | pg_cron job name              | Heartbeat id (set via BetterStack)                 | Expected cadence |
-- |-------------------------------|----------------------------------------------------|------------------|
-- | process-email-queue           | app.heartbeat_process_email_queue                  | every 5s (grace 60s)  |
-- | monthly-report                | app.heartbeat_monthly_report                       | 1st of month     |
-- | weekly-digest                 | app.heartbeat_weekly_digest                        | weekly           |
-- | btc-price-warm                | app.heartbeat_btc_price_warm                       | every 60s        |
-- | admin-library-preview         | app.heartbeat_admin_library_preview                | on-demand (no HB) |
-- | suggest-ritual (scheduled)    | app.heartbeat_suggest_ritual                       | daily            |
-- | night-reflection (scheduled)  | app.heartbeat_night_reflection                     | daily            |
-- | generate-wallpaper (batch)    | app.heartbeat_generate_wallpaper                   | daily            |
--
-- Populate the `app.heartbeat_*` database settings once per environment:
--
--   ALTER DATABASE postgres SET app.heartbeat_process_email_queue = '<uuid>';
--   ALTER DATABASE postgres SET app.heartbeat_monthly_report     = '<uuid>';
--   -- ...etc
--
-- Then, in the cron schedule body (managed via dashboard / Management API on this project),
-- append:
--
--   PERFORM public.emit_heartbeat(current_setting('app.heartbeat_process_email_queue', true));
--
-- Read `current_setting(..., true)` so a missing setting returns NULL and `emit_heartbeat`
-- becomes a safe no-op on environments that haven't provisioned the heartbeat ID yet.
