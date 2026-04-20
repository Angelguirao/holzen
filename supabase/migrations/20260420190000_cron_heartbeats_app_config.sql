-- Supersedes the "ALTER DATABASE postgres SET app.heartbeat_*" approach in
-- 20260419180000_cron_heartbeats.sql. That approach requires superuser privileges,
-- which Lovable-managed Supabase Cloud does not expose — the SQL editor runs as a
-- less-privileged role and ALTER DATABASE fails with `permission denied for database`.
--
-- This migration shifts heartbeat UUID storage to the existing `public.app_config`
-- table (admin-editable, no superuser needed) and adds a convenience wrapper that
-- looks up the UUID by job name.
--
-- Callers in pg_cron schedules should use:
--   PERFORM public.emit_job_heartbeat('refresh_btc_prices');
--
-- The legacy `emit_heartbeat(hb_id text)` from the prior migration is kept for
-- direct-UUID use (ad-hoc pings from SQL); new cron wiring should prefer the
-- `emit_job_heartbeat` wrapper so all UUIDs live in one admin-editable place.
--
-- Operational rollout is tracked in docs/backlog/pg-cron-heartbeat-wiring.md.

-- ── Seed rows in app_config. Empty-string value = "not yet provisioned". ──────
-- `emit_job_heartbeat` treats missing / empty values as a safe no-op, so this
-- migration can ship before the UUIDs are generated in BetterStack.
INSERT INTO public.app_config (key, value, description) VALUES
  ('heartbeat.refresh_btc_prices',
    '""'::jsonb,
    'BetterStack heartbeat UUID for the refresh-btc-prices pg_cron job. Empty = not wired.'),
  ('heartbeat.fetch_source_feeds',
    '""'::jsonb,
    'BetterStack heartbeat UUID for the fetch-source-feeds pg_cron job. Empty = not wired.'),
  ('heartbeat.pregenerate_companions',
    '""'::jsonb,
    'BetterStack heartbeat UUID for the pregenerate-companions pg_cron job. Empty = not wired.'),
  ('heartbeat.check_volatility',
    '""'::jsonb,
    'BetterStack heartbeat UUID for the check-volatility pg_cron job. Empty = not wired.'),
  ('heartbeat.check_followups',
    '""'::jsonb,
    'BetterStack heartbeat UUID for the check-followups pg_cron job. Empty = not wired.'),
  ('heartbeat.process_referral_pending',
    '""'::jsonb,
    'BetterStack heartbeat UUID for the process-referral-pending pg_cron job. Empty = not wired.'),
  ('heartbeat.night_reflection',
    '""'::jsonb,
    'BetterStack heartbeat UUID for the night-reflection pg_cron job. Empty = not wired.'),
  ('heartbeat.process_email_queue',
    '""'::jsonb,
    'BetterStack heartbeat UUID for the process-email-queue pg_cron job. Empty = not wired.'),
  ('heartbeat._base_url',
    '""'::jsonb,
    'Override base URL for heartbeat HTTP GETs. Empty = BetterStack default (https://uptime.betterstack.com/api/v1/heartbeat/).')
ON CONFLICT (key) DO NOTHING;

-- ── Wrapper: look up heartbeat UUID by job name, then emit. ──────────────────
-- `job_name` is the bare suffix (e.g. 'refresh_btc_prices'); the function
-- prepends the 'heartbeat.' prefix before lookup.
--
-- SECURITY DEFINER lets pg_cron workers call this without needing RLS access to
-- app_config. It still runs non-blocking — any failure is swallowed so a broken
-- forwarder never fails the cron transaction.
CREATE OR REPLACE FUNCTION public.emit_job_heartbeat(job_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  hb_uuid       text;
  override_base text;
  base_url      text;
  url           text;
BEGIN
  IF job_name IS NULL OR length(job_name) = 0 THEN
    RETURN;
  END IF;

  SELECT value #>> '{}' INTO hb_uuid
  FROM public.app_config
  WHERE key = 'heartbeat.' || job_name;

  IF hb_uuid IS NULL OR length(hb_uuid) = 0 THEN
    -- Not yet provisioned. Silent no-op — lets the migration land before UUIDs exist.
    RETURN;
  END IF;

  SELECT value #>> '{}' INTO override_base
  FROM public.app_config
  WHERE key = 'heartbeat._base_url';

  IF override_base IS NULL OR length(override_base) = 0 THEN
    base_url := 'https://uptime.betterstack.com/api/v1/heartbeat/';
  ELSE
    base_url := override_base;
  END IF;

  url := base_url || hb_uuid;

  BEGIN
    PERFORM net.http_get(url);
  EXCEPTION WHEN others THEN
    -- Never fail the caller. A silent heartbeat miss produces a BetterStack alert anyway.
    PERFORM NULL;
  END;
END;
$$;

COMMENT ON FUNCTION public.emit_job_heartbeat(text) IS
  'Looks up the heartbeat UUID by job name from public.app_config (key: heartbeat.<job_name>) and emits a non-blocking HTTP GET to the BetterStack heartbeat endpoint. Silent no-op when the UUID has not been provisioned. Prefer this over emit_heartbeat(text) for pg_cron wiring so all UUIDs live in app_config (admin-editable, no ALTER DATABASE needed).';
