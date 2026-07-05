-- Practice Presence XP v2: brief/deep base + deep-only optional bonuses.
-- Completion: volatility_v1 requires full ritual beats before outcome_logged / completed.
-- Parity: src/features/pause/domain/practice/compute-practice-xp-breakdown.ts

CREATE OR REPLACE FUNCTION public.pause_volatility_v1_ritual_beats_met(p_pause_instance_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_brief boolean;
BEGIN
  v_brief := public.pause_instance_is_brief_ritual(p_pause_instance_id);

  IF NOT EXISTS (
    SELECT 1 FROM public.pause_step_events e
     WHERE e.pause_instance_id = p_pause_instance_id
       AND e.step_type = 'initial_emotion_logged'
  ) THEN
    RETURN false;
  END IF;

  IF v_brief THEN
    RETURN EXISTS (
      SELECT 1 FROM public.pause_step_events e
       WHERE e.pause_instance_id = p_pause_instance_id
         AND e.step_type = 'breath_completed'
         AND COALESCE((e.payload->>'skipped')::boolean, false) IS NOT TRUE
    );
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.pause_step_events e
     WHERE e.pause_instance_id = p_pause_instance_id
       AND e.step_type = 'breath_completed'
       AND COALESCE((e.payload->>'breath_segment')::int, 1) = 1
  )
  AND EXISTS (
    SELECT 1 FROM public.pause_step_events e
     WHERE e.pause_instance_id = p_pause_instance_id
       AND e.step_type = 'reflection_step'
  )
  AND EXISTS (
    SELECT 1 FROM public.pause_step_events e
     WHERE e.pause_instance_id = p_pause_instance_id
       AND e.step_type = 'shift_emotion_logged'
  )
  AND EXISTS (
    SELECT 1 FROM public.pause_step_events e
     WHERE e.pause_instance_id = p_pause_instance_id
       AND e.step_type = 'breath_completed'
       AND COALESCE((e.payload->>'breath_segment')::int, 0) = 2
  );
END;
$$;

COMMENT ON FUNCTION public.pause_volatility_v1_ritual_beats_met(uuid) IS
  'volatility_v1 ritual beats before Decide: brief feel+breath (unskipped); deep feel, breathe1, reflect, frame, breathe2.';

CREATE OR REPLACE FUNCTION public.pause_empty_xp_by_signal()
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'base_brief', 0,
    'base_deep', 0,
    'favorite', 0,
    'note', 0,
    'companions', 0,
    'companion_favorites', 0,
    'breath_second', 0,
    'shift_mood', 0
  );
$$;

