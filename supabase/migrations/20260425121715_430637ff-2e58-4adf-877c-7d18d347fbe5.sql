-- Batch 3: Pause V2 RPCs and service helpers
-- Combines: 20260423201000, 201100, 201200, 201300, 201400, 201500

-- ============ 201000: pause_rpc_functions ============
CREATE OR REPLACE FUNCTION public.pause_create_or_reuse(
  p_template_slug text,
  p_source text,
  p_context_snapshot jsonb,
  p_context_rule_result jsonb,
  p_context_fingerprint text
)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_role text := auth.role();
  v_tpl public.pause_templates%ROWTYPE;
  v_open public.pause_instances%ROWTYPE;
  v_recent_dismiss public.pause_instances%ROWTYPE;
  v_new_id uuid;
  v_now timestamptz := now();
  v_window_end timestamptz;
BEGIN
  IF v_uid IS NULL AND v_role <> 'service_role' THEN
    RAISE EXCEPTION 'pause_create_or_reuse: not authorized';
  END IF;

  SELECT * INTO v_tpl FROM public.pause_templates WHERE slug = p_template_slug AND active = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'pause_create_or_reuse: unknown or inactive template slug %', p_template_slug;
  END IF;

  v_window_end := v_now + make_interval(secs => v_tpl.window_ms / 1000.0);

  SELECT * INTO v_open
    FROM public.pause_instances
   WHERE user_id = v_uid
     AND state IN ('active','engaged')
   ORDER BY created_at DESC
   LIMIT 1
   FOR UPDATE;

  IF FOUND THEN
    IF v_open.context_fingerprint = p_context_fingerprint THEN
      RETURN jsonb_build_object('instance_id', v_open.id, 'created', false, 'reused_reason', 'fingerprint_match');
    ELSE
      UPDATE public.pause_instances SET state='expired', expired_reason='context_lost', terminal_at=v_now WHERE id=v_open.id;
    END IF;
  ELSE
    SELECT * INTO v_recent_dismiss FROM public.pause_instances
     WHERE user_id = v_uid AND state IN ('dismissed','expired')
       AND context_fingerprint = p_context_fingerprint
       AND terminal_at > (v_now - make_interval(secs => v_tpl.window_ms / 1000.0))
     ORDER BY terminal_at DESC LIMIT 1;
    IF FOUND THEN
      RETURN jsonb_build_object('instance_id', NULL, 'created', false, 'reused_reason', 'recent_dismissal');
    END IF;
  END IF;

  INSERT INTO public.pause_instances (
    user_id, template_id, state, source,
    context_snapshot, context_rule_result, context_fingerprint,
    window_starts_at, window_ends_at, superseded_by
  ) VALUES (
    v_uid, v_tpl.id, 'active', p_source,
    COALESCE(p_context_snapshot, '{}'::jsonb),
    COALESCE(p_context_rule_result, '{}'::jsonb),
    p_context_fingerprint, v_now, v_window_end, NULL
  ) RETURNING id INTO v_new_id;

  IF v_open.id IS NOT NULL AND v_open.state IN ('active','engaged') THEN
    UPDATE public.pause_instances SET superseded_by = v_new_id WHERE id = v_open.id;
  END IF;

  RETURN jsonb_build_object('instance_id', v_new_id, 'created', true, 'reused_reason', NULL);
END;
$$;

