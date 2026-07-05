-- Engaged cron pauses: open_max_age starts when the market calms (metadata.calm_settled_at),
-- not at engaged_at. Manual / non-cron engaged rows keep engaged_at + 12h.

CREATE OR REPLACE FUNCTION public.pause_open_max_anchor_at(
  p_source text,
  p_state public.pause_state,
  p_engaged_at timestamptz,
  p_created_at timestamptz,
  p_metadata jsonb
)
RETURNS timestamptz
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN p_state = 'engaged'::public.pause_state
         AND p_source = 'cron_volatility' THEN
      NULLIF(trim(both FROM COALESCE(p_metadata->>'calm_settled_at', '')), '')::timestamptz
    WHEN p_state = 'engaged'::public.pause_state THEN
      COALESCE(p_engaged_at, p_created_at)
    ELSE
      NULL::timestamptz
  END;
$$;

COMMENT ON FUNCTION public.pause_open_max_anchor_at(text, public.pause_state, timestamptz, timestamptz, jsonb) IS
  'open_max_age anchor: cron_volatility engaged uses metadata.calm_settled_at (NULL until calm sweep); other engaged uses COALESCE(engaged_at, created_at).';

REVOKE ALL ON FUNCTION public.pause_open_max_anchor_at(text, public.pause_state, timestamptz, timestamptz, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pause_open_max_anchor_at(text, public.pause_state, timestamptz, timestamptz, jsonb) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.pause_clear_cron_volatility_calm_settled(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_n int := 0;
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'pause_clear_cron_volatility_calm_settled: service_role required';
  END IF;
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'pause_clear_cron_volatility_calm_settled: p_user_id required';
  END IF;

  UPDATE public.pause_instances
     SET metadata = COALESCE(metadata, '{}'::jsonb) - 'calm_settled_at'
   WHERE user_id = p_user_id
     AND source = 'cron_volatility'
     AND state = 'engaged'
     AND metadata ? 'calm_settled_at';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RETURN v_n;
END;
$$;

COMMENT ON FUNCTION public.pause_clear_cron_volatility_calm_settled(uuid) IS
  'Service-role: remove calm_settled_at from engaged cron pauses when volatility is hot again (open_max_age paused until next calm sweep).';

REVOKE ALL ON FUNCTION public.pause_clear_cron_volatility_calm_settled(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pause_clear_cron_volatility_calm_settled(uuid) TO service_role;

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

COMMENT ON FUNCTION public.pause_expire_cron_volatility_context_lost(uuid) IS
  'Service-role: expire cron_volatility active|pending on calm market; stamp calm_settled_at on engaged cron rows; clear profiles.last_context when no open pause remains.';

-- Latest pause_evaluate_transitions (from 20260603120000) with calm-aware open_max_age.
CREATE OR REPLACE FUNCTION public.pause_evaluate_transitions(p_instance_id uuid)
RETURNS public.pause_state
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inst public.pause_instances%ROWTYPE;
  v_tpl  public.pause_templates%ROWTYPE;
  v_step_types text[];
  v_counted_count int;
  v_engaged_ok boolean;
  v_completed_ok boolean;
  v_brief_mode boolean;
  v_now timestamptz := now();
  v_open_max_anchor timestamptz;
BEGIN
  SELECT * INTO v_inst FROM public.pause_instances WHERE id = p_instance_id FOR UPDATE;
  IF NOT FOUND THEN RETURN NULL; END IF;
  IF v_inst.state IN ('completed', 'dismissed', 'expired') THEN RETURN v_inst.state; END IF;
  IF v_inst.state = 'pending' THEN RETURN 'pending'; END IF;

  IF v_inst.window_ends_at <= v_now THEN
    UPDATE public.pause_instances
       SET state = 'expired', expired_reason = 'window_elapsed', terminal_at = v_now
     WHERE id = p_instance_id;
    RETURN 'expired';
  END IF;

  v_open_max_anchor := public.pause_open_max_anchor_at(
    v_inst.source::text,
    v_inst.state,
    v_inst.engaged_at,
    v_inst.created_at,
    COALESCE(v_inst.metadata, '{}'::jsonb)
  );

  IF v_inst.state = 'engaged'
     AND v_open_max_anchor IS NOT NULL
     AND v_open_max_anchor <= v_now - interval '12 hours' THEN
    UPDATE public.pause_instances
       SET state = 'expired', expired_reason = 'open_max_age', terminal_at = v_now
     WHERE id = p_instance_id;
    RETURN 'expired';
  END IF;

  SELECT * INTO v_tpl FROM public.pause_templates WHERE id = v_inst.template_id;
  IF NOT FOUND THEN RETURN v_inst.state; END IF;

  SELECT COALESCE(array_agg(DISTINCT step_type::text), ARRAY[]::text[])
    INTO v_step_types
    FROM public.pause_step_events
   WHERE pause_instance_id = p_instance_id;

  SELECT count(*) INTO v_counted_count
    FROM public.pause_companion_events
   WHERE pause_instance_id = p_instance_id
     AND action = 'complete'
     AND counts_for_pause = true;

  v_brief_mode := public.pause_instance_is_brief_ritual(p_instance_id);

  IF v_tpl.slug = 'volatility_v1' THEN
    v_engaged_ok :=
      NOT v_brief_mode
      AND ARRAY['reflection_step']::text[] <@ v_step_types;
    v_completed_ok :=
      ARRAY['outcome_logged']::text[] <@ v_step_types
      AND public.pause_volatility_v1_ritual_beats_met(p_instance_id);
  ELSE
    v_engaged_ok := (v_tpl.required_for_engaged <@ v_step_types);
    v_completed_ok :=
      (v_tpl.required_for_completed <@ v_step_types)
      AND (v_counted_count >= v_tpl.required_companion_count);
  END IF;

  IF v_completed_ok THEN
    UPDATE public.pause_instances
       SET state = 'completed',
           completed_at = COALESCE(completed_at, v_now),
           engaged_at = COALESCE(engaged_at, v_now),
           terminal_at = v_now
     WHERE id = p_instance_id;
    RETURN 'completed';
  END IF;

  IF v_engaged_ok AND v_inst.state = 'active' THEN
    UPDATE public.pause_instances
       SET state = 'engaged', engaged_at = COALESCE(engaged_at, v_now)
     WHERE id = p_instance_id;
    RETURN 'engaged';
  END IF;

  RETURN v_inst.state;
END;
$$;

COMMENT ON FUNCTION public.pause_evaluate_transitions(uuid) IS
  'volatility_v1: deep engaged after reflection_step; completed requires outcome_logged + ritual beats. '
  'open_max_age: engaged cron rows 12h after metadata.calm_settled_at (set on calm sweep); other engaged 12h after COALESCE(engaged_at, created_at).';

CREATE OR REPLACE FUNCTION public.pause_sweep_window_elapsed()
RETURNS integer
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now timestamptz := now();
  v_total integer := 0;
  v_n integer;
BEGIN
  WITH victims AS (
    SELECT id
      FROM public.pause_instances
     WHERE state IN ('active', 'engaged')
       AND window_ends_at <= v_now
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.pause_instances pi
     SET state = 'expired',
         expired_reason = 'window_elapsed',
         terminal_at = v_now
    FROM victims v
   WHERE pi.id = v.id;
  GET DIAGNOSTICS v_n = ROW_COUNT;
  v_total := v_total + v_n;

  WITH victims AS (
    SELECT pi.id
      FROM public.pause_instances pi
     WHERE pi.state = 'engaged'
       AND public.pause_open_max_anchor_at(
         pi.source::text,
         pi.state,
         pi.engaged_at,
         pi.created_at,
         COALESCE(pi.metadata, '{}'::jsonb)
       ) IS NOT NULL
       AND public.pause_open_max_anchor_at(
         pi.source::text,
         pi.state,
         pi.engaged_at,
         pi.created_at,
         COALESCE(pi.metadata, '{}'::jsonb)
       ) <= v_now - interval '12 hours'
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.pause_instances pi
     SET state = 'expired',
         expired_reason = 'open_max_age',
         terminal_at = v_now
    FROM victims v
   WHERE pi.id = v.id;
  GET DIAGNOSTICS v_n = ROW_COUNT;
  v_total := v_total + v_n;

  WITH victims AS (
    SELECT id
      FROM public.pause_instances
     WHERE state = 'pending'
       AND created_at <= v_now - interval '12 hours'
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.pause_instances pi
     SET state = 'expired',
         expired_reason = 'system_cancelled',
         terminal_at = v_now,
         metadata = COALESCE(pi.metadata, '{}'::jsonb) || jsonb_build_object('pending_stale_ttl', true)
    FROM victims v
   WHERE pi.id = v.id;
  GET DIAGNOSTICS v_n = ROW_COUNT;
  v_total := v_total + v_n;

  RETURN v_total;
END;
$$;
