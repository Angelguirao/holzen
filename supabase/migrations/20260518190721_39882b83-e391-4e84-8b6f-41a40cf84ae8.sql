DROP VIEW IF EXISTS public.v_pause_full CASCADE;

CREATE OR REPLACE FUNCTION public.pause_log_step(
  p_instance_id uuid,
  p_step_type public.pause_step_type,
  p_payload jsonb DEFAULT '{}'::jsonb
)
RETURNS public.pause_state
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
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
  IF v_role <> 'service_role' AND v_inst.user_id <> v_uid THEN
    RAISE EXCEPTION 'pause_log_step: not authorized';
  END IF;

  IF v_inst.state = 'pending' THEN
    RAISE EXCEPTION 'pause_log_step: instance % is a pending context offer (adopt it first)', p_instance_id;
  END IF;

  IF v_inst.state = 'expired' THEN
    IF p_step_type <> 'outcome_logged' THEN
      RETURN v_inst.state;
    END IF;
    IF EXISTS (
      SELECT 1 FROM public.pause_step_events e
      WHERE e.pause_instance_id = p_instance_id AND e.step_type = 'outcome_logged'
    ) THEN
      RETURN v_inst.state;
    END IF;
    v_outcome := COALESCE(p_payload->>'outcome', '');
    IF v_outcome NOT IN ('held', 'bought', 'sold') THEN
      RAISE EXCEPTION 'pause_log_step: invalid outcome % for retrospective outcome_logged', v_outcome;
    END IF;
    INSERT INTO public.pause_step_events (pause_instance_id, user_id, step_type, payload)
    VALUES (p_instance_id, v_inst.user_id, p_step_type, COALESCE(p_payload, '{}'::jsonb));
    RETURN v_inst.state;
  END IF;

  IF v_inst.state = 'dismissed' THEN
    IF p_step_type <> 'outcome_logged' THEN
      RETURN v_inst.state;
    END IF;
    IF EXISTS (
      SELECT 1 FROM public.pause_step_events e
      WHERE e.pause_instance_id = p_instance_id AND e.step_type = 'outcome_logged'
    ) THEN
      RETURN v_inst.state;
    END IF;
    v_outcome := COALESCE(p_payload->>'outcome', '');
    IF v_outcome NOT IN ('held', 'bought', 'sold') THEN
      RAISE EXCEPTION 'pause_log_step: invalid outcome % for retrospective outcome_logged', v_outcome;
    END IF;
    INSERT INTO public.pause_step_events (pause_instance_id, user_id, step_type, payload)
    VALUES (p_instance_id, v_inst.user_id, p_step_type, COALESCE(p_payload, '{}'::jsonb));
    RETURN v_inst.state;
  END IF;

  IF v_inst.state = 'completed' THEN
    IF p_step_type <> 'post_pause_emotion_logged' THEN
      RETURN v_inst.state;
    END IF;
    v_mood := lower(trim(COALESCE(p_payload->>'mood', '')));
    IF v_mood NOT IN ('calm', 'detached', 'uncertain', 'excited', 'anxious', 'fearful', 'greedy', 'fomo') THEN
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

  IF p_step_type = 'outcome_logged' THEN
    v_outcome := COALESCE(p_payload->>'outcome', '');
    IF v_outcome NOT IN ('held', 'bought', 'sold') THEN
      RAISE EXCEPTION 'pause_log_step: invalid outcome % for outcome_logged', v_outcome;
    END IF;
  END IF;

  INSERT INTO public.pause_step_events (pause_instance_id, user_id, step_type, payload)
  VALUES (p_instance_id, v_inst.user_id, p_step_type, COALESCE(p_payload, '{}'::jsonb));

  SELECT state INTO v_inst.state FROM public.pause_instances WHERE id = p_instance_id;
  RETURN v_inst.state;
END;
$$;

