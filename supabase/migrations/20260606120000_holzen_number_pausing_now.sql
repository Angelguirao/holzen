-- Holzen Number: community “pausing now” (active | engaged), not paused-today.
-- Cache row id = live; Realtime + pause_instances trigger unchanged.

BEGIN;

ALTER TABLE public.holzen_community_stats
  RENAME COLUMN users_paused_today TO users_pausing_now;

COMMENT ON TABLE public.holzen_community_stats IS
  'Public aggregate cache for Home Market footer; id = ''live'' (in-ritual pauses). No PII.';

DELETE FROM public.holzen_community_stats WHERE id = 'today';

CREATE OR REPLACE FUNCTION public.compute_holzen_number_stats()
  RETURNS jsonb
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
  WITH pausing_now AS (
    SELECT COUNT(DISTINCT pi.user_id)::bigint AS n
      FROM public.pause_instances pi
     WHERE pi.state IN ('active', 'engaged')
  ),
  onboarded AS (
    SELECT COUNT(*)::bigint AS n
      FROM public.profiles p
     WHERE p.has_onboarded = true
  )
  SELECT jsonb_build_object(
    'users_pausing_now', (SELECT n FROM pausing_now),
    'percent', CASE
      WHEN (SELECT n FROM onboarded) = 0 THEN 0
      ELSE ROUND(
        (SELECT n FROM pausing_now)::numeric /
        (SELECT n FROM onboarded)::numeric * 100
      )
    END,
    'calculated_at', now()
  );
$$;

COMMENT ON FUNCTION public.compute_holzen_number_stats() IS
  'Distinct onboarded users with pause_instances.state in (active, engaged).';

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
  INSERT INTO public.holzen_community_stats (id, users_pausing_now, percent, calculated_at)
  VALUES (
    'live',
    (v_stats->>'users_pausing_now')::integer,
    (v_stats->>'percent')::integer,
    (v_stats->>'calculated_at')::timestamptz
  )
  ON CONFLICT (id) DO UPDATE SET
    users_pausing_now = EXCLUDED.users_pausing_now,
    percent = EXCLUDED.percent,
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
BEGIN
  SELECT * INTO v_row FROM public.holzen_community_stats WHERE id = 'live';

  IF NOT FOUND THEN
    PERFORM public.refresh_holzen_community_stats();
    SELECT * INTO v_row FROM public.holzen_community_stats WHERE id = 'live';
  END IF;

  RETURN jsonb_build_object(
    'users_pausing_now', v_row.users_pausing_now,
    'percent', v_row.percent,
    'calculated_at', v_row.calculated_at
  );
END;
$$;

COMMENT ON FUNCTION public.get_holzen_number() IS
  'Public aggregate: users in active|engaged pause now; % of onboarded profiles; reads holzen_community_stats (live).';

SELECT public.refresh_holzen_community_stats();

COMMIT;
