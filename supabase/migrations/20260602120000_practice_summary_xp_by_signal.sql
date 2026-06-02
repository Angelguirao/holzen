-- Journey Presence breakdown: per-signal XP sums in get_practice_summary.xp_by_signal.
-- Parity: src/features/pause/domain/practice/practice-xp-by-signal.ts

CREATE OR REPLACE FUNCTION public.pause_empty_xp_by_signal()
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'base', 0,
    'breath', 0,
    'mood_regulation', 0,
    'tools', 0,
    'reflection', 0,
    'brief_decision', 0,
    'brief_entry_mood', 0
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
  v_breath boolean := false;
  v_mood text;
  v_mood_after text;
  v_decision text;
  v_wrote_note boolean := false;
  v_used_tags boolean := false;
  v_tools int := 0;
  v_variant text;
  v_has_regulation boolean := false;
  v_breath_xp int := 0;
  v_mood_xp int := 0;
  v_tools_xp int := 0;
  v_reflection_xp int := 0;
  v_brief_decision_xp int := 0;
  v_brief_entry_xp int := 0;
  v_row record;
BEGIN
  FOR v_row IN
    SELECT e.step_type::text AS step_type, e.payload
      FROM public.pause_step_events e
     WHERE e.pause_instance_id = p_pause_instance_id
  LOOP
    CASE v_row.step_type
      WHEN 'breath_completed' THEN v_breath := true;
      WHEN 'initial_emotion_logged' THEN
        v_mood := lower(trim(COALESCE(v_row.payload->>'mood', '')));
      WHEN 'post_pause_emotion_logged', 'shift_emotion_logged' THEN
        v_mood_after := lower(trim(COALESCE(v_row.payload->>'mood', '')));
      WHEN 'outcome_logged' THEN
        v_decision := COALESCE(v_row.payload->>'outcome', '');
      WHEN 'note_updated' THEN v_wrote_note := true;
      WHEN 'tag_updated' THEN v_used_tags := true;
      ELSE NULL;
    END CASE;
  END LOOP;

  SELECT count(*)::int INTO v_tools
    FROM public.pause_companion_events c
   WHERE c.pause_instance_id = p_pause_instance_id
     AND c.action = 'complete'
     AND c.counts_for_pause = true;

  v_variant := public.pause_practice_ritual_variant(p_pause_instance_id);

  IF v_breath THEN
    v_breath_xp := 4;
  ELSIF v_mood IS NOT NULL AND v_mood <> ''
        AND v_mood_after IS NOT NULL AND v_mood_after <> ''
        AND public.pause_mood_composure(v_mood_after) > public.pause_mood_composure(v_mood) THEN
    v_mood_xp := 5;
  END IF;

  IF v_tools > 0 THEN
    v_tools_xp := LEAST(6, 2 * v_tools);
  END IF;

  IF v_wrote_note OR v_used_tags THEN
    v_reflection_xp := 3;
  END IF;

  IF v_variant = 'brief' AND v_decision IS NOT NULL AND v_decision <> '' THEN
    v_brief_decision_xp := 2;
    v_has_regulation := v_breath
      OR (
        v_mood IS NOT NULL AND v_mood <> ''
        AND v_mood_after IS NOT NULL AND v_mood_after <> ''
        AND public.pause_mood_composure(v_mood_after) > public.pause_mood_composure(v_mood)
      );
    IF v_mood IS NOT NULL AND v_mood <> '' AND NOT v_has_regulation THEN
      v_brief_entry_xp := 2;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'base', 5,
    'breath', v_breath_xp,
    'mood_regulation', v_mood_xp,
    'tools', v_tools_xp,
    'reflection', v_reflection_xp,
    'brief_decision', v_brief_decision_xp,
    'brief_entry_mood', v_brief_entry_xp
  );
END;
$$;

COMMENT ON FUNCTION public.pause_compute_practice_xp_breakdown(uuid) IS
  'Per-pause Presence XP components (base + bonuses). Sum equals pause_compute_practice_xp_awarded.';

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
    'base', COALESCE(sum((b->>'base')::integer), 0),
    'breath', COALESCE(sum((b->>'breath')::integer), 0),
    'mood_regulation', COALESCE(sum((b->>'mood_regulation')::integer), 0),
    'tools', COALESCE(sum((b->>'tools')::integer), 0),
    'reflection', COALESCE(sum((b->>'reflection')::integer), 0),
    'brief_decision', COALESCE(sum((b->>'brief_decision')::integer), 0),
    'brief_entry_mood', COALESCE(sum((b->>'brief_entry_mood')::integer), 0)
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

COMMENT ON FUNCTION public.get_practice_summary(uuid) IS
  'Practice roll-ups for Home/Journey: profile counters, brief/deep split, lifetime XP-by-signal sums.';

REVOKE ALL ON FUNCTION public.pause_compute_practice_xp_breakdown(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pause_compute_practice_xp_breakdown(uuid) TO service_role;

REVOKE ALL ON FUNCTION public.pause_empty_xp_by_signal() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pause_empty_xp_by_signal() TO authenticated;
GRANT EXECUTE ON FUNCTION public.pause_empty_xp_by_signal() TO service_role;
