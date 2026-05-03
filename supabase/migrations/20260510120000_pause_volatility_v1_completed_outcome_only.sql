-- ============================================================================
-- Pause: volatility_v1 — `completed` means `outcome_logged` exists
--
-- Product: one row per pause, no separate "echo" entity; terminal `completed`
-- aligns with "a choice was recorded" (`outcome_logged`). The ritual UI still
-- walks users through prior beats, but the state machine does not require them
-- for `completed` on this slug. Brief vs deep split remains **only** for
-- `active` → `engaged`: brief = `initial_emotion_logged` only; deep = that plus
-- `breath_completed` (Feel then first Breathe in UI; Postgres checks a type set).
-- ============================================================================

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
  'when initial_emotion_logged and breath_completed both exist (set check; Feel before '
  'Breathe in normal UI); completed when outcome_logged exists. Other slugs use '
  'required_for_* and required_companion_count.';

-- Repair rows that already have an outcome but were still active|engaged under the old rule set.
UPDATE public.pause_instances pi
SET
  state = 'completed',
  completed_at = COALESCE(pi.completed_at, now()),
  engaged_at = COALESCE(pi.engaged_at, now()),
  terminal_at = now()
FROM public.pause_templates t
WHERE pi.template_id = t.id
  AND t.slug = 'volatility_v1'
  AND pi.state IN ('active', 'engaged')
  AND EXISTS (
    SELECT 1
      FROM public.pause_step_events e
     WHERE e.pause_instance_id = pi.id
       AND e.step_type = 'outcome_logged'
  );
