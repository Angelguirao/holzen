-- Expire untouched cron volatility pauses when the market is no longer above
-- thresholds. Invoked from check-volatility after each market sample.

CREATE OR REPLACE FUNCTION public.pause_expire_cron_volatility_context_lost(p_user_id uuid)
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
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'pause_expire_cron_volatility_context_lost: service_role required';
  END IF;
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'pause_expire_cron_volatility_context_lost: p_user_id required';
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

COMMENT ON FUNCTION public.pause_expire_cron_volatility_context_lost(uuid) IS
  'Service-role: expire cron_volatility active|pending rows when market is back within user thresholds; clears profiles.last_context when no open pause remains.';

REVOKE ALL ON FUNCTION public.pause_expire_cron_volatility_context_lost(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pause_expire_cron_volatility_context_lost(uuid) TO service_role;
