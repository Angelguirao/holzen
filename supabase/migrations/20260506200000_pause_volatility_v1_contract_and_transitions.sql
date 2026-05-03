-- ============================================================================
-- Pause: volatility_v1 template contract + pause_evaluate_transitions
--
-- * `volatility_v1` stays at version 1; row is UPDATEd in place for existing DBs.
-- * `required_companion_count` → 0 (companions no longer gate engaged/completed).
-- * `required_for_completed` column documents minimal terminal key (`outcome_logged`);
--   full deep vs brief gates live in this function (not only the array).
-- * `pause_evaluate_transitions`: restore `pending` short-circuit + `brief_ritual`
--   branch (regression fix after 20260504103000 overwrote the function), split
--   engaged rules brief vs deep, drop companion count from completion.
-- ============================================================================

UPDATE public.pause_templates
SET
  required_for_engaged = ARRAY['initial_emotion_logged', 'breath_completed']::text[],
  required_for_completed = ARRAY['outcome_logged']::text[],
  required_companion_count = 0
WHERE slug = 'volatility_v1';

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

  IF v_inst.state IN ('active', 'engaged') AND v_inst.created_at <= v_now - interval '12 hours' THEN
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

    IF v_brief_mode THEN
      v_completed_ok :=
        ARRAY['breath_completed', 'initial_emotion_logged', 'outcome_logged']::text[] <@ v_step_types;
    ELSE
      v_completed_ok :=
        ARRAY['breath_completed', 'initial_emotion_logged', 'shift_emotion_logged', 'outcome_logged']::text[]
          <@ v_step_types;
    END IF;
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
  'volatility_v1 engaged: brief initial only; deep initial+breath (set). '
  'volatility_v1 completion in this revision superseded by 20260510120000. '
  'Other slugs use required_for_* and required_companion_count.';
