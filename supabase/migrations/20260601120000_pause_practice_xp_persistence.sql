-- Practice Presence XP: persist per completed pause + profile roll-ups.
-- Formula must match src/features/pause/domain/home/compute-pause-practice-xp.ts
-- and sum-pause-score-impact-points.ts (see docs/systems/stats-system.md § Pause-first MVP).

ALTER TABLE public.pause_instances
  ADD COLUMN IF NOT EXISTS practice_xp_awarded integer;

COMMENT ON COLUMN public.pause_instances.practice_xp_awarded IS
  'Presence XP for this completed pause (base 5 + ritual bonuses). Set by pause_finalize_practice_xp.';

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS practice_presence_xp_total integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completed_pause_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pause_thesis text;

COMMENT ON COLUMN public.profiles.practice_presence_xp_total IS
  'Sum of practice_xp_awarded for completed pauses (maintained by pause_finalize_practice_xp).';
COMMENT ON COLUMN public.profiles.completed_pause_count IS
  'Count of pause_instances.state = completed (maintained on first XP finalize per instance).';
COMMENT ON COLUMN public.profiles.pause_thesis IS
  'Optional personal thesis (whys depth). User-edited via update_profile_safe; not investment hold goal.';

-- Mood composure scale (mirrors TS COMPOSURE map).
CREATE OR REPLACE FUNCTION public.pause_mood_composure(p_mood text)
RETURNS integer
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = public
AS $$
  SELECT CASE lower(trim(COALESCE(p_mood, '')))
    WHEN 'fomo' THEN 10
    WHEN 'greedy' THEN 15
    WHEN 'anxious' THEN 20
    WHEN 'fearful' THEN 25
    WHEN 'excited' THEN 40
    WHEN 'uncertain' THEN 50
    WHEN 'detached' THEN 75
    WHEN 'calm' THEN 100
    ELSE 0
  END;
$$;

CREATE OR REPLACE FUNCTION public.pause_practice_ritual_variant(p_pause_instance_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN EXISTS (
      SELECT 1 FROM public.pause_step_events e
       WHERE e.pause_instance_id = p_pause_instance_id
         AND (
           (e.payload->'brief_ritual') = 'true'::jsonb
           OR lower(trim(COALESCE(e.payload->>'brief_ritual', ''))) IN ('true', 't', '1')
           OR (e.payload->'briefRitual') = 'true'::jsonb
           OR lower(trim(COALESCE(e.payload->>'briefRitual', ''))) IN ('true', 't', '1')
         )
    ) THEN 'brief'
    WHEN EXISTS (
      SELECT 1 FROM public.pause_step_events e
       WHERE e.pause_instance_id = p_pause_instance_id AND e.step_type = 'outcome_logged'
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.pause_step_events e
       WHERE e.pause_instance_id = p_pause_instance_id AND e.step_type = 'reflection_step'
    ) THEN 'brief'
    ELSE 'default'
  END;
$$;

CREATE OR REPLACE FUNCTION public.pause_compute_practice_xp_awarded(p_pause_instance_id uuid)
RETURNS integer
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
  v_bonus int := 0;
  v_has_regulation boolean := false;
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
    v_bonus := v_bonus + 4;
  ELSIF v_mood IS NOT NULL AND v_mood <> ''
        AND v_mood_after IS NOT NULL AND v_mood_after <> ''
        AND public.pause_mood_composure(v_mood_after) > public.pause_mood_composure(v_mood) THEN
    v_bonus := v_bonus + 5;
  END IF;

  IF v_tools > 0 THEN
    v_bonus := v_bonus + LEAST(6, 2 * v_tools);
  END IF;

  IF v_wrote_note OR v_used_tags THEN
    v_bonus := v_bonus + 3;
  END IF;

  IF v_variant = 'brief' AND v_decision IS NOT NULL AND v_decision <> '' THEN
    v_bonus := v_bonus + 2;
    v_has_regulation := v_breath
      OR (
        v_mood IS NOT NULL AND v_mood <> ''
        AND v_mood_after IS NOT NULL AND v_mood_after <> ''
        AND public.pause_mood_composure(v_mood_after) > public.pause_mood_composure(v_mood)
      );
    IF v_mood IS NOT NULL AND v_mood <> '' AND NOT v_has_regulation THEN
      v_bonus := v_bonus + 2;
    END IF;
  END IF;

  RETURN 5 + v_bonus;
END;
$$;

COMMENT ON FUNCTION public.pause_compute_practice_xp_awarded(uuid) IS
  'Presence XP for one pause instance from step/companion events. Parity: compute-pause-practice-xp.ts.';

CREATE OR REPLACE FUNCTION public.pause_finalize_practice_xp(p_pause_instance_id uuid)
RETURNS void
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inst public.pause_instances%ROWTYPE;
  v_old int;
  v_new int;
BEGIN
  SELECT * INTO v_inst FROM public.pause_instances WHERE id = p_pause_instance_id;
  IF NOT FOUND OR v_inst.state <> 'completed' THEN
    RETURN;
  END IF;

  v_old := v_inst.practice_xp_awarded;
  v_new := public.pause_compute_practice_xp_awarded(p_pause_instance_id);

  UPDATE public.pause_instances
     SET practice_xp_awarded = v_new
   WHERE id = p_pause_instance_id;

  UPDATE public.profiles
     SET practice_presence_xp_total = practice_presence_xp_total + (v_new - COALESCE(v_old, 0)),
         completed_pause_count = completed_pause_count + CASE WHEN v_old IS NULL THEN 1 ELSE 0 END,
         updated_at = now()
   WHERE user_id = v_inst.user_id;
END;
$$;

COMMENT ON FUNCTION public.pause_finalize_practice_xp(uuid) IS
  'Idempotent: recompute practice_xp_awarded for a completed pause and sync profile roll-ups.';

CREATE OR REPLACE FUNCTION public.trg_pause_step_events_after_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.pause_evaluate_transitions(NEW.pause_instance_id);
  PERFORM public.pause_finalize_practice_xp(NEW.pause_instance_id);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_pause_companion_events_after_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.action = 'complete' AND NEW.counts_for_pause = true AND NEW.pause_instance_id IS NOT NULL THEN
    PERFORM public.pause_evaluate_transitions(NEW.pause_instance_id);
    PERFORM public.pause_finalize_practice_xp(NEW.pause_instance_id);
  END IF;
  RETURN NEW;
END;
$$;

-- Backfill completed instances then reconcile profile totals.
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
BEGIN
  IF p_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'completed_pause_count', 0,
      'presence_xp_total', 0,
      'completed_brief_count', 0,
      'completed_deep_count', 0
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
      'completed_deep_count', 0
    );
  END IF;

  SELECT count(*)::int INTO v_brief
    FROM public.pause_instances pi
   WHERE pi.user_id = p_user_id
     AND pi.state = 'completed'
     AND public.pause_instance_is_brief_ritual(pi.id);

  v_deep := GREATEST(v_profile.completed_pause_count - v_brief, 0);

  RETURN jsonb_build_object(
    'completed_pause_count', v_profile.completed_pause_count,
    'presence_xp_total', v_profile.practice_presence_xp_total,
    'completed_brief_count', v_brief,
    'completed_deep_count', v_deep
  );
