-- Holzen Number: community “paused today” (replaces held-steady outcome %).
-- Public aggregate via holzen-number edge / get_holzen_number().

CREATE OR REPLACE FUNCTION public.get_holzen_number()
  RETURNS jsonb
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
  WITH day_start AS (
    SELECT date_trunc('day', (now() AT TIME ZONE 'utc')) AS ts
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
    'users_paused_today', (SELECT n FROM paused_today),
    'percent', CASE
      WHEN (SELECT n FROM onboarded) = 0 THEN 0
      ELSE ROUND(
        (SELECT n FROM paused_today)::numeric /
        (SELECT n FROM onboarded)::numeric * 100
      )
    END,
    'calculated_at', now()
  );
$$;

COMMENT ON FUNCTION public.get_holzen_number() IS
  'Public aggregate: distinct users who started a non-pending pause today (UTC) and % of onboarded profiles.';
