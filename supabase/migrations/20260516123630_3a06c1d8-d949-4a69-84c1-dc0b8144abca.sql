-- Brief → deep upgrade from Integrate
CREATE OR REPLACE FUNCTION public.pause_instance_is_brief_ritual(p_pause_instance_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    EXISTS (SELECT 1 FROM public.pause_step_events e
       WHERE e.pause_instance_id = p_pause_instance_id AND e.step_type = 'initial_emotion_logged'
         AND ((e.payload->'brief_ritual') = 'true'::jsonb
              OR lower(trim(COALESCE(e.payload->>'brief_ritual', ''))) IN ('true', 't', '1')))
    AND NOT EXISTS (SELECT 1 FROM public.pause_step_events e
       WHERE e.pause_instance_id = p_pause_instance_id AND e.step_type = 'ritual_depth_upgraded');
$$;

CREATE OR REPLACE FUNCTION public.pause_evaluate_transitions(p_instance_id uuid)
RETURNS public.pause_state LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_inst public.pause_instances%ROWTYPE; v_tpl public.pause_templates%ROWTYPE;
  v_step_types text[]; v_counted_count int;
  v_engaged_ok boolean; v_completed_ok boolean; v_brief_mode boolean;
  v_now timestamptz := now();
BEGIN
  SELECT * INTO v_inst FROM public.pause_instances WHERE id = p_instance_id FOR UPDATE;
  IF NOT FOUND THEN RETURN NULL; END IF;
  IF v_inst.state IN ('completed','dismissed','expired') THEN RETURN v_inst.state; END IF;
  IF v_inst.state = 'pending' THEN RETURN 'pending'; END IF;
  IF v_inst.window_ends_at <= v_now THEN
    UPDATE public.pause_instances SET state='expired', expired_reason='window_elapsed', terminal_at=v_now WHERE id=p_instance_id;
    RETURN 'expired';
  END IF;
  IF v_inst.state = 'engaged' AND COALESCE(v_inst.engaged_at, v_inst.created_at) <= v_now - interval '12 hours' THEN
    UPDATE public.pause_instances SET state='expired', expired_reason='open_max_age', terminal_at=v_now WHERE id=p_instance_id;
    RETURN 'expired';
  END IF;
  SELECT * INTO v_tpl FROM public.pause_templates WHERE id = v_inst.template_id;
  IF NOT FOUND THEN RETURN v_inst.state; END IF;
  SELECT COALESCE(array_agg(DISTINCT step_type::text), ARRAY[]::text[]) INTO v_step_types
    FROM public.pause_step_events WHERE pause_instance_id = p_instance_id;
  SELECT count(*) INTO v_counted_count FROM public.pause_companion_events
   WHERE pause_instance_id = p_instance_id AND action='complete' AND counts_for_pause=true;
  v_brief_mode := public.pause_instance_is_brief_ritual(p_instance_id);
  IF v_tpl.slug = 'volatility_v1' THEN
    IF v_brief_mode THEN
      v_engaged_ok := ARRAY['initial_emotion_logged']::text[] <@ v_step_types;
    ELSE
      v_engaged_ok := ARRAY['initial_emotion_logged','breath_completed']::text[] <@ v_step_types;
    END IF;
    v_completed_ok := ARRAY['outcome_logged']::text[] <@ v_step_types;
  ELSE
    v_engaged_ok := (v_tpl.required_for_engaged <@ v_step_types);
    v_completed_ok := (v_tpl.required_for_completed <@ v_step_types) AND (v_counted_count >= v_tpl.required_companion_count);
  END IF;
  IF v_completed_ok THEN
    UPDATE public.pause_instances SET state='completed', completed_at=COALESCE(completed_at,v_now),
      engaged_at=COALESCE(engaged_at,v_now), terminal_at=v_now WHERE id=p_instance_id;
    RETURN 'completed';
  END IF;
  IF v_engaged_ok AND v_inst.state='active' THEN
    UPDATE public.pause_instances SET state='engaged', engaged_at=COALESCE(engaged_at,v_now) WHERE id=p_instance_id;
    RETURN 'engaged';
  END IF;
  RETURN v_inst.state;
END; $$;

DROP VIEW IF EXISTS public.v_pause_full CASCADE;

CREATE OR REPLACE FUNCTION public.pause_log_step(
  p_instance_id uuid, p_step_type public.pause_step_type, p_payload jsonb DEFAULT '{}'::jsonb)
RETURNS public.pause_state LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_inst public.pause_instances%ROWTYPE;
  v_uid uuid := auth.uid(); v_role text := auth.role();
  v_outcome text; v_mood text; v_intensity text;
BEGIN
  SELECT * INTO v_inst FROM public.pause_instances WHERE id = p_instance_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'pause_log_step: instance % not found', p_instance_id; END IF;
  IF v_role <> 'service_role' AND v_inst.user_id <> v_uid THEN
    RAISE EXCEPTION 'pause_log_step: not authorized';
  END IF;
  IF v_inst.state = 'pending' THEN
    RAISE EXCEPTION 'pause_log_step: instance % is a pending context offer (adopt it first)', p_instance_id;
  END IF;
  IF v_inst.state IN ('expired','dismissed') THEN
    IF p_step_type <> 'outcome_logged' THEN RETURN v_inst.state; END IF;
    IF EXISTS (SELECT 1 FROM public.pause_step_events e WHERE e.pause_instance_id=p_instance_id AND e.step_type='outcome_logged') THEN
      RETURN v_inst.state;
    END IF;
    v_outcome := COALESCE(p_payload->>'outcome','');
    IF v_outcome NOT IN ('held','bought','sold') THEN
      RAISE EXCEPTION 'pause_log_step: invalid outcome % for retrospective outcome_logged', v_outcome;
    END IF;
    INSERT INTO public.pause_step_events (pause_instance_id,user_id,step_type,payload)
    VALUES (p_instance_id,v_inst.user_id,p_step_type,COALESCE(p_payload,'{}'::jsonb));
    RETURN v_inst.state;
  END IF;
  IF v_inst.state = 'completed' THEN
    IF p_step_type <> 'post_pause_emotion_logged' THEN RETURN v_inst.state; END IF;
    v_mood := lower(trim(COALESCE(p_payload->>'mood','')));
    IF v_mood NOT IN ('calm','detached','uncertain','excited','anxious','fearful','greedy','fomo') THEN
      RAISE EXCEPTION 'pause_log_step: invalid mood % for post_pause_emotion_logged', v_mood;
    END IF;
    v_intensity := NULLIF(trim(both from COALESCE(p_payload->>'intensity','')), '');
    IF v_intensity IS NOT NULL AND v_intensity !~ '^[1-5]$' THEN
      RAISE EXCEPTION 'pause_log_step: intensity for post_pause_emotion_logged must be 1-5';
    END IF;
    INSERT INTO public.pause_step_events (pause_instance_id,user_id,step_type,payload)
    VALUES (p_instance_id,v_inst.user_id,p_step_type,COALESCE(p_payload,'{}'::jsonb));
    RETURN v_inst.state;
  END IF;
  IF p_step_type = 'ritual_depth_upgraded' THEN
    IF EXISTS (SELECT 1 FROM public.pause_step_events e WHERE e.pause_instance_id=p_instance_id AND e.step_type='ritual_depth_upgraded') THEN
      RETURN v_inst.state;
    END IF;
    IF NOT public.pause_instance_is_brief_ritual(p_instance_id) THEN
      RAISE EXCEPTION 'pause_log_step: ritual_depth_upgraded requires brief_ritual on initial_emotion_logged';
    END IF;
    p_payload := COALESCE(p_payload,'{}'::jsonb) || jsonb_build_object('from','brief','to','deep');
  END IF;
  IF p_step_type = 'outcome_logged' THEN
    v_outcome := COALESCE(p_payload->>'outcome','');
    IF v_outcome NOT IN ('held','bought','sold') THEN
      RAISE EXCEPTION 'pause_log_step: invalid outcome % for outcome_logged', v_outcome;
    END IF;
  END IF;
  INSERT INTO public.pause_step_events (pause_instance_id,user_id,step_type,payload)
  VALUES (p_instance_id,v_inst.user_id,p_step_type,COALESCE(p_payload,'{}'::jsonb));
  SELECT state INTO v_inst.state FROM public.pause_instances WHERE id = p_instance_id;
  RETURN v_inst.state;
END; $$;

CREATE OR REPLACE VIEW public.v_pause_full WITH (security_invoker = true) AS
SELECT pi.*,
  (EXISTS (SELECT 1 FROM public.pause_step_events e WHERE e.pause_instance_id=pi.id AND e.step_type='breath_completed')) AS has_breath_completed,
  (EXISTS (SELECT 1 FROM public.pause_step_events e WHERE e.pause_instance_id=pi.id AND e.step_type='initial_emotion_logged')) AS has_initial_emotion_logged,
  (EXISTS (SELECT 1 FROM public.pause_step_events e WHERE e.pause_instance_id=pi.id AND e.step_type='shift_emotion_logged')) AS has_shift_emotion_logged,
  (EXISTS (SELECT 1 FROM public.pause_step_events e WHERE e.pause_instance_id=pi.id AND e.step_type='post_pause_emotion_logged')) AS has_post_pause_emotion_logged,
  (EXISTS (SELECT 1 FROM public.pause_step_events e WHERE e.pause_instance_id=pi.id AND e.step_type='outcome_logged')) AS has_outcome_logged,
  (SELECT payload->>'mood' FROM public.pause_step_events e WHERE e.pause_instance_id=pi.id AND e.step_type='initial_emotion_logged' ORDER BY e.created_at DESC LIMIT 1) AS initial_mood,
  (SELECT payload->>'mood' FROM public.pause_step_events e WHERE e.pause_instance_id=pi.id AND e.step_type='shift_emotion_logged' ORDER BY e.created_at DESC LIMIT 1) AS shift_mood,
  (SELECT payload->>'outcome' FROM public.pause_step_events e WHERE e.pause_instance_id=pi.id AND e.step_type='outcome_logged' ORDER BY e.created_at DESC LIMIT 1) AS outcome,
  (SELECT payload->>'text' FROM public.pause_step_events e WHERE e.pause_instance_id=pi.id AND e.step_type='note_updated' ORDER BY e.created_at DESC LIMIT 1) AS note_text,
  (SELECT ARRAY(SELECT jsonb_array_elements_text(payload->'tags')) FROM public.pause_step_events e WHERE e.pause_instance_id=pi.id AND e.step_type='tag_updated' ORDER BY e.created_at DESC LIMIT 1) AS tags,
  COALESCE((SELECT (payload->>'is_favorite')::boolean FROM public.pause_step_events e WHERE e.pause_instance_id=pi.id AND e.step_type='favorite_toggled' ORDER BY e.created_at DESC LIMIT 1), false) AS is_favorite,
  (SELECT count(*) FROM public.pause_companion_events ce WHERE ce.pause_instance_id=pi.id AND ce.action='complete' AND ce.counts_for_pause=true)::int AS counted_companion_count,
  (SELECT COALESCE(array_agg(DISTINCT ce.companion_type), ARRAY[]::text[]) FROM public.pause_companion_events ce WHERE ce.pause_instance_id=pi.id AND ce.action='complete' AND ce.counts_for_pause=true) AS counted_companion_types,
  (SELECT content->>'message' FROM public.pause_ai_artifacts a WHERE a.pause_instance_id=pi.id AND a.kind='reflection_text' LIMIT 1) AS reflection_text,
  (SELECT content->>'haiku' FROM public.pause_ai_artifacts a WHERE a.pause_instance_id=pi.id AND a.kind='haiku' LIMIT 1) AS haiku_text,
  (SELECT NULLIF(trim(both from (e.payload->>'intensity')), '')::smallint FROM public.pause_step_events e WHERE e.pause_instance_id=pi.id AND e.step_type='initial_emotion_logged' ORDER BY e.created_at DESC LIMIT 1) AS initial_emotion_intensity,
  (SELECT NULLIF(trim(both from (e.payload->>'shift_intensity')), '')::smallint FROM public.pause_step_events e WHERE e.pause_instance_id=pi.id AND e.step_type='shift_emotion_logged' ORDER BY e.created_at DESC LIMIT 1) AS shift_emotion_intensity,
  (SELECT payload->>'mood' FROM public.pause_step_events e WHERE e.pause_instance_id=pi.id AND e.step_type='post_pause_emotion_logged' ORDER BY e.created_at DESC LIMIT 1) AS post_pause_mood,
  (SELECT NULLIF(trim(both from (e.payload->>'intensity')), '')::smallint FROM public.pause_step_events e WHERE e.pause_instance_id=pi.id AND e.step_type='post_pause_emotion_logged' ORDER BY e.created_at DESC LIMIT 1) AS post_pause_emotion_intensity,
  public.pause_instance_is_brief_ritual(pi.id) AS is_brief_ritual
FROM public.pause_instances pi;

CREATE OR REPLACE VIEW public.v_pause_archive_pauses AS
SELECT vf.* FROM public.v_pause_full vf
WHERE vf.state NOT IN ('active','engaged','pending')
  AND NOT ((vf.state='expired' AND vf.engaged_at IS NULL AND vf.expired_reason IS DISTINCT FROM 'superseded'::public.pause_expired_reason)
    OR (vf.state='dismissed' AND vf.engaged_at IS NULL));
ALTER VIEW public.v_pause_archive_pauses SET (security_invoker = true);

CREATE OR REPLACE VIEW public.v_pause_archive_echoes AS
SELECT vf.* FROM public.v_pause_full vf
WHERE vf.state NOT IN ('active','engaged','pending') AND vf.engaged_at IS NULL
  AND (vf.state='dismissed' OR (vf.state='expired' AND vf.expired_reason IS DISTINCT FROM 'superseded'::public.pause_expired_reason));
ALTER VIEW public.v_pause_archive_echoes SET (security_invoker = true);

GRANT SELECT ON public.v_pause_archive_pauses TO authenticated, service_role;
GRANT SELECT ON public.v_pause_archive_echoes TO authenticated, service_role;