-- Home one-shot calm sweep: stamp calm_settled_at without waiting for hourly check-volatility.
-- Shared core used by service-role cron and authenticated self-apply (after server-side threshold check).

CREATE OR REPLACE FUNCTION public._pause_cron_volatility_calm_sweep_core(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now timestamptz := now();
  v_n int := 0;
  v_row int;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION '_pause_cron_volatility_calm_sweep_core: p_user_id required';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

  UPDATE public.pause_instances
     SET state = 'expired',
         expired_reason = 'context_lost',
         terminal_at = v_now,
         metadata = COALESCE(metadata, '{}'::jsonb)
           || jsonb_build_object('volatility_calm_sweep', true)
   WHERE user_id = p_user_id
     AND source = 'cron_volatility'
     AND state IN ('active', 'pending');
  GET DIAGNOSTICS v_row = ROW_COUNT;
  v_n := v_n + v_row;

  UPDATE public.pause_instances
     SET metadata = COALESCE(metadata, '{}'::jsonb)
       || jsonb_build_object('calm_settled_at', to_jsonb(v_now))
   WHERE user_id = p_user_id
     AND source = 'cron_volatility'
     AND state = 'engaged'
     AND NOT (COALESCE(metadata, '{}'::jsonb) ? 'calm_settled_at');

  IF v_n > 0 AND NOT EXISTS (
    SELECT 1
      FROM public.pause_instances pi
     WHERE pi.user_id = p_user_id
       AND pi.state IN ('active', 'engaged', 'pending')
  ) THEN
    UPDATE public.profiles
       SET last_context = NULL
     WHERE user_id = p_user_id;
  END IF;

  RETURN v_n;
END;
$$;

COMMENT ON FUNCTION public._pause_cron_volatility_calm_sweep_core(uuid) IS
  'Internal: expire cron active|pending on calm market; stamp calm_settled_at on engaged cron rows. Callers must validate authorization.';

REVOKE ALL ON FUNCTION public._pause_cron_volatility_calm_sweep_core(uuid) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.pause_expire_cron_volatility_context_lost(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'pause_expire_cron_volatility_context_lost: service_role required';
  END IF;

  RETURN public._pause_cron_volatility_calm_sweep_core(p_user_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.pause_apply_cron_calm_sweep_for_self(
  p_change_percent double precision,
  p_direction text
)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_threshold numeric;
  v_threshold_down numeric;
  v_effective numeric;
  v_expired int;
  v_calm_stamped boolean := false;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'pause_apply_cron_calm_sweep_for_self: not authenticated';
  END IF;

  IF p_direction IS NULL OR p_direction NOT IN ('up', 'down') THEN
    RETURN jsonb_build_object('applied', false, 'reason', 'invalid_direction');
  END IF;

  IF p_change_percent IS NULL OR p_change_percent <> p_change_percent THEN
    RETURN jsonb_build_object('applied', false, 'reason', 'invalid_change_percent');
  END IF;

  SELECT p.threshold, p.threshold_down
    INTO v_threshold, v_threshold_down
    FROM public.profiles p
   WHERE p.user_id = v_uid;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('applied', false, 'reason', 'profile_not_found');
  END IF;

  v_effective := CASE
    WHEN p_direction = 'down' THEN COALESCE(v_threshold_down, v_threshold, 5)
    ELSE COALESCE(v_threshold, 5)
  END;

  IF abs(p_change_percent) >= v_effective THEN
    RETURN jsonb_build_object('applied', false, 'reason', 'market_not_calm');
  END IF;

  IF NOT EXISTS (
    SELECT 1
      FROM public.pause_instances pi
     WHERE pi.user_id = v_uid
       AND pi.source = 'cron_volatility'
       AND pi.state IN ('active', 'engaged', 'pending')
  ) THEN
    RETURN jsonb_build_object('applied', false, 'reason', 'no_cron_open_rows');
  END IF;

  v_expired := public._pause_cron_volatility_calm_sweep_core(v_uid);

  SELECT EXISTS (
    SELECT 1
      FROM public.pause_instances pi
     WHERE pi.user_id = v_uid
       AND pi.source = 'cron_volatility'
       AND pi.state = 'engaged'
       AND COALESCE(pi.metadata, '{}'::jsonb) ? 'calm_settled_at'
  ) INTO v_calm_stamped;

  RETURN jsonb_build_object(
    'applied', true,
    'expired_count', v_expired,
    'calm_stamped', v_calm_stamped
  );
END;
$$;

COMMENT ON FUNCTION public.pause_apply_cron_calm_sweep_for_self(double precision, text) IS
  'Authenticated: when live move is within profile daily thresholds, run cron calm sweep for auth.uid() (expire active|pending, stamp calm_settled_at on engaged cron).';

REVOKE ALL ON FUNCTION public.pause_apply_cron_calm_sweep_for_self(double precision, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pause_apply_cron_calm_sweep_for_self(double precision, text) TO authenticated;
