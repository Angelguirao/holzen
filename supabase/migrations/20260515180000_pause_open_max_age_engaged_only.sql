-- open_max_age applies only to **engaged** pauses (12h from COALESCE(engaged_at, created_at)).
-- **active** rows are not time-expired by open_max_age; they end via context/supersede/dismiss/window, etc.

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

  IF v_inst.state = 'engaged' AND COALESCE(v_inst.engaged_at, v_inst.created_at) <= v_now - interval '12 hours' THEN
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

  SELECT EXISTS (
    SELECT 1
      FROM public.pause_step_events e
     WHERE e.pause_instance_id = p_instance_id
       AND e.step_type = 'initial_emotion_logged'
       AND (
         (e.payload->'brief_ritual') = 'true'::jsonb
         OR lower(trim(COALESCE(e.payload->>'brief_ritual', ''))) IN ('true', 't', '1')
       )
     LIMIT 1
  ) INTO v_brief_mode;

  IF v_tpl.slug = 'volatility_v1' THEN
    IF v_brief_mode THEN
      v_engaged_ok := ARRAY['initial_emotion_logged']::text[] <@ v_step_types;
    ELSE
      v_engaged_ok :=
        ARRAY['initial_emotion_logged', 'breath_completed']::text[] <@ v_step_types;
    END IF;

    v_completed_ok := ARRAY['outcome_logged']::text[] <@ v_step_types;
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
  'Evaluates pause_instances.state from step/companion events + template. '
  'For volatility_v1: brief engaged after initial_emotion_logged only; deep engaged '
  'when initial_emotion_logged and breath_completed both exist; completed when outcome_logged exists. '
  'open_max_age: engaged rows only — 12h after COALESCE(engaged_at, created_at). '
  'Active rows are not expired by open_max_age.';

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
    SELECT id
      FROM public.pause_instances
     WHERE state = 'engaged'
       AND COALESCE(engaged_at, created_at) <= v_now - interval '12 hours'
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
