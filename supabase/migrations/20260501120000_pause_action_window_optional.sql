-- ============================================================================
-- Pause templates: split "action window" vs "dismissal suppression"
--
-- Product: volatility pauses should not expire only because a fixed clock ran
-- out. They still expire on context change (fingerprint), supersede, dismiss,
-- or completion. We keep a separate short TTL for the recent-dismissal guard
-- in pause_create_or_reuse* so cron cannot immediately re-push the same
-- fingerprint after a user dismissed.
--
-- - action_window_ms NULL → new instances get window_ends_at far in the future
--   (no meaningful clock expiry; sweep + evaluate treat like "open").
-- - dismissal_suppression_ms → lookback for recent_dismissal only (was window_ms).
-- ============================================================================

ALTER TABLE public.pause_templates
  ADD COLUMN IF NOT EXISTS action_window_ms bigint NULL,
  ADD COLUMN IF NOT EXISTS dismissal_suppression_ms bigint NOT NULL DEFAULT 21600000;

ALTER TABLE public.pause_templates
  ADD CONSTRAINT pause_templates_dismissal_suppression_positive
  CHECK (dismissal_suppression_ms > 0);

COMMENT ON COLUMN public.pause_templates.action_window_ms IS
  'When set, pause_instances.window_ends_at = created + this duration and the '
  'transition engine may expire with window_elapsed. When NULL, window_ends_at '
  'is set far in the future so only non-clock rules end the pause.';

COMMENT ON COLUMN public.pause_templates.dismissal_suppression_ms IS
  'Lookback for pause_create_or_reuse recent_dismissal: same fingerprint '
  'dismissed/expired within this window blocks a new instance.';

-- Seed: copy legacy window into both columns; then drop clock-bound action for volatility.
UPDATE public.pause_templates SET dismissal_suppression_ms = window_ms;
UPDATE public.pause_templates SET action_window_ms = window_ms;
UPDATE public.pause_templates SET action_window_ms = NULL WHERE slug = 'volatility_v1';

-- Open volatility-template pauses: remove imminent clock expiry.
UPDATE public.pause_instances pi
   SET window_ends_at = now() + interval '100 years'
  FROM public.pause_templates t
 WHERE pi.template_id = t.id
   AND t.action_window_ms IS NULL
   AND pi.state IN ('active', 'engaged');

-- ========= pause_create_or_reuse_as (service) =========
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

  IF v_tpl.action_window_ms IS NULL THEN
    v_window_end := v_now + interval '100 years';
  ELSE
    v_window_end := v_now + make_interval(secs => (v_tpl.action_window_ms::double precision) / 1000.0);
  END IF;

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
       AND terminal_at > (v_now - make_interval(secs => (v_tpl.dismissal_suppression_ms::double precision) / 1000.0))
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

-- ========= pause_create_or_reuse (authenticated) =========
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

  IF v_tpl.action_window_ms IS NULL THEN
    v_window_end := v_now + interval '100 years';
  ELSE
    v_window_end := v_now + make_interval(secs => (v_tpl.action_window_ms::double precision) / 1000.0);
  END IF;

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
       AND terminal_at > (v_now - make_interval(secs => (v_tpl.dismissal_suppression_ms::double precision) / 1000.0))
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
