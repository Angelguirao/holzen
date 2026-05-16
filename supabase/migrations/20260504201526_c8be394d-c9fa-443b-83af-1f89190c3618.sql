-- Backfill: merged SQL for pause transition logic that historically shipped in
-- separate migration files (see comments in repo history). Standalone files in
-- `supabase/migrations/` apply afterward; do not insert duplicate `schema_migrations`
-- rows here — that breaks `supabase db reset` when the same version runs as a file.
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

-- Historical note: some environments backfilled `schema_migrations` rows here so
-- merged SQL would not re-run. Fresh resets apply the standalone migration files in
-- `supabase/migrations/`; inserting the same versions would duplicate `schema_migrations`.