END;
$$;

COMMENT ON FUNCTION public.get_practice_summary(uuid) IS
  'Practice roll-ups for Home/Journey: profile counters + brief/deep completed split.';

REVOKE ALL ON FUNCTION public.get_practice_summary(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_practice_summary(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_practice_summary(uuid) TO service_role;

REVOKE ALL ON FUNCTION public.pause_compute_practice_xp_awarded(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pause_compute_practice_xp_awarded(uuid) TO service_role;

REVOKE ALL ON FUNCTION public.pause_finalize_practice_xp(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pause_finalize_practice_xp(uuid) TO service_role;

-- Allow pause_thesis edits; strip system-maintained counters from client patches.
CREATE OR REPLACE FUNCTION public.update_profile_safe(_user_id uuid, _updates jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  safe_updates jsonb;
BEGIN
  IF auth.role() <> 'service_role' THEN
    IF auth.uid() IS NULL THEN RAISE EXCEPTION 'update_profile_safe: not authenticated' USING ERRCODE = '42501'; END IF;
    IF auth.uid() <> _user_id THEN RAISE EXCEPTION 'update_profile_safe: not authorized' USING ERRCODE = '42501'; END IF;
  END IF;

  safe_updates := _updates
    - 'subscription_status' - 'lifetime_access' - 'subscription_end' - 'subscription_checked_at'
    - 'user_id' - 'id' - 'created_at' - 'is_admin' - 'subscription_tier'
    - 'practice_presence_xp_total' - 'completed_pause_count';

  UPDATE public.profiles SET
    threshold = COALESCE((safe_updates->>'threshold')::numeric, threshold),
    threshold_down = COALESCE((safe_updates->>'threshold_down')::numeric, threshold_down),
    cumulative_threshold = COALESCE((safe_updates->>'cumulative_threshold')::numeric, cumulative_threshold),
    cooldown_hours = COALESCE((safe_updates->>'cooldown_hours')::integer, cooldown_hours),
    email_notifications = COALESCE((safe_updates->>'email_notifications')::boolean, email_notifications),
    has_onboarded = COALESCE((safe_updates->>'has_onboarded')::boolean, has_onboarded),
    companion_haiku = COALESCE((safe_updates->>'companion_haiku')::boolean, companion_haiku),
    companion_grounding = COALESCE((safe_updates->>'companion_grounding')::boolean, companion_grounding),
    companion_signal = COALESCE((safe_updates->>'companion_signal')::boolean, companion_signal),
    companion_zoom_out = COALESCE((safe_updates->>'companion_zoom_out')::boolean, companion_zoom_out),
    companion_history = COALESCE((safe_updates->>'companion_history')::boolean, companion_history),
    silent_mode = COALESCE((safe_updates->>'silent_mode')::boolean, silent_mode),
    quiet_hours_start = CASE WHEN safe_updates ? 'quiet_hours_start' THEN (safe_updates->>'quiet_hours_start')::integer ELSE quiet_hours_start END,
    quiet_hours_end = CASE WHEN safe_updates ? 'quiet_hours_end' THEN (safe_updates->>'quiet_hours_end')::integer ELSE quiet_hours_end END,
    reflection_tone = COALESCE(safe_updates->>'reflection_tone', reflection_tone),
    reflection_style = COALESCE(safe_updates->>'reflection_style', reflection_style),
    custom_prompt = CASE WHEN safe_updates ? 'custom_prompt' THEN safe_updates->>'custom_prompt' ELSE custom_prompt END,
    first_name = CASE WHEN safe_updates ? 'first_name' THEN safe_updates->>'first_name' ELSE first_name END,
    timezone = CASE WHEN safe_updates ? 'timezone' THEN safe_updates->>'timezone' ELSE timezone END,
    hold_goal_type = CASE WHEN safe_updates ? 'hold_goal_type' THEN safe_updates->>'hold_goal_type' ELSE hold_goal_type END,
    hold_goal_currency = CASE WHEN safe_updates ? 'hold_goal_currency' THEN safe_updates->>'hold_goal_currency' ELSE hold_goal_currency END,
    hold_goal_start = CASE WHEN safe_updates ? 'hold_goal_start' THEN (safe_updates->>'hold_goal_start')::timestamptz ELSE hold_goal_start END,
    hold_goal_target_months = CASE WHEN safe_updates ? 'hold_goal_target_months' THEN (safe_updates->>'hold_goal_target_months')::integer ELSE hold_goal_target_months END,
    hold_goal_target_price = CASE WHEN safe_updates ? 'hold_goal_target_price' THEN (safe_updates->>'hold_goal_target_price')::numeric ELSE hold_goal_target_price END,
    tracked_asset_id = CASE WHEN safe_updates ? 'tracked_asset_id' THEN CASE lower(trim(safe_updates->>'tracked_asset_id')) WHEN 'bitcoin' THEN 'bitcoin' WHEN 'ethereum' THEN 'ethereum' WHEN 'solana' THEN 'solana' WHEN 'monero' THEN 'monero' ELSE tracked_asset_id END ELSE tracked_asset_id END,
    motivations = CASE WHEN safe_updates ? 'motivations' THEN ARRAY(SELECT jsonb_array_elements_text(safe_updates->'motivations')) ELSE motivations END,
    mantra = CASE WHEN safe_updates ? 'mantra' THEN safe_updates->>'mantra' ELSE mantra END,
    pause_thesis = CASE WHEN safe_updates ? 'pause_thesis' THEN NULLIF(trim(safe_updates->>'pause_thesis'), '') ELSE pause_thesis END,
    language = COALESCE(safe_updates->>'language', language),
    grounding_activities = CASE WHEN safe_updates ? 'grounding_activities' THEN ARRAY(SELECT jsonb_array_elements_text(safe_updates->'grounding_activities')) ELSE grounding_activities END,
    last_context = CASE WHEN safe_updates ? 'last_context' THEN safe_updates->>'last_context' ELSE last_context END,
    last_trigger_at = CASE WHEN safe_updates ? 'last_trigger_at' THEN (safe_updates->>'last_trigger_at')::timestamptz ELSE last_trigger_at END,
    referral_code = COALESCE(safe_updates->>'referral_code', referral_code),
    referred_by = CASE WHEN safe_updates ? 'referred_by' THEN safe_updates->>'referred_by' ELSE referred_by END,
    snoozed_until = CASE WHEN safe_updates ? 'snoozed_until' THEN (safe_updates->>'snoozed_until')::timestamptz ELSE snoozed_until END,
    updated_at = now()
  WHERE user_id = _user_id;
END;
$function$;
