-- Brief Done post-pause check-in XP (+5 when feel changed after Decide).
-- Parity: src/features/pause/domain/practice/brief-post-pause-check-in-xp.ts

CREATE OR REPLACE FUNCTION public.pause_brief_post_pause_check_in_xp(p_pause_instance_id uuid)
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_initial_mood text;
  v_initial_intensity int;
  v_post_mood text;
  v_post_intensity int;
BEGIN
  SELECT lower(trim(COALESCE(e.payload->>'mood', ''))),
         NULLIF(trim(both from COALESCE(e.payload->>'intensity', '')), '')::integer
    INTO v_initial_mood, v_initial_intensity
    FROM public.pause_step_events e
   WHERE e.pause_instance_id = p_pause_instance_id
     AND e.step_type = 'initial_emotion_logged'
   ORDER BY e.created_at ASC
   LIMIT 1;

  SELECT lower(trim(COALESCE(e.payload->>'mood', ''))),
         NULLIF(trim(both from COALESCE(e.payload->>'intensity', '')), '')::integer
    INTO v_post_mood, v_post_intensity
    FROM public.pause_step_events e
   WHERE e.pause_instance_id = p_pause_instance_id
     AND e.step_type = 'post_pause_emotion_logged'
   ORDER BY e.created_at DESC
   LIMIT 1;

  IF v_post_mood IS NULL OR v_post_mood = '' THEN
    RETURN 0;
  END IF;

  IF v_post_mood <> COALESCE(v_initial_mood, '')
     OR v_post_intensity IS DISTINCT FROM v_initial_intensity THEN
    RETURN 5;
  END IF;

  RETURN 0;
END;
$$;

COMMENT ON FUNCTION public.pause_brief_post_pause_check_in_xp(uuid) IS
  'Brief Done optional check-in: +5 when post_pause_emotion_logged mood/intensity differs from initial_emotion_logged.';

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
    'shift_mood', 0,
    'post_pause_check_in', 0
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
  v_post_check_in int := 0;
  v_row record;
  v_meta jsonb;
BEGIN
  IF NOT public.pause_volatility_v1_ritual_beats_met(p_pause_instance_id) THEN
    RETURN public.pause_empty_xp_by_signal();
  END IF;

  v_brief := public.pause_instance_is_brief_ritual(p_pause_instance_id);

  IF v_brief THEN
    v_post_check_in := public.pause_brief_post_pause_check_in_xp(p_pause_instance_id);
    RETURN jsonb_build_object(
      'base_brief', 10,
      'base_deep', 0,
      'favorite', 0,
      'note', 0,
      'companions', 0,
      'companion_favorites', 0,
      'breath_second', 0,
      'shift_mood', 0,
      'post_pause_check_in', v_post_check_in
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
    'shift_mood', v_shift_mood,
    'post_pause_check_in', 0
  );
END;
$$;

COMMENT ON FUNCTION public.pause_compute_practice_xp_breakdown(uuid) IS
  'Per-pause Presence XP v2: brief base 10 + optional post-check-in; deep base 18 + optional deep bonuses.';

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
    'shift_mood', COALESCE(sum((b->>'shift_mood')::integer), 0),
    'post_pause_check_in', COALESCE(sum((b->>'post_pause_check_in')::integer), 0)
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

-- Recompute XP for completed pauses (post-check-in signal + profile totals).
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

REVOKE ALL ON FUNCTION public.pause_brief_post_pause_check_in_xp(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pause_brief_post_pause_check_in_xp(uuid) TO service_role;
