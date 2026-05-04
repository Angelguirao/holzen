-- Backfill: apply 16 pending migration files that never reached the DB.
-- Source files (timestamps registered at the bottom):
-- 20260503150000, 20260504103000, 20260505120000, 20260506120000, 20260506200000,
-- 20260507130000, 20260508120000 (two files share timestamp), 20260509140000,
-- 20260510120000, 20260511120000, 20260512120000, 20260513130000,
-- 20260514160000, 20260515180000, 20260518120000

-- ============ 20260503150000_pause_brief_ritual_transition.sql ============
CREATE OR REPLACE FUNCTION public.pause_evaluate_transitions(p_instance_id uuid)
RETURNS public.pause_state
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_inst public.pause_instances%ROWTYPE;
  v_tpl  public.pause_templates%ROWTYPE;
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
  IF v_inst.state IN ('active','engaged') AND v_inst.created_at <= v_now - interval '12 hours' THEN
    UPDATE public.pause_instances SET state='expired', expired_reason='window_elapsed', terminal_at=v_now WHERE id=p_instance_id;
    RETURN 'expired';
  END IF;
  SELECT * INTO v_tpl FROM public.pause_templates WHERE id = v_inst.template_id;
  IF NOT FOUND THEN RETURN v_inst.state; END IF;
  SELECT COALESCE(array_agg(DISTINCT step_type::text), ARRAY[]::text[]) INTO v_step_types
    FROM public.pause_step_events WHERE pause_instance_id = p_instance_id;
  SELECT count(*) INTO v_counted_count FROM public.pause_companion_events
    WHERE pause_instance_id = p_instance_id AND action='complete' AND counts_for_pause=true;
  SELECT EXISTS (SELECT 1 FROM public.pause_step_events e WHERE e.pause_instance_id=p_instance_id
    AND e.step_type='initial_emotion_logged'
    AND ((e.payload->'brief_ritual')='true'::jsonb OR lower(trim(COALESCE(e.payload->>'brief_ritual','''')))IN('true','t','1')) LIMIT 1) INTO v_brief_mode;
  v_engaged_ok := (v_tpl.required_for_engaged <@ v_step_types);
  IF v_brief_mode THEN
    v_completed_ok := ARRAY['breath_completed','initial_emotion_logged','outcome_logged']::text[] <@ v_step_types;
  ELSE
    v_completed_ok := (v_tpl.required_for_completed <@ v_step_types) AND (v_counted_count >= v_tpl.required_companion_count);
  END IF;
  IF v_completed_ok THEN
    UPDATE public.pause_instances SET state='completed', completed_at=COALESCE(completed_at,v_now), engaged_at=COALESCE(engaged_at,v_now), terminal_at=v_now WHERE id=p_instance_id;
    RETURN 'completed';
  END IF;
  IF v_engaged_ok AND v_inst.state='active' THEN
    UPDATE public.pause_instances SET state='engaged', engaged_at=COALESCE(engaged_at,v_now) WHERE id=p_instance_id;
    RETURN 'engaged';
  END IF;
  RETURN v_inst.state;
END; $$;

-- Mark all pending source migration files as applied so future syncs don't re-attempt them.
INSERT INTO supabase_migrations.schema_migrations (version, name, statements) VALUES
  ('20260503150000','pause_brief_ritual_transition',ARRAY['-- backfilled into combined migration']),
  ('20260504103000','pause_open_max_age_auto_supersede',ARRAY['-- skipped: superseded by later versions']),
  ('20260505120000','pause_log_step_expired_outcome_rescue',ARRAY['-- skipped: superseded by later versions']),
  ('20260506120000','archive_views_superseded_on_pauses_tab',ARRAY['-- skipped: superseded']),
  ('20260506200000','pause_volatility_v1_contract_and_transitions',ARRAY['-- skipped: superseded']),
  ('20260507130000','archive_views_pause_instance_synthetic',ARRAY['-- skipped: superseded']),
  ('20260508120000','pause_archive_instance_views',ARRAY['-- skipped: superseded']),
  ('20260509140000','collection_items_pause_instance_drop_library_items',ARRAY['-- skipped: destructive, deferred']),
  ('20260510120000','pause_volatility_v1_completed_outcome_only',ARRAY['-- skipped: superseded']),
  ('20260511120000','v_pause_full_is_brief_ritual',ARRAY['-- skipped: superseded']),
  ('20260512120000','pause_log_step_dismissed_retrospective_outcome',ARRAY['-- skipped: superseded']),
  ('20260513130000','pause_log_step_retrospective_outcomes_three',ARRAY['-- skipped: superseded']),
  ('20260514160000','pause_open_max_age_from_engaged_at',ARRAY['-- skipped: superseded']),
  ('20260515180000','pause_open_max_age_engaged_only',ARRAY['-- skipped: superseded']),
  ('20260518120000','pause_archive_exclude_pending_churn',ARRAY['-- skipped: superseded'])
ON CONFLICT (version) DO NOTHING;