CREATE OR REPLACE FUNCTION public.pause_compute_practice_xp_breakdown(p_pause_instance_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_brief boolean;
  v_tools int := 0;
  v_companion_fav_xp int := 0;
  v_favorite int := 0;
  v_note int := 0;
  v_companions int := 0;
  v_breath_second int := 0;
  v_shift_mood int := 0;
  v_row record;
  v_meta jsonb;
BEGIN
  IF NOT public.pause_volatility_v1_ritual_beats_met(p_pause_instance_id) THEN
    RETURN public.pause_empty_xp_by_signal();
  END IF;

  v_brief := public.pause_instance_is_brief_ritual(p_pause_instance_id);

  IF v_brief THEN
    RETURN jsonb_build_object(
      'base_brief', 10,
      'base_deep', 0,
      'favorite', 0,
      'note', 0,
      'companions', 0,
      'companion_favorites', 0,
      'breath_second', 0,
      'shift_mood', 0
    );
  END IF;

  FOR v_row IN
    SELECT e.step_type::text AS step_type, e.payload
      FROM public.pause_step_events e
     WHERE e.pause_instance_id = p_pause_instance_id
  LOOP
    CASE v_row.step_type
      WHEN 'favorite_toggled' THEN
        IF COALESCE((v_row.payload->>'is_favorite')::boolean, false)
           OR (v_row.payload->'is_favorite') = 'true'::jsonb THEN
          v_favorite := 2;
        END IF;
      WHEN 'note_updated' THEN
        IF length(trim(COALESCE(v_row.payload->>'text', ''))) > 0 THEN
          v_note := 3;
        END IF;
      WHEN 'shift_emotion_logged' THEN
        IF trim(COALESCE(v_row.payload->>'mood', '')) <> ''
           AND COALESCE((v_row.payload->>'from_frame_hub')::boolean, false) IS NOT TRUE THEN
          v_shift_mood := 3;
        END IF;
      WHEN 'breath_completed' THEN
        IF COALESCE((v_row.payload->>'breath_segment')::int, 0) = 2
           AND COALESCE((v_row.payload->>'skipped')::boolean, false) IS NOT TRUE THEN
          v_breath_second := 4;
        END IF;
      ELSE NULL;
    END CASE;
  END LOOP;

  SELECT count(*)::int INTO v_tools
    FROM public.pause_companion_events c
   WHERE c.pause_instance_id = p_pause_instance_id
     AND c.action = 'complete'
     AND c.counts_for_pause = true;

  IF v_tools > 0 THEN
    v_companions := LEAST(6, 2 * v_tools);
  END IF;

  SELECT metadata INTO v_meta FROM public.pause_instances WHERE id = p_pause_instance_id;
  IF v_meta IS NOT NULL AND v_meta ? 'companion_slot_favorites' THEN
    SELECT count(*)::int INTO v_companion_fav_xp
      FROM jsonb_each(COALESCE(v_meta->'companion_slot_favorites', '{}'::jsonb)) AS slot(entry, val)
     WHERE val = 'true'::jsonb OR lower(trim(val::text)) IN ('true', 't', '1');
    IF v_companion_fav_xp > 0 THEN
      v_companion_fav_xp := LEAST(4, 2 * v_companion_fav_xp);
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'base_brief', 0,
    'base_deep', 18,
    'favorite', v_favorite,
    'note', v_note,
    'companions', v_companions,
    'companion_favorites', COALESCE(v_companion_fav_xp, 0),
    'breath_second', v_breath_second,
    'shift_mood', v_shift_mood
  );
END;
$$;

COMMENT ON FUNCTION public.pause_compute_practice_xp_breakdown(uuid) IS
  'Per-pause Presence XP v2: brief base 10; deep base 18 + optional deep bonuses only.';

CREATE OR REPLACE FUNCTION public.pause_compute_practice_xp_awarded(p_pause_instance_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT sum((value)::integer)
        FROM jsonb_each_text(public.pause_compute_practice_xp_breakdown(p_pause_instance_id))
    ),
    0
  );
$$;

