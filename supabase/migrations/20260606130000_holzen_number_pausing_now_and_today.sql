-- Holzen Number: both live (active|engaged) and paused-today (UTC) community stats.

BEGIN;

ALTER TABLE public.holzen_community_stats
  RENAME COLUMN percent TO percent_pausing_now;

ALTER TABLE public.holzen_community_stats
  ADD COLUMN IF NOT EXISTS users_paused_today integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS percent_paused_today integer NOT NULL DEFAULT 0;

COMMENT ON TABLE public.holzen_community_stats IS
  'Public aggregate cache for Home Market footer; id = ''live''. Live + today UTC counts. No PII.';

CREATE OR REPLACE FUNCTION public.compute_holzen_number_stats()
  RETURNS jsonb
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
  WITH day_start AS (
    SELECT date_trunc('day', (now() AT TIME ZONE 'utc')) AS ts
  ),
  pausing_now AS (
    SELECT COUNT(DISTINCT pi.user_id)::bigint AS n
      FROM public.pause_instances pi
     WHERE pi.state IN ('active', 'engaged')
  ),
  paused_today AS (
    SELECT COUNT(DISTINCT pi.user_id)::bigint AS n
      FROM public.pause_instances pi
      CROSS JOIN day_start d
     WHERE pi.created_at >= d.ts
       AND pi.state <> 'pending'
  ),
  onboarded AS (
    SELECT COUNT(*)::bigint AS n
      FROM public.profiles p
     WHERE p.has_onboarded = true
  )
  SELECT jsonb_build_object(
    'users_pausing_now', (SELECT n FROM pausing_now),
    'percent_pausing_now', CASE
      WHEN (SELECT n FROM onboarded) = 0 THEN 0
      ELSE ROUND(
        (SELECT n FROM pausing_now)::numeric /
        (SELECT n FROM onboarded)::numeric * 100
      )
    END,
    'users_paused_today', (SELECT n FROM paused_today),
    'percent_paused_today', CASE
      WHEN (SELECT n FROM onboarded) = 0 THEN 0
      ELSE ROUND(
        (SELECT n FROM paused_today)::numeric /
        (SELECT n FROM onboarded)::numeric * 100
      )
    END,
    'calculated_at', now()
  );
$$;

COMMENT ON FUNCTION public.compute_holzen_number_stats() IS
  'Live: active|engaged. Today: distinct users with non-pending pause started today (UTC).';

CREATE OR REPLACE FUNCTION public.refresh_holzen_community_stats()
  RETURNS void
  LANGUAGE plpgsql
  VOLATILE
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  v_stats jsonb;
BEGIN
  v_stats := public.compute_holzen_number_stats();
  INSERT INTO public.holzen_community_stats (
    id,
    users_pausing_now,
    percent_pausing_now,
    users_paused_today,
    percent_paused_today,
    calculated_at
  )
  VALUES (
    'live',
    (v_stats->>'users_pausing_now')::integer,
    (v_stats->>'percent_pausing_now')::integer,
    (v_stats->>'users_paused_today')::integer,
    (v_stats->>'percent_paused_today')::integer,
    (v_stats->>'calculated_at')::timestamptz
  )
  ON CONFLICT (id) DO UPDATE SET
    users_pausing_now = EXCLUDED.users_pausing_now,
    percent_pausing_now = EXCLUDED.percent_pausing_now,
    users_paused_today = EXCLUDED.users_paused_today,
    percent_paused_today = EXCLUDED.percent_paused_today,
    calculated_at = EXCLUDED.calculated_at;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_holzen_number()
  RETURNS jsonb
  LANGUAGE plpgsql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  v_row public.holzen_community_stats%ROWTYPE;
  v_day_start timestamptz := date_trunc('day', (now() AT TIME ZONE 'utc'));
BEGIN
  SELECT * INTO v_row FROM public.holzen_community_stats WHERE id = 'live';

  IF NOT FOUND OR v_row.calculated_at < v_day_start THEN
    PERFORM public.refresh_holzen_community_stats();
    SELECT * INTO v_row FROM public.holzen_community_stats WHERE id = 'live';
  END IF;

  RETURN jsonb_build_object(
    'users_pausing_now', v_row.users_pausing_now,
    'percent_pausing_now', v_row.percent_pausing_now,
    'users_paused_today', v_row.users_paused_today,
    'percent_paused_today', v_row.percent_paused_today,
    'calculated_at', v_row.calculated_at
  );
END;
$$;

COMMENT ON FUNCTION public.get_holzen_number() IS
  'Public aggregate: pausing now (active|engaged) + paused today (UTC); % of onboarded profiles.';

SELECT public.refresh_holzen_community_stats();

COMMIT;
