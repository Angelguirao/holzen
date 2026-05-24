-- Close retrospective outcome_logged on expired/dismissed instances (pause-first product stance).
-- In-ritual Decide on active/engaged rows is unchanged. Existing retrospective rows are preserved.

CREATE OR REPLACE FUNCTION public.pause_log_step(
  p_instance_id uuid, p_step_type public.pause_step_type, p_payload jsonb DEFAULT '{}'::jsonb
) RETURNS public.pause_state LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_inst public.pause_instances%ROWTYPE;
  v_uid uuid := auth.uid();
  v_role text := auth.role();
  v_outcome text;
  v_mood text;
  v_intensity text;
BEGIN
  SELECT * INTO v_inst FROM public.pause_instances WHERE id = p_instance_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'pause_log_step: instance % not found', p_instance_id; END IF;
  IF v_role <> 'service_role' AND v_inst.user_id <> v_uid THEN RAISE EXCEPTION 'pause_log_step: not authorized'; END IF;
  IF v_inst.state = 'pending' THEN RAISE EXCEPTION 'pause_log_step: instance % is a pending context offer (adopt it first)', p_instance_id; END IF;

  IF v_inst.state IN ('expired', 'dismissed') THEN
    IF p_step_type = 'outcome_logged' THEN
      RAISE EXCEPTION 'pause_log_step: retrospective outcome_logged is not supported (instance state %)', v_inst.state;
    END IF;
    RETURN v_inst.state;
  END IF;

  IF v_inst.state = 'completed' THEN
    IF p_step_type <> 'post_pause_emotion_logged' THEN RETURN v_inst.state; END IF;
    v_mood := lower(trim(COALESCE(p_payload->>'mood', '')));
    IF v_mood NOT IN ('calm','detached','uncertain','excited','anxious','fearful','greedy','fomo') THEN
      RAISE EXCEPTION 'pause_log_step: invalid mood % for post_pause_emotion_logged', v_mood;
    END IF;
    v_intensity := NULLIF(trim(both from COALESCE(p_payload->>'intensity', '')), '');
    IF v_intensity IS NOT NULL AND v_intensity !~ '^[1-5]$' THEN
      RAISE EXCEPTION 'pause_log_step: intensity for post_pause_emotion_logged must be 1-5';
    END IF;
    INSERT INTO public.pause_step_events (pause_instance_id, user_id, step_type, payload)
    VALUES (p_instance_id, v_inst.user_id, p_step_type, COALESCE(p_payload, '{}'::jsonb));
    RETURN v_inst.state;
  END IF;

  IF p_step_type = 'ritual_depth_upgraded' THEN
    IF EXISTS (SELECT 1 FROM public.pause_step_events e WHERE e.pause_instance_id = p_instance_id AND e.step_type = 'ritual_depth_upgraded') THEN
      RETURN v_inst.state;
    END IF;
    IF NOT public.pause_instance_is_brief_ritual(p_instance_id) THEN
      RAISE EXCEPTION 'pause_log_step: ritual_depth_upgraded requires brief_ritual on initial_emotion_logged';
    END IF;
    p_payload := COALESCE(p_payload, '{}'::jsonb) || jsonb_build_object('from', 'brief', 'to', 'deep');
  END IF;

  IF p_step_type = 'outcome_logged' THEN
    v_outcome := COALESCE(p_payload->>'outcome', '');
    IF v_outcome NOT IN ('held','bought','sold') THEN RAISE EXCEPTION 'pause_log_step: invalid outcome % for outcome_logged', v_outcome; END IF;
  END IF;

  INSERT INTO public.pause_step_events (pause_instance_id, user_id, step_type, payload)
  VALUES (p_instance_id, v_inst.user_id, p_step_type, COALESCE(p_payload, '{}'::jsonb));

  SELECT state INTO v_inst.state FROM public.pause_instances WHERE id = p_instance_id;
  RETURN v_inst.state;
END; $$;

COMMENT ON FUNCTION public.pause_log_step(uuid, public.pause_step_type, jsonb) IS
  'Logs pause_step_events. outcome_logged on active/engaged completes volatility_v1; retrospective outcome_logged on expired/dismissed is rejected (May 2026).';