CREATE OR REPLACE FUNCTION public.get_practice_summary(p_user_id uuid DEFAULT auth.uid())
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_role text := auth.role();
  v_profile public.profiles%ROWTYPE;
  v_brief int;
  v_deep int;
  v_signals jsonb;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'completed_pause_count', 0,
      'presence_xp_total', 0,
      'completed_brief_count', 0,
      'completed_deep_count', 0,
      'xp_by_signal', public.pause_empty_xp_by_signal()
    );
  END IF;

  IF v_role <> 'service_role' THEN
    IF v_uid IS NULL OR v_uid <> p_user_id THEN
      RAISE EXCEPTION 'get_practice_summary: not authorized' USING ERRCODE = '42501';
    END IF;
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE user_id = p_user_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'completed_pause_count', 0,
      'presence_xp_total', 0,
      'completed_brief_count', 0,
      'completed_deep_count', 0,
      'xp_by_signal', public.pause_empty_xp_by_signal()
    );
  END IF;

  SELECT count(*)::int INTO v_brief
    FROM public.pause_instances pi
   WHERE pi.user_id = p_user_id
     AND pi.state = 'completed'
     AND public.pause_instance_is_brief_ritual(pi.id);

  v_deep := GREATEST(v_profile.completed_pause_count - v_brief, 0);

  SELECT jsonb_build_object(
    'base_brief', COALESCE(sum((b->>'base_brief')::integer), 0),
    'base_deep', COALESCE(sum((b->>'base_deep')::integer), 0),
    'favorite', COALESCE(sum((b->>'favorite')::integer), 0),
    'note', COALESCE(sum((b->>'note')::integer), 0),
    'companions', COALESCE(sum((b->>'companions')::integer), 0),
    'companion_favorites', COALESCE(sum((b->>'companion_favorites')::integer), 0),
    'breath_second', COALESCE(sum((b->>'breath_second')::integer), 0),
    'shift_mood', COALESCE(sum((b->>'shift_mood')::integer), 0)
  )
    INTO v_signals
    FROM public.pause_instances pi
   CROSS JOIN LATERAL (
     SELECT public.pause_compute_practice_xp_breakdown(pi.id) AS b
   ) breakdown
   WHERE pi.user_id = p_user_id
     AND pi.state = 'completed';

  IF v_signals IS NULL THEN
    v_signals := public.pause_empty_xp_by_signal();
  END IF;

  RETURN jsonb_build_object(
    'completed_pause_count', v_profile.completed_pause_count,
    'presence_xp_total', v_profile.practice_presence_xp_total,
    'completed_brief_count', v_brief,
    'completed_deep_count', v_deep,
    'xp_by_signal', v_signals
  );
END;
$$;

-- volatility_v1: completed only when outcome exists AND ritual beats met.
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
  'volatility_v1: deep engaged after reflection_step; completed requires outcome_logged + ritual beats.';

CREATE OR REPLACE FUNCTION public.pause_log_step(
  p_instance_id uuid, p_step_type public.pause_step_type, p_payload jsonb DEFAULT '{}'::jsonb
) RETURNS public.pause_state LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_inst public.pause_instances%ROWTYPE;
  v_tpl public.pause_templates%ROWTYPE;
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

    SELECT * INTO v_tpl FROM public.pause_templates WHERE id = v_inst.template_id;
    IF FOUND AND v_tpl.slug = 'volatility_v1' THEN
      IF NOT public.pause_volatility_v1_ritual_beats_met(p_instance_id) THEN
        RAISE EXCEPTION 'pause_log_step: outcome_logged requires full volatility_v1 ritual beats before Decide';
      END IF;
    END IF;
  END IF;

  INSERT INTO public.pause_step_events (pause_instance_id, user_id, step_type, payload)
  VALUES (p_instance_id, v_inst.user_id, p_step_type, COALESCE(p_payload, '{}'::jsonb));

  SELECT state INTO v_inst.state FROM public.pause_instances WHERE id = p_instance_id;
  RETURN v_inst.state;
END; $$;

COMMENT ON FUNCTION public.pause_log_step(uuid, public.pause_step_type, jsonb) IS
  'Logs pause_step_events. volatility_v1 outcome_logged requires ritual beats; retrospective outcome on expired/dismissed rejected.';

-- Recompute XP for all completed pauses and reconcile profile totals.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT id FROM public.pause_instances WHERE state = 'completed' ORDER BY completed_at NULLS LAST, id
  LOOP
    PERFORM public.pause_finalize_practice_xp(r.id);
  END LOOP;
END;
$$;

UPDATE public.profiles p
   SET completed_pause_count = COALESCE(sub.cnt, 0),
       practice_presence_xp_total = COALESCE(sub.xp, 0)
  FROM (
    SELECT user_id,
           count(*)::integer AS cnt,
           COALESCE(sum(practice_xp_awarded), 0)::integer AS xp
      FROM public.pause_instances
     WHERE state = 'completed'
     GROUP BY user_id
  ) sub
 WHERE p.user_id = sub.user_id;

REVOKE ALL ON FUNCTION public.pause_volatility_v1_ritual_beats_met(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pause_volatility_v1_ritual_beats_met(uuid) TO service_role;