CREATE OR REPLACE VIEW public.v_pause_full WITH (security_invoker = true) AS
SELECT
  pi.*,
  (EXISTS (SELECT 1 FROM public.pause_step_events e WHERE e.pause_instance_id = pi.id AND e.step_type = 'breath_completed')) AS has_breath_completed,
  (EXISTS (SELECT 1 FROM public.pause_step_events e WHERE e.pause_instance_id = pi.id AND e.step_type = 'initial_emotion_logged')) AS has_initial_emotion_logged,
  (EXISTS (SELECT 1 FROM public.pause_step_events e WHERE e.pause_instance_id = pi.id AND e.step_type = 'shift_emotion_logged')) AS has_shift_emotion_logged,
  (EXISTS (SELECT 1 FROM public.pause_step_events e WHERE e.pause_instance_id = pi.id AND e.step_type = 'post_pause_emotion_logged')) AS has_post_pause_emotion_logged,
  (EXISTS (SELECT 1 FROM public.pause_step_events e WHERE e.pause_instance_id = pi.id AND e.step_type = 'outcome_logged')) AS has_outcome_logged,
  (SELECT payload->>'mood' FROM public.pause_step_events e WHERE e.pause_instance_id = pi.id AND e.step_type = 'initial_emotion_logged' ORDER BY e.created_at DESC LIMIT 1) AS initial_mood,
  (SELECT payload->>'mood' FROM public.pause_step_events e WHERE e.pause_instance_id = pi.id AND e.step_type = 'shift_emotion_logged' ORDER BY e.created_at DESC LIMIT 1) AS shift_mood,
  (SELECT payload->>'outcome' FROM public.pause_step_events e WHERE e.pause_instance_id = pi.id AND e.step_type = 'outcome_logged' ORDER BY e.created_at DESC LIMIT 1) AS outcome,
  (SELECT payload->>'text' FROM public.pause_step_events e WHERE e.pause_instance_id = pi.id AND e.step_type = 'note_updated' ORDER BY e.created_at DESC LIMIT 1) AS note_text,
  (SELECT ARRAY(SELECT jsonb_array_elements_text(payload->'tags')) FROM public.pause_step_events e WHERE e.pause_instance_id = pi.id AND e.step_type = 'tag_updated' ORDER BY e.created_at DESC LIMIT 1) AS tags,
  COALESCE((SELECT (payload->>'is_favorite')::boolean FROM public.pause_step_events e WHERE e.pause_instance_id = pi.id AND e.step_type = 'favorite_toggled' ORDER BY e.created_at DESC LIMIT 1), false) AS is_favorite,
  (SELECT count(*) FROM public.pause_companion_events ce WHERE ce.pause_instance_id = pi.id AND ce.action='complete' AND ce.counts_for_pause=true)::int AS counted_companion_count,
  (SELECT COALESCE(array_agg(DISTINCT ce.companion_type), ARRAY[]::text[]) FROM public.pause_companion_events ce WHERE ce.pause_instance_id = pi.id AND ce.action='complete' AND ce.counts_for_pause=true) AS counted_companion_types,
  (SELECT content->>'message' FROM public.pause_ai_artifacts a WHERE a.pause_instance_id = pi.id AND a.kind = 'reflection_text' LIMIT 1) AS reflection_text,
  (SELECT content->>'haiku' FROM public.pause_ai_artifacts a WHERE a.pause_instance_id = pi.id AND a.kind = 'haiku' LIMIT 1) AS haiku_text,
  (SELECT NULLIF(trim(both from (e.payload->>'intensity')), '')::smallint
     FROM public.pause_step_events e
    WHERE e.pause_instance_id = pi.id AND e.step_type = 'initial_emotion_logged'
    ORDER BY e.created_at DESC LIMIT 1) AS initial_emotion_intensity,
  (SELECT NULLIF(trim(both from (e.payload->>'shift_intensity')), '')::smallint
     FROM public.pause_step_events e
    WHERE e.pause_instance_id = pi.id AND e.step_type = 'shift_emotion_logged'
    ORDER BY e.created_at DESC LIMIT 1) AS shift_emotion_intensity,
  (SELECT payload->>'mood' FROM public.pause_step_events e WHERE e.pause_instance_id = pi.id AND e.step_type = 'post_pause_emotion_logged' ORDER BY e.created_at DESC LIMIT 1) AS post_pause_mood,
  (SELECT NULLIF(trim(both from (e.payload->>'intensity')), '')::smallint
     FROM public.pause_step_events e
    WHERE e.pause_instance_id = pi.id AND e.step_type = 'post_pause_emotion_logged'
    ORDER BY e.created_at DESC LIMIT 1) AS post_pause_emotion_intensity,
  (EXISTS (
    SELECT 1
      FROM public.pause_step_events e
     WHERE e.pause_instance_id = pi.id
       AND e.step_type = 'initial_emotion_logged'
       AND (
         (e.payload->'brief_ritual') = 'true'::jsonb
         OR lower(trim(COALESCE(e.payload->>'brief_ritual', ''))) IN ('true', 't', '1')
       )
  )) AS is_brief_ritual
FROM public.pause_instances pi;

CREATE OR REPLACE VIEW public.v_pause_archive_pauses AS
SELECT vf.*
FROM public.v_pause_full vf
WHERE vf.state NOT IN ('active', 'engaged', 'pending')
  AND NOT (
    (
      vf.state = 'expired'
      AND vf.engaged_at IS NULL
      AND vf.expired_reason IS DISTINCT FROM 'superseded'::public.pause_expired_reason
    )
    OR (vf.state = 'dismissed' AND vf.engaged_at IS NULL)
  );

ALTER VIEW public.v_pause_archive_pauses SET (security_invoker = true);

CREATE OR REPLACE VIEW public.v_pause_archive_echoes AS
SELECT vf.*
FROM public.v_pause_full vf
WHERE vf.state NOT IN ('active', 'engaged', 'pending')
  AND vf.engaged_at IS NULL
  AND (
    vf.state = 'dismissed'
    OR (
      vf.state = 'expired'
      AND vf.expired_reason IS DISTINCT FROM 'superseded'::public.pause_expired_reason
    )
  );

ALTER VIEW public.v_pause_archive_echoes SET (security_invoker = true);

GRANT SELECT ON public.v_pause_archive_pauses TO authenticated;
GRANT SELECT ON public.v_pause_archive_pauses TO service_role;
GRANT SELECT ON public.v_pause_archive_echoes TO authenticated;
GRANT SELECT ON public.v_pause_archive_echoes TO service_role;