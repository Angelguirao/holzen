-- Align Postgres `engaged` with product/Figma: deep ritual reaches `engaged` only after
-- `reflection_step` (Reflect beat). Brief ritual never enters `engaged` — it completes
-- from `active` via `outcome_logged`. See docs/systems/pause-system.md and home-pause-widget-projection.md.

UPDATE public.pause_templates
   SET required_for_engaged = ARRAY['reflection_step']::text[]
 WHERE slug = 'volatility_v1';

-- Demote in-flight deep/brief rows that engaged under the old Feel/Breathe gates.
UPDATE public.pause_instances pi
   SET state = 'active',
       engaged_at = NULL
  FROM public.pause_templates t
 WHERE pi.template_id = t.id
   AND t.slug = 'volatility_v1'
   AND pi.state = 'engaged'
   AND NOT EXISTS (
     SELECT 1
       FROM public.pause_step_events e
      WHERE e.pause_instance_id = pi.id
        AND e.step_type = 'reflection_step'
   );

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

  IF v_inst.state = 'engaged'
     AND COALESCE(v_inst.engaged_at, v_inst.created_at) <= v_now - interval '12 hours' THEN
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
    -- Deep only: Reflect reached. Brief stays `active` until `outcome_logged` → `completed`.
    v_engaged_ok :=
      NOT v_brief_mode
      AND ARRAY['reflection_step']::text[] <@ v_step_types;
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
  'For volatility_v1: deep engaged after reflection_step only; brief never engages; '
  'completed when outcome_logged exists. '
  'open_max_age: engaged rows only — 12h after COALESCE(engaged_at, created_at).';
