-- ============================================================================
-- Pause V2 — race fix for pause_log_companion
--
-- The partial unique index `uniq_pause_companion_counted_per_instance`
-- prevents the same (instance, companion_type) from counting twice.
-- The original function did a read-then-insert; two concurrent completes
-- for the same pair could both pass the EXISTS check and the second one
-- would then throw a unique-violation back to the caller.
--
-- Fix: rewrite the function to rely on the index rather than the
-- application-level dedupe. We still compute the intended
-- counts_for_pause locally, but when it would be true we do a
-- best-effort INSERT; if the unique index rejects it, we treat that
-- as "already_counted" and insert a non-counting audit row instead.
-- ============================================================================

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
    IF NOT FOUND THEN
      RAISE EXCEPTION 'pause_log_companion: instance % not found', p_instance_id;
    END IF;
    IF v_role <> 'service_role' AND v_inst.user_id <> v_uid THEN
      RAISE EXCEPTION 'pause_log_companion: not authorized';
    END IF;
    v_effective_user_id := v_inst.user_id;
  ELSE
    IF v_uid IS NULL THEN
      RAISE EXCEPTION 'pause_log_companion: need instance id when invoked as service_role';
    END IF;
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
    -- Best-effort counted insert. The partial unique index on
    -- (pause_instance_id, companion_type) WHERE action='complete' AND
    -- counts_for_pause=true guarantees we can't double-count even if
    -- two concurrent callers race past our local state check.
    INSERT INTO public.pause_companion_events (
      pause_instance_id, user_id, companion_type, action, entry_point,
      counts_for_pause, non_counting_reason
    ) VALUES (
      p_instance_id, v_effective_user_id, p_companion_type, p_action, p_entry_point,
      true, NULL
    )
    ON CONFLICT (pause_instance_id, companion_type)
      WHERE action = 'complete' AND counts_for_pause = true
      DO NOTHING
    RETURNING id INTO v_inserted_id;

    IF v_inserted_id IS NULL THEN
      -- Another tick won the race. Record a non-counting audit row and
      -- flip our return shape to match.
      v_counts := false;
      v_reason := 'already_counted';
      INSERT INTO public.pause_companion_events (
        pause_instance_id, user_id, companion_type, action, entry_point,
        counts_for_pause, non_counting_reason
      ) VALUES (
        p_instance_id, v_effective_user_id, p_companion_type, p_action, p_entry_point,
        false, v_reason
      );
    END IF;
  ELSE
    INSERT INTO public.pause_companion_events (
      pause_instance_id, user_id, companion_type, action, entry_point,
      counts_for_pause, non_counting_reason
    ) VALUES (
      p_instance_id, v_effective_user_id, p_companion_type, p_action, p_entry_point,
      false, v_reason
    );
  END IF;

  IF p_instance_id IS NOT NULL THEN
    SELECT state INTO v_state FROM public.pause_instances WHERE id = p_instance_id;
  END IF;

  RETURN jsonb_build_object(
    'counts_for_pause', v_counts,
    'non_counting_reason', v_reason,
    'resulting_state', v_state
  );
END;
$$;