REVOKE ALL ON FUNCTION public.pause_create_or_reuse(text, text, jsonb, jsonb, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pause_create_or_reuse(text, text, jsonb, jsonb, text) TO authenticated, service_role;

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
BEGIN
  SELECT * INTO v_inst FROM public.pause_instances WHERE id = p_instance_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'pause_log_step: instance % not found', p_instance_id; END IF;
  IF v_role <> 'service_role' AND v_inst.user_id <> v_uid THEN
    RAISE EXCEPTION 'pause_log_step: not authorized';
  END IF;
  IF v_inst.state IN ('completed','dismissed','expired') THEN RETURN v_inst.state; END IF;

  INSERT INTO public.pause_step_events (pause_instance_id, user_id, step_type, payload)
  VALUES (p_instance_id, v_inst.user_id, p_step_type, COALESCE(p_payload, '{}'::jsonb));

  SELECT state INTO v_inst.state FROM public.pause_instances WHERE id = p_instance_id;
  RETURN v_inst.state;
END;
$$;

REVOKE ALL ON FUNCTION public.pause_log_step(uuid, public.pause_step_type, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pause_log_step(uuid, public.pause_step_type, jsonb) TO authenticated, service_role;

-- ============ 201100: pause_log_companion (with race fix) ============
CREATE OR REPLACE FUNCTION public.pause_log_companion(
  p_instance_id uuid,
  p_companion_type text,
  p_action public.pause_companion_action,
  p_entry_point text
)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_role text := auth.role();
  v_effective_user_id uuid;
  v_inst public.pause_instances%ROWTYPE;
  v_tpl public.pause_templates%ROWTYPE;
  v_counts boolean := false;
  v_reason text := NULL;
  v_now timestamptz := now();
  v_state public.pause_state;
  v_inserted_id uuid;
BEGIN
  IF v_uid IS NULL AND v_role <> 'service_role' THEN
    RAISE EXCEPTION 'pause_log_companion: not authorized';
  END IF;

  IF p_instance_id IS NOT NULL THEN
    SELECT * INTO v_inst FROM public.pause_instances WHERE id = p_instance_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'pause_log_companion: instance % not found', p_instance_id; END IF;
    IF v_role <> 'service_role' AND v_inst.user_id <> v_uid THEN
      RAISE EXCEPTION 'pause_log_companion: not authorized';
    END IF;
    v_effective_user_id := v_inst.user_id;
  ELSE
    IF v_uid IS NULL THEN RAISE EXCEPTION 'pause_log_companion: need instance id when invoked as service_role'; END IF;
    v_effective_user_id := v_uid;
  END IF;

  IF p_action = 'complete' AND p_instance_id IS NOT NULL THEN
    IF v_inst.state NOT IN ('active','engaged') THEN
      v_reason := CASE v_inst.state
                    WHEN 'completed' THEN 'no_active_pause'
                    WHEN 'dismissed' THEN 'no_active_pause'
                    WHEN 'expired' THEN
                      CASE v_inst.expired_reason::text
                        WHEN 'context_lost' THEN 'context_lost'
                        WHEN 'window_elapsed' THEN 'outside_window'
                        ELSE 'no_active_pause'
                      END
                    ELSE 'no_active_pause'
                  END;
    ELSIF v_inst.window_ends_at <= v_now THEN
      v_reason := 'outside_window';
    ELSE
      SELECT * INTO v_tpl FROM public.pause_templates WHERE id = v_inst.template_id;
      IF p_companion_type <> ALL (v_tpl.allowed_companion_types) THEN
        v_reason := 'not_allowed_for_template';
      ELSE
        v_counts := true;
      END IF;
    END IF;
  ELSIF p_action = 'complete' AND p_instance_id IS NULL THEN
    v_reason := 'no_active_pause';
  END IF;

  IF v_counts THEN
    INSERT INTO public.pause_companion_events (
      pause_instance_id, user_id, companion_type, action, entry_point,
      counts_for_pause, non_counting_reason
    ) VALUES (
      p_instance_id, v_effective_user_id, p_companion_type, p_action, p_entry_point, true, NULL
    )
    ON CONFLICT (pause_instance_id, companion_type)
      WHERE action = 'complete' AND counts_for_pause = true
      DO NOTHING
    RETURNING id INTO v_inserted_id;

    IF v_inserted_id IS NULL THEN
      v_counts := false;
      v_reason := 'already_counted';
      INSERT INTO public.pause_companion_events (
        pause_instance_id, user_id, companion_type, action, entry_point,
        counts_for_pause, non_counting_reason
      ) VALUES (
        p_instance_id, v_effective_user_id, p_companion_type, p_action, p_entry_point, false, v_reason
      );
    END IF;
  ELSE
    INSERT INTO public.pause_companion_events (
      pause_instance_id, user_id, companion_type, action, entry_point,
      counts_for_pause, non_counting_reason
    ) VALUES (
      p_instance_id, v_effective_user_id, p_companion_type, p_action, p_entry_point, false, v_reason
    );
  END IF;

  IF p_instance_id IS NOT NULL THEN
    SELECT state INTO v_state FROM public.pause_instances WHERE id = p_instance_id;
  END IF;

  RETURN jsonb_build_object('counts_for_pause', v_counts, 'non_counting_reason', v_reason, 'resulting_state', v_state);
END;
$$;

REVOKE ALL ON FUNCTION public.pause_log_companion(uuid, text, public.pause_companion_action, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pause_log_companion(uuid, text, public.pause_companion_action, text) TO authenticated, service_role;

-- ============ 201200: pause_create_or_reuse_as (service variant + advisory lock) ============
CREATE OR REPLACE FUNCTION public.pause_create_or_reuse_as(
  p_user_id uuid,
  p_template_slug text,
  p_source text,
  p_context_snapshot jsonb,
  p_context_rule_result jsonb,
  p_context_fingerprint text
)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tpl public.pause_templates%ROWTYPE;
  v_open public.pause_instances%ROWTYPE;
  v_recent_dismiss public.pause_instances%ROWTYPE;
  v_new_id uuid;
  v_now timestamptz := now();
  v_window_end timestamptz;
BEGIN
  IF auth.role() <> 'service_role' THEN RAISE EXCEPTION 'pause_create_or_reuse_as: service_role required'; END IF;
  IF p_user_id IS NULL THEN RAISE EXCEPTION 'pause_create_or_reuse_as: p_user_id required'; END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

  SELECT * INTO v_tpl FROM public.pause_templates WHERE slug = p_template_slug AND active = true;
  IF NOT FOUND THEN RAISE EXCEPTION 'pause_create_or_reuse_as: unknown or inactive template slug %', p_template_slug; END IF;

  v_window_end := v_now + make_interval(secs => v_tpl.window_ms / 1000.0);

  SELECT * INTO v_open FROM public.pause_instances
   WHERE user_id = p_user_id AND state IN ('active','engaged')
   ORDER BY created_at DESC LIMIT 1 FOR UPDATE;

  IF FOUND THEN
    IF v_open.context_fingerprint = p_context_fingerprint THEN
      RETURN jsonb_build_object('instance_id', v_open.id, 'created', false, 'reused_reason', 'fingerprint_match');
    ELSE
      UPDATE public.pause_instances SET state='expired', expired_reason='context_lost', terminal_at=v_now WHERE id=v_open.id;
    END IF;
  ELSE
    SELECT * INTO v_recent_dismiss FROM public.pause_instances
     WHERE user_id = p_user_id AND state IN ('dismissed','expired')
       AND context_fingerprint = p_context_fingerprint
       AND terminal_at > (v_now - make_interval(secs => v_tpl.window_ms / 1000.0))
     ORDER BY terminal_at DESC LIMIT 1;
    IF FOUND THEN
      RETURN jsonb_build_object('instance_id', NULL, 'created', false, 'reused_reason', 'recent_dismissal');
    END IF;
  END IF;

  INSERT INTO public.pause_instances (
    user_id, template_id, state, source, context_snapshot, context_rule_result,
    context_fingerprint, window_starts_at, window_ends_at, superseded_by
  ) VALUES (
    p_user_id, v_tpl.id, 'active', p_source,
    COALESCE(p_context_snapshot, '{}'::jsonb), COALESCE(p_context_rule_result, '{}'::jsonb),
    p_context_fingerprint, v_now, v_window_end, NULL
  ) RETURNING id INTO v_new_id;

  IF v_open.id IS NOT NULL AND v_open.state IN ('active','engaged') THEN
    UPDATE public.pause_instances SET superseded_by = v_new_id WHERE id = v_open.id;
  END IF;

  RETURN jsonb_build_object('instance_id', v_new_id, 'created', true, 'reused_reason', NULL);
END;
$$;

REVOKE ALL ON FUNCTION public.pause_create_or_reuse_as(uuid, text, text, jsonb, jsonb, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pause_create_or_reuse_as(uuid, text, text, jsonb, jsonb, text) TO service_role;

-- Harden base RPC with advisory lock too
CREATE OR REPLACE FUNCTION public.pause_create_or_reuse(
  p_template_slug text,
  p_source text,
  p_context_snapshot jsonb,
  p_context_rule_result jsonb,
  p_context_fingerprint text
)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_role text := auth.role();
  v_tpl public.pause_templates%ROWTYPE;
  v_open public.pause_instances%ROWTYPE;
  v_recent_dismiss public.pause_instances%ROWTYPE;
  v_new_id uuid;
  v_now timestamptz := now();
  v_window_end timestamptz;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'pause_create_or_reuse: authenticated user required (use pause_create_or_reuse_as for service_role)';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(v_uid::text, 0));

  SELECT * INTO v_tpl FROM public.pause_templates WHERE slug = p_template_slug AND active = true;
  IF NOT FOUND THEN RAISE EXCEPTION 'pause_create_or_reuse: unknown or inactive template slug %', p_template_slug; END IF;

  v_window_end := v_now + make_interval(secs => v_tpl.window_ms / 1000.0);

  SELECT * INTO v_open FROM public.pause_instances
   WHERE user_id = v_uid AND state IN ('active','engaged')
   ORDER BY created_at DESC LIMIT 1 FOR UPDATE;

  IF FOUND THEN
    IF v_open.context_fingerprint = p_context_fingerprint THEN
      RETURN jsonb_build_object('instance_id', v_open.id, 'created', false, 'reused_reason', 'fingerprint_match');
    ELSE
      UPDATE public.pause_instances SET state='expired', expired_reason='context_lost', terminal_at=v_now WHERE id=v_open.id;
    END IF;
  ELSE
    SELECT * INTO v_recent_dismiss FROM public.pause_instances
     WHERE user_id = v_uid AND state IN ('dismissed','expired')
       AND context_fingerprint = p_context_fingerprint
       AND terminal_at > (v_now - make_interval(secs => v_tpl.window_ms / 1000.0))
     ORDER BY terminal_at DESC LIMIT 1;
    IF FOUND THEN
      RETURN jsonb_build_object('instance_id', NULL, 'created', false, 'reused_reason', 'recent_dismissal');
    END IF;
  END IF;

  INSERT INTO public.pause_instances (
    user_id, template_id, state, source, context_snapshot, context_rule_result,
    context_fingerprint, window_starts_at, window_ends_at, superseded_by
  ) VALUES (
    v_uid, v_tpl.id, 'active', p_source,
    COALESCE(p_context_snapshot, '{}'::jsonb), COALESCE(p_context_rule_result, '{}'::jsonb),
    p_context_fingerprint, v_now, v_window_end, NULL
  ) RETURNING id INTO v_new_id;

  IF v_open.id IS NOT NULL AND v_open.state IN ('active','engaged') THEN
    UPDATE public.pause_instances SET superseded_by = v_new_id WHERE id = v_open.id;
  END IF;

  RETURN jsonb_build_object('instance_id', v_new_id, 'created', true, 'reused_reason', NULL);
END;
$$;

-- ============ 201300: companion_serves.pause_instance_id ============
ALTER TABLE public.companion_serves
  ADD COLUMN IF NOT EXISTS pause_instance_id uuid
    REFERENCES public.pause_instances(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_companion_serves_pause_instance
  ON public.companion_serves (pause_instance_id) WHERE pause_instance_id IS NOT NULL;

ALTER TABLE public.library_items
  ADD COLUMN IF NOT EXISTS pause_instance_id uuid
    REFERENCES public.pause_instances(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_library_items_pause_instance
  ON public.library_items (pause_instance_id) WHERE pause_instance_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_library_items_user_pause_source
  ON public.library_items (user_id, pause_instance_id, source_type)
  WHERE pause_instance_id IS NOT NULL;

ALTER TABLE public.generation_attempts
  ADD COLUMN IF NOT EXISTS pause_instance_id uuid;

-- ============ 201400: notifications trigger ============
CREATE OR REPLACE FUNCTION public.notifications_from_pause_instances()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.state = 'active' THEN
    PERFORM public.notifications_upsert(
      NEW.user_id, 'pause', 'pause_instances', NEW.id,
      jsonb_build_object(
        'pause_instance_id', NEW.id,
        'template_slug', (SELECT slug FROM public.pause_templates WHERE id = NEW.template_id),
        'source', NEW.source,
        'severity', NEW.context_snapshot->>'severity',
        'context', NEW.context_snapshot->>'context_text',
        'window_ends_at', NEW.window_ends_at
      ),
      '/pause',
      jsonb_build_object('pauseInstanceId', NEW.id::text),
      NEW.created_at
    );
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE'
     AND OLD.state IN ('active','engaged')
     AND NEW.state IN ('completed','dismissed','expired') THEN
    UPDATE public.notifications SET dismissed_at = now()
     WHERE source_table = 'pause_instances' AND source_id = NEW.id AND dismissed_at IS NULL;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notifications_pause_instances ON public.pause_instances;
CREATE TRIGGER trg_notifications_pause_instances
  AFTER INSERT OR UPDATE OF state ON public.pause_instances
  FOR EACH ROW EXECUTE FUNCTION public.notifications_from_pause_instances();

-- ============ 201500: pause_ai_artifacts owner write policies ============
DROP POLICY IF EXISTS pause_ai_artifacts_owner_insert ON public.pause_ai_artifacts;
CREATE POLICY pause_ai_artifacts_owner_insert
  ON public.pause_ai_artifacts FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.pause_instances pi
       WHERE pi.id = pause_ai_artifacts.pause_instance_id AND pi.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS pause_ai_artifacts_owner_update ON public.pause_ai_artifacts;
CREATE POLICY pause_ai_artifacts_owner_update
  ON public.pause_ai_artifacts FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.pause_instances pi
       WHERE pi.id = pause_ai_artifacts.pause_instance_id AND pi.user_id = auth.uid()
    )
  );