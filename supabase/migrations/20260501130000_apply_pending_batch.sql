-- Runtime tuning for pregenerate-companions need-based top-up (no redeploy).
-- Edge: `loadAppConfig` → `pregenerate_cache_topup`; Admin → Tools.

INSERT INTO public.app_config (key, value, description) VALUES
  (
    'pregenerate_cache_topup',
    jsonb_build_object(
      'ground_nudge', jsonb_build_object('minHealthyRows', 18, 'maxGeneratePerRun', 2),
      'signal', jsonb_build_object('minHealthyRows', 12, 'maxGeneratePerRun', 1),
      'historical_insight', jsonb_build_object('minHealthyRows', 12, 'maxGeneratePerRun', 1),
      'zoom_out_deep_time', jsonb_build_object('minHealthyRows', 10, 'maxGeneratePerRun', 1)
    ),
    'Pregenerate companions: min count of healthy (quality≥2, non-expired) en rows per type before skipping; max new rows per cron per type.'
  )
ON CONFLICT (key) DO NOTHING;
-- IA refresh: in-app "Profile" → bookmarkable /journey/* URLs.
-- Update notification action_path (and state for letters) for new client + deep links.
SET search_path = public;

CREATE OR REPLACE FUNCTION public.notifications_from_user_badges() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  PERFORM public.notifications_upsert(NEW.user_id, 'badge', 'user_badges', NEW.id,
    jsonb_build_object('badge_id', NEW.badge_id), '/journey/badges', NULL, NEW.earned_at);
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.notifications_from_future_letters() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.delivered IS DISTINCT FROM TRUE OR NEW.delivered_at IS NULL THEN RETURN NEW; END IF;
  PERFORM public.notifications_upsert(NEW.user_id, 'letter', 'future_letters', NEW.id,
    '{}'::jsonb, format('/tools/letters?letter=%s', NEW.id::text), NULL, NEW.delivered_at);
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.notifications_from_reflection_insights() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  PERFORM public.notifications_upsert(NEW.user_id, 'insight', 'reflection_insights', NEW.id,
    jsonb_build_object('reflection_count', NEW.reflection_count), '/journey/insights', NULL, NEW.generated_at);
  RETURN NEW;
END; $$;

-- Recent rows: align paths with new app routes (idempotent for already-migrated values).
UPDATE public.notifications
SET
  action_path = '/journey/badges',
  action_state = NULL
WHERE type = 'badge' AND action_path = '/profile';

UPDATE public.notifications
SET
  action_path = '/journey/insights',
  action_state = NULL
WHERE type = 'insight' AND action_path = '/profile';

UPDATE public.notifications
SET
  action_path = format('/tools/letters?letter=%s', source_id::text),
  action_state = NULL
WHERE type = 'letter' AND action_path = '/profile' AND source_table = 'future_letters';
-- Letters IA: canonical client URL is /tools/letters (not /journey/letters).
SET search_path = public;

CREATE OR REPLACE FUNCTION public.notifications_from_future_letters() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.delivered IS DISTINCT FROM TRUE OR NEW.delivered_at IS NULL THEN RETURN NEW; END IF;
  PERFORM public.notifications_upsert(NEW.user_id, 'letter', 'future_letters', NEW.id,
    '{}'::jsonb, format('/tools/letters?letter=%s', NEW.id::text), NULL, NEW.delivered_at);
  RETURN NEW;
END; $$;

UPDATE public.notifications
SET
  action_path = format('/tools/letters?letter=%s', source_id::text),
  action_state = NULL
WHERE type = 'letter' AND source_table = 'future_letters' AND action_path LIKE '/journey/letters%';
-- Pause V2: tie practice replay rows to pause_instances (replaces removed source_reflection_id).
SET search_path = public;

ALTER TABLE public.practice_entries
  ADD COLUMN IF NOT EXISTS pause_instance_id uuid REFERENCES public.pause_instances (id) ON DELETE CASCADE;

COMMENT ON COLUMN public.practice_entries.pause_instance_id IS
  'Optional link to a pause instance (required for type=replay thread; null for standalone check-in/journal/bodyscan).';

CREATE INDEX IF NOT EXISTS idx_practice_entries_user_pause_replay
  ON public.practice_entries (user_id, pause_instance_id)
  WHERE type = 'replay' AND pause_instance_id IS NOT NULL;

DROP POLICY IF EXISTS "Users can insert own practice entries" ON public.practice_entries;

CREATE POLICY "Users can insert own practice entries"
  ON public.practice_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (
      pause_instance_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.pause_instances pi
        WHERE pi.id = pause_instance_id
          AND pi.user_id = auth.uid()
      )
    )
  );
-- Pause V2 IA: rename library_items.source_type values away from legacy "reflection" wording.
SET search_path = public;

UPDATE public.library_items
SET source_type = 'pause'
WHERE source_type = 'reflection';

UPDATE public.library_items
SET source_type = 'pause_note'
WHERE source_type = 'reflection_note';
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

DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pause_templates_dismissal_suppression_positive') THEN
    ALTER TABLE public.pause_templates ADD CONSTRAINT pause_templates_dismissal_suppression_positive CHECK (dismissal_suppression_ms > 0);
  END IF;
END $mig$;

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
-- Archive Echo tab: server-side row set for pagination (matches client helpers in
-- src/lib/archive-segment.ts — isArchiveEchoPause + main pause bookmark).
CREATE VIEW public.library_archive_echo_items AS
SELECT li.*
FROM public.library_items li
INNER JOIN public.pause_instances pi ON pi.id = li.pause_instance_id
WHERE li.pause_instance_id IS NOT NULL
  AND li.source_type = 'pause'
  AND pi.state IN ('expired', 'dismissed')
  AND pi.engaged_at IS NULL
  AND li.status NOT IN ('deleted', 'archived');

COMMENT ON VIEW public.library_archive_echo_items IS
  'Echo archive rows: main pause library_items for terminal pause_instances without Reflect. Keep in sync with src/lib/archive-segment.ts.';

ALTER VIEW public.library_archive_echo_items SET (security_invoker = true);

GRANT SELECT ON public.library_archive_echo_items TO authenticated;
GRANT SELECT ON public.library_archive_echo_items TO service_role;
-- Pauses archive tab: server-side row set (excludes anything tied to an echo-only pause instance).
-- Matches src/lib/archive-segment.ts itemBelongsToPausesTab (echo = expired|dismissed + engaged_at IS NULL).
-- Membership uses pause_instances; card UI still hydrates from v_pause_full.
CREATE VIEW public.library_archive_pauses_tab_items AS
SELECT li.*
FROM public.library_items li
LEFT JOIN public.pause_instances pi ON pi.id = li.pause_instance_id
WHERE li.status NOT IN ('deleted', 'archived')
  AND (
    li.pause_instance_id IS NULL
    OR pi.id IS NULL
    OR NOT (
      pi.state IN ('expired', 'dismissed')
      AND pi.engaged_at IS NULL
    )
  );

COMMENT ON VIEW public.library_archive_pauses_tab_items IS
  'Archive Pauses tab: library_items excluding rows for echo-only pause_instances (terminal without Reflect). Keep in sync with src/lib/archive-segment.ts itemBelongsToPausesTab.';

ALTER VIEW public.library_archive_pauses_tab_items SET (security_invoker = true);

GRANT SELECT ON public.library_archive_pauses_tab_items TO authenticated;
GRANT SELECT ON public.library_archive_pauses_tab_items TO service_role;

COMMENT ON VIEW public.library_archive_echo_items IS
  'Echo archive: main pause rows where pause_instances ended expired/dismissed without Reflect (engaged_at IS NULL). Echo membership is keyed on pause_instances (same as client isArchiveEchoPause); hydrate still reads v_pause_full for card fields.';
-- ============================================================================
-- Pause: "pending" context offer when market fingerprint changes while the
-- user still has an active|engaged pause. The new row is created in state
-- `pending` (not in v_pause_current); the user adopts via
-- pause_adopt_pending_offer() or declines via pause_decline_pending_offer().
-- Cron/manual pause_create_or_reuse* no longer expires the open pause on
-- fingerprint mismatch — that expiry + activation happens on adopt.
-- ============================================================================

-- 1) Enum label (idempotent for local replay)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'pause_state' AND e.enumlabel = 'pending'
  ) THEN
    ALTER TYPE public.pause_state ADD VALUE 'pending';
  END IF;
END$$;

-- 2) Table constraints: terminal_ts must allow `pending` as non-terminal
ALTER TABLE public.pause_instances DROP CONSTRAINT IF EXISTS pause_instances_terminal_ts;
ALTER TABLE public.pause_instances
  ADD CONSTRAINT pause_instances_terminal_ts CHECK (
    (state IN ('completed', 'dismissed', 'expired') AND terminal_at IS NOT NULL)
    OR (state IN ('active', 'engaged', 'pending') AND terminal_at IS NULL)
  );

ALTER TABLE public.pause_instances DROP CONSTRAINT IF EXISTS pause_instances_pending_shape;
ALTER TABLE public.pause_instances
  ADD CONSTRAINT pause_instances_pending_shape CHECK (
    state <> 'pending'
    OR (engaged_at IS NULL AND completed_at IS NULL AND terminal_at IS NULL)
  );

-- At most one pending offer per user (replaced on newer fingerprint)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_pause_pending_per_user
  ON public.pause_instances (user_id)
  WHERE state = 'pending';

-- 3) Transition engine: pending rows do not evaluate step/companion gates
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

  v_engaged_ok := (v_tpl.required_for_engaged <@ v_step_types);
  v_completed_ok :=
    (v_tpl.required_for_completed <@ v_step_types)
    AND (v_counted_count >= v_tpl.required_companion_count);

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

-- 4) pause_log_step — refuse steps on pending offers
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
  IF v_inst.state IN ('completed', 'dismissed', 'expired') THEN RETURN v_inst.state; END IF;
  IF v_inst.state = 'pending' THEN
    RAISE EXCEPTION 'pause_log_step: instance % is a pending context offer (adopt it first)', p_instance_id;
  END IF;

  INSERT INTO public.pause_step_events (pause_instance_id, user_id, step_type, payload)
  VALUES (p_instance_id, v_inst.user_id, p_step_type, COALESCE(p_payload, '{}'::jsonb));

  SELECT state INTO v_inst.state FROM public.pause_instances WHERE id = p_instance_id;
  RETURN v_inst.state;
END;
$$;

-- 5) pause_log_companion — pending behaves like no active pause for counted completes
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
    IF v_inst.state NOT IN ('active', 'engaged') THEN
      v_reason := CASE v_inst.state
                    WHEN 'pending' THEN 'no_active_pause'
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
      p_instance_id, v_effective_user_id, p_companion_type, p_action, p_entry_point,
      true, NULL
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

-- 6) pause_create_or_reuse_as (service)
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
   WHERE user_id = p_user_id AND state IN ('active', 'engaged')
   ORDER BY created_at DESC LIMIT 1 FOR UPDATE;

  IF FOUND THEN
    IF v_open.context_fingerprint = p_context_fingerprint THEN
      RETURN jsonb_build_object(
        'instance_id', v_open.id, 'created', false, 'reused_reason', 'fingerprint_match',
        'pending_offer', false, 'prior_open_instance_id', null
      );
    END IF;

    UPDATE public.pause_instances
       SET state = 'expired',
           expired_reason = 'system_cancelled',
           terminal_at = v_now,
           metadata = metadata || jsonb_build_object('pending_offer_replaced', true)
     WHERE user_id = p_user_id AND state = 'pending';

    INSERT INTO public.pause_instances (
      user_id, template_id, state, source, context_snapshot, context_rule_result,
      context_fingerprint, window_starts_at, window_ends_at, superseded_by, metadata
    ) VALUES (
      p_user_id, v_tpl.id, 'pending', p_source,
      COALESCE(p_context_snapshot, '{}'::jsonb), COALESCE(p_context_rule_result, '{}'::jsonb),
      p_context_fingerprint, v_now, v_window_end, NULL,
      jsonb_build_object('pending_replaces_open_id', v_open.id)
    ) RETURNING id INTO v_new_id;

    RETURN jsonb_build_object(
      'instance_id', v_new_id,
      'created', true,
      'reused_reason', null,
      'pending_offer', true,
      'prior_open_instance_id', v_open.id
    );
  END IF;

  UPDATE public.pause_instances
     SET state = 'expired',
         expired_reason = 'system_cancelled',
         terminal_at = v_now,
         metadata = metadata || jsonb_build_object('pending_cleared_for_new_active', true)
   WHERE user_id = p_user_id AND state = 'pending';

  SELECT * INTO v_recent_dismiss FROM public.pause_instances
   WHERE user_id = p_user_id AND state IN ('dismissed', 'expired')
     AND context_fingerprint = p_context_fingerprint
     AND terminal_at > (v_now - make_interval(secs => (v_tpl.dismissal_suppression_ms::double precision) / 1000.0))
   ORDER BY terminal_at DESC LIMIT 1;
  IF FOUND THEN
    RETURN jsonb_build_object(
      'instance_id', null, 'created', false, 'reused_reason', 'recent_dismissal',
      'pending_offer', false, 'prior_open_instance_id', null
    );
  END IF;

  INSERT INTO public.pause_instances (
    user_id, template_id, state, source, context_snapshot, context_rule_result,
    context_fingerprint, window_starts_at, window_ends_at, superseded_by
  ) VALUES (
    p_user_id, v_tpl.id, 'active', p_source,
    COALESCE(p_context_snapshot, '{}'::jsonb), COALESCE(p_context_rule_result, '{}'::jsonb),
    p_context_fingerprint, v_now, v_window_end, null
  ) RETURNING id INTO v_new_id;

  RETURN jsonb_build_object(
    'instance_id', v_new_id,
    'created', true,
    'reused_reason', null,
    'pending_offer', false,
    'prior_open_instance_id', null
  );
END;
$$;

-- 7) pause_create_or_reuse (authenticated)
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
   WHERE user_id = v_uid AND state IN ('active', 'engaged')
   ORDER BY created_at DESC LIMIT 1 FOR UPDATE;

  IF FOUND THEN
    IF v_open.context_fingerprint = p_context_fingerprint THEN
      RETURN jsonb_build_object(
        'instance_id', v_open.id, 'created', false, 'reused_reason', 'fingerprint_match',
        'pending_offer', false, 'prior_open_instance_id', null
      );
    END IF;

    UPDATE public.pause_instances
       SET state = 'expired',
           expired_reason = 'system_cancelled',
           terminal_at = v_now,
           metadata = metadata || jsonb_build_object('pending_offer_replaced', true)
     WHERE user_id = v_uid AND state = 'pending';

    INSERT INTO public.pause_instances (
      user_id, template_id, state, source, context_snapshot, context_rule_result,
      context_fingerprint, window_starts_at, window_ends_at, superseded_by, metadata
    ) VALUES (
      v_uid, v_tpl.id, 'pending', p_source,
      COALESCE(p_context_snapshot, '{}'::jsonb), COALESCE(p_context_rule_result, '{}'::jsonb),
      p_context_fingerprint, v_now, v_window_end, null,
      jsonb_build_object('pending_replaces_open_id', v_open.id)
    ) RETURNING id INTO v_new_id;

    RETURN jsonb_build_object(
      'instance_id', v_new_id,
      'created', true,
      'reused_reason', null,
      'pending_offer', true,
      'prior_open_instance_id', v_open.id
    );
  END IF;

  UPDATE public.pause_instances
     SET state = 'expired',
         expired_reason = 'system_cancelled',
         terminal_at = v_now,
         metadata = metadata || jsonb_build_object('pending_cleared_for_new_active', true)
   WHERE user_id = v_uid AND state = 'pending';

  SELECT * INTO v_recent_dismiss FROM public.pause_instances
   WHERE user_id = v_uid AND state IN ('dismissed', 'expired')
     AND context_fingerprint = p_context_fingerprint
     AND terminal_at > (v_now - make_interval(secs => (v_tpl.dismissal_suppression_ms::double precision) / 1000.0))
   ORDER BY terminal_at DESC LIMIT 1;
  IF FOUND THEN
    RETURN jsonb_build_object(
      'instance_id', null, 'created', false, 'reused_reason', 'recent_dismissal',
      'pending_offer', false, 'prior_open_instance_id', null
    );
  END IF;

  INSERT INTO public.pause_instances (
    user_id, template_id, state, source, context_snapshot, context_rule_result,
    context_fingerprint, window_starts_at, window_ends_at, superseded_by
  ) VALUES (
    v_uid, v_tpl.id, 'active', p_source,
    COALESCE(p_context_snapshot, '{}'::jsonb), COALESCE(p_context_rule_result, '{}'::jsonb),
    p_context_fingerprint, v_now, v_window_end, null
  ) RETURNING id INTO v_new_id;

  RETURN jsonb_build_object(
    'instance_id', v_new_id,
    'created', true,
    'reused_reason', null,
    'pending_offer', false,
    'prior_open_instance_id', null
  );
END;
$$;

-- 8) pause_dismiss_current — also clear stale pending offers
CREATE OR REPLACE FUNCTION public.pause_dismiss_current()
RETURNS public.pause_state
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_open_id uuid;
  v_now timestamptz := now();
  v_out public.pause_state;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'pause_dismiss_current: not authenticated';
  END IF;

  SELECT id INTO v_open_id
    FROM public.pause_instances
   WHERE user_id = v_uid
     AND state IN ('active', 'engaged')
   LIMIT 1;

  IF v_open_id IS NULL THEN
    RETURN NULL;
  END IF;

  UPDATE public.pause_instances
     SET state = 'expired',
         expired_reason = 'system_cancelled',
         terminal_at = v_now,
         metadata = metadata || jsonb_build_object('cleared_with_dismiss_current', true)
   WHERE user_id = v_uid AND state = 'pending';

  v_out := public.pause_dismiss(v_open_id, 'user_dismissed_current');
  RETURN v_out;
END;
$$;

-- 9) Adopt pending → active; expire prior open pause as superseded
CREATE OR REPLACE FUNCTION public.pause_adopt_pending_offer()
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_now timestamptz := now();
  v_pending public.pause_instances%ROWTYPE;
  v_open public.pause_instances%ROWTYPE;
  v_msg text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'pause_adopt_pending_offer: not authenticated';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(v_uid::text, 0));

  SELECT * INTO v_pending
    FROM public.pause_instances
   WHERE user_id = v_uid AND state = 'pending'
   ORDER BY created_at DESC
   LIMIT 1
   FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'no_pending');
  END IF;

  SELECT * INTO v_open
    FROM public.pause_instances
   WHERE user_id = v_uid AND state IN ('active', 'engaged')
   ORDER BY created_at DESC
   LIMIT 1
   FOR UPDATE;

  IF FOUND THEN
    UPDATE public.pause_instances
       SET state = 'expired',
           expired_reason = 'superseded',
           terminal_at = v_now,
           superseded_by = v_pending.id
     WHERE id = v_open.id;
  END IF;

  UPDATE public.pause_instances
     SET state = 'active',
         metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('pending_adopted_at', v_now)
   WHERE id = v_pending.id;

  SELECT content->>'message'
    INTO v_msg
    FROM public.pause_ai_artifacts
   WHERE pause_instance_id = v_pending.id AND kind = 'reflection_text'
   LIMIT 1;

  INSERT INTO public.library_items (
    user_id, type, title, body, source_type, pause_instance_id, tags, pinned, is_favorite
  )
  SELECT
    v_pending.user_id,
    'bookmark',
    'Pause',
    COALESCE(v_msg, ''),
    'pause',
    v_pending.id,
    ARRAY[]::text[],
    false,
    false
  WHERE NOT EXISTS (
    SELECT 1
      FROM public.library_items li
     WHERE li.user_id = v_pending.user_id
       AND li.pause_instance_id = v_pending.id
       AND li.source_type = 'pause'
       AND li.status IS DISTINCT FROM 'deleted'
       AND li.status IS DISTINCT FROM 'archived'
  );

  RETURN jsonb_build_object('ok', true, 'instance_id', v_pending.id);
END;
$$;

CREATE OR REPLACE FUNCTION public.pause_decline_pending_offer()
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_now timestamptz := now();
  v_n int;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'pause_decline_pending_offer: not authenticated';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(v_uid::text, 0));

  UPDATE public.pause_instances
     SET state = 'expired',
         expired_reason = 'system_cancelled',
         terminal_at = v_now,
         metadata = metadata || jsonb_build_object('pending_declined', true)
   WHERE user_id = v_uid AND state = 'pending';

  GET DIAGNOSTICS v_n = ROW_COUNT;
  RETURN jsonb_build_object('ok', v_n > 0, 'cleared', v_n);
END;
$$;

REVOKE ALL ON FUNCTION public.pause_adopt_pending_offer() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pause_adopt_pending_offer() TO authenticated;

REVOKE ALL ON FUNCTION public.pause_decline_pending_offer() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pause_decline_pending_offer() TO authenticated;

-- 10) Notifications: pending insert + pending→active refresh
CREATE OR REPLACE FUNCTION public.notifications_from_pause_instances()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.state = 'active' THEN
    PERFORM public.notifications_upsert(
      NEW.user_id,
      'pause',
      'pause_instances',
      NEW.id,
      jsonb_build_object(
        'pause_instance_id', NEW.id,
        'template_slug', (SELECT slug FROM public.pause_templates WHERE id = NEW.template_id),
        'source', NEW.source,
        'severity', NEW.context_snapshot->>'severity',
        'context', NEW.context_snapshot->>'context_text',
        'window_ends_at', NEW.window_ends_at,
        'pending_offer', false
      ),
      '/pause',
      jsonb_build_object('pauseInstanceId', NEW.id::text),
      NEW.created_at
    );
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' AND NEW.state = 'pending' THEN
    PERFORM public.notifications_upsert(
      NEW.user_id,
      'pause',
      'pause_instances',
      NEW.id,
      jsonb_build_object(
        'pause_instance_id', NEW.id,
        'template_slug', (SELECT slug FROM public.pause_templates WHERE id = NEW.template_id),
        'source', NEW.source,
        'severity', NEW.context_snapshot->>'severity',
        'context', NEW.context_snapshot->>'context_text',
        'window_ends_at', NEW.window_ends_at,
        'pending_offer', true
      ),
      '/pause',
      jsonb_build_object('pauseInstanceId', NEW.id::text, 'pendingOffer', 'true'),
      NEW.created_at
    );
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.state = 'pending' AND NEW.state = 'active' THEN
    PERFORM public.notifications_upsert(
      NEW.user_id,
      'pause',
      'pause_instances',
      NEW.id,
      jsonb_build_object(
        'pause_instance_id', NEW.id,
        'template_slug', (SELECT slug FROM public.pause_templates WHERE id = NEW.template_id),
        'source', NEW.source,
        'severity', NEW.context_snapshot->>'severity',
        'context', NEW.context_snapshot->>'context_text',
        'window_ends_at', NEW.window_ends_at,
        'pending_offer', false
      ),
      '/pause',
      jsonb_build_object('pauseInstanceId', NEW.id::text),
      NEW.created_at
    );
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE'
     AND OLD.state IN ('active', 'engaged')
     AND NEW.state IN ('completed', 'dismissed', 'expired') THEN
    UPDATE public.notifications
       SET dismissed_at = now()
     WHERE source_table = 'pause_instances'
       AND source_id = NEW.id
       AND dismissed_at IS NULL;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE'
     AND OLD.state = 'pending'
     AND NEW.state = 'expired' THEN
    UPDATE public.notifications
       SET dismissed_at = now()
     WHERE source_table = 'pause_instances'
       AND source_id = NEW.id
       AND dismissed_at IS NULL;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;
-- Server-side filtered + sorted + paginated archive lists (Pauses / Echo segments).
-- Replaces client-side filtering over offset pages. SECURITY INVOKER + auth.uid().
CREATE OR REPLACE FUNCTION public.library_archive_list_page(
  p_segment text,
  p_favorites_only boolean DEFAULT false,
  p_search text DEFAULT NULL,
  p_tag text DEFAULT NULL,
  p_source_types text[] DEFAULT NULL,
  p_smart_ids uuid[] DEFAULT NULL,
  p_sort text DEFAULT 'newest',
  p_main_pause_only boolean DEFAULT false,
  p_limit int DEFAULT 50,
  p_offset bigint DEFAULT 0
)
RETURNS SETOF public.library_items
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH filt AS (
    SELECT li.*
    FROM public.library_items li
    LEFT JOIN public.pause_instances pi ON pi.id = li.pause_instance_id
    WHERE li.user_id = auth.uid()
      AND p_segment IN ('default', 'echo', 'pauses')
      AND li.status NOT IN ('deleted', 'archived')
      AND (NOT p_favorites_only OR li.is_favorite = true)
      AND (
        NOT p_main_pause_only
        OR p_segment <> 'pauses'
        OR li.source_type = 'pause'
      )
      AND (
        p_segment = 'default'
        OR (
          p_segment = 'echo'
          AND li.pause_instance_id IS NOT NULL
          AND li.source_type = 'pause'
          AND pi.state IN ('expired', 'dismissed')
          AND pi.engaged_at IS NULL
        )
        OR (
          p_segment = 'pauses'
          AND (
            li.pause_instance_id IS NULL
            OR pi.id IS NULL
            OR NOT (pi.state IN ('expired', 'dismissed') AND pi.engaged_at IS NULL)
          )
        )
      )
      AND (
        p_search IS NULL
        OR btrim(p_search) = ''
        OR li.title ILIKE '%' || btrim(p_search) || '%'
        OR li.body ILIKE '%' || btrim(p_search) || '%'
        OR EXISTS (
          SELECT 1
          FROM unnest(coalesce(li.tags, '{}'::text[])) AS t(tag)
          WHERE t.tag ILIKE '%' || btrim(p_search) || '%'
        )
      )
      AND (p_tag IS NULL OR btrim(p_tag) = '' OR p_tag = ANY (coalesce(li.tags, '{}'::text[])))
      AND (
        p_source_types IS NULL
        OR coalesce(cardinality(p_source_types), 0) = 0
        OR li.source_type = ANY (p_source_types)
      )
      AND (
        p_smart_ids IS NULL
        OR coalesce(cardinality(p_smart_ids), 0) = 0
        OR li.id = ANY (p_smart_ids)
      )
  )
  SELECT *
  FROM filt
  ORDER BY
    pinned DESC NULLS LAST,
    CASE WHEN p_sort = 'alphabetical' THEN lower(coalesce(title, '')) END ASC NULLS LAST,
    CASE WHEN p_sort = 'oldest' THEN created_at END ASC NULLS LAST,
    CASE WHEN p_sort = 'newest' THEN created_at END DESC NULLS LAST,
    CASE WHEN p_sort = 'alphabetical' THEN created_at END DESC NULLS LAST,
    id DESC
  LIMIT greatest(1, least(p_limit, 100))
  OFFSET greatest(0, p_offset);
$$;

COMMENT ON FUNCTION public.library_archive_list_page IS
  'Archive Pauses/Echo/Default list: segment + optional favorites, search, tag, source_types, smart id set, sort, limit/offset. Caller must be authenticated.';

REVOKE ALL ON FUNCTION public.library_archive_list_page(
  text, boolean, text, text, text[], uuid[], text, boolean, int, bigint
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.library_archive_list_page(
  text, boolean, text, text, text[], uuid[], text, boolean, int, bigint
) TO authenticated, service_role;
-- Expose latest Feel / Shift 1–5 scales from pause_step_events payloads on v_pause_full
-- (append-only CREATE OR REPLACE per migration-view-safety).

CREATE OR REPLACE VIEW public.v_pause_full WITH (security_invoker = true) AS
SELECT
  pi.*,
  (EXISTS (SELECT 1 FROM public.pause_step_events e WHERE e.pause_instance_id = pi.id AND e.step_type = 'breath_completed')) AS has_breath_completed,
  (EXISTS (SELECT 1 FROM public.pause_step_events e WHERE e.pause_instance_id = pi.id AND e.step_type = 'initial_emotion_logged')) AS has_initial_emotion_logged,
  (EXISTS (SELECT 1 FROM public.pause_step_events e WHERE e.pause_instance_id = pi.id AND e.step_type = 'shift_emotion_logged')) AS has_shift_emotion_logged,
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
    ORDER BY e.created_at DESC LIMIT 1) AS shift_emotion_intensity
FROM public.pause_instances pi;

COMMENT ON VIEW public.v_pause_full IS
  'Rich join of pause_instances + step presence + companion counts + artifact text + latest mood/intensity from step payloads.';
-- ============================================================================
-- Pause: open max age (12h), stale pending (12h), auto-supersede untouched open
--
-- Policy (see docs/systems/pause-system.md):
-- * At most ONE pending context offer per user; newer fingerprint replaces
--   older pending (expired system_cancelled) — never accumulate pendings.
-- * If regime changes while user has active|engaged pause but they never
--   touched it (no step events, no companion events, not engaged), expire the
--   open pause and create the new row as active immediately (no modal).
-- * active|engaged rows older than 12h wall-clock from created_at expire with
--   open_max_age (sweep + transition engine).
-- * pending rows older than 12h from created_at expire (system_cancelled).
-- ============================================================================

-- 1) New terminal reason for max open age
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'pause_expired_reason' AND e.enumlabel = 'open_max_age'
  ) THEN
    ALTER TYPE public.pause_expired_reason ADD VALUE 'open_max_age';
  END IF;
END$$;

-- 2) Transition engine: cap open lifetime + pending short-circuit unchanged tail
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

  IF v_inst.state IN ('active', 'engaged') AND v_inst.created_at <= v_now - interval '12 hours' THEN
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

  v_engaged_ok := (v_tpl.required_for_engaged <@ v_step_types);
  v_completed_ok :=
    (v_tpl.required_for_completed <@ v_step_types)
    AND (v_counted_count >= v_tpl.required_companion_count);

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

-- 3) pause_log_companion — treat open_max_age like clock expiry for companion UX
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
    IF v_inst.state NOT IN ('active', 'engaged') THEN
      v_reason := CASE v_inst.state
                    WHEN 'pending' THEN 'no_active_pause'
                    WHEN 'completed' THEN 'no_active_pause'
                    WHEN 'dismissed' THEN 'no_active_pause'
                    WHEN 'expired' THEN
                      CASE v_inst.expired_reason::text
                        WHEN 'context_lost' THEN 'context_lost'
                        WHEN 'window_elapsed' THEN 'outside_window'
                        WHEN 'open_max_age' THEN 'outside_window'
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
      p_instance_id, v_effective_user_id, p_companion_type, p_action, p_entry_point,
      true, NULL
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

-- 4) Batch sweeps: template window, then 12h open cap, then stale pending
CREATE OR REPLACE FUNCTION public.pause_sweep_window_elapsed()
RETURNS integer
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now timestamptz := now();
  v_total integer := 0;
  v_n integer;
BEGIN
  WITH victims AS (
    SELECT id
      FROM public.pause_instances
     WHERE state IN ('active', 'engaged')
       AND window_ends_at <= v_now
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.pause_instances pi
     SET state = 'expired',
         expired_reason = 'window_elapsed',
         terminal_at = v_now
    FROM victims v
   WHERE pi.id = v.id;
  GET DIAGNOSTICS v_n = ROW_COUNT;
  v_total := v_total + v_n;

  WITH victims AS (
    SELECT id
      FROM public.pause_instances
     WHERE state IN ('active', 'engaged')
       AND created_at <= v_now - interval '12 hours'
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.pause_instances pi
     SET state = 'expired',
         expired_reason = 'open_max_age',
         terminal_at = v_now
    FROM victims v
   WHERE pi.id = v.id;
  GET DIAGNOSTICS v_n = ROW_COUNT;
  v_total := v_total + v_n;

  WITH victims AS (
    SELECT id
      FROM public.pause_instances
     WHERE state = 'pending'
       AND created_at <= v_now - interval '12 hours'
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.pause_instances pi
     SET state = 'expired',
         expired_reason = 'system_cancelled',
         terminal_at = v_now,
         metadata = COALESCE(pi.metadata, '{}'::jsonb) || jsonb_build_object('pending_stale_ttl', true)
    FROM victims v
   WHERE pi.id = v.id;
  GET DIAGNOSTICS v_n = ROW_COUNT;
  v_total := v_total + v_n;

  RETURN v_total;
END;
$$;

-- 5) pause_create_or_reuse_as — auto active when open pause untouched
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
  v_open_touched boolean;
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
   WHERE user_id = p_user_id AND state IN ('active', 'engaged')
   ORDER BY created_at DESC LIMIT 1 FOR UPDATE;

  IF FOUND THEN
    IF v_open.context_fingerprint = p_context_fingerprint THEN
      RETURN jsonb_build_object(
        'instance_id', v_open.id, 'created', false, 'reused_reason', 'fingerprint_match',
        'pending_offer', false, 'prior_open_instance_id', null
      );
    END IF;

    SELECT EXISTS (SELECT 1 FROM public.pause_step_events e WHERE e.pause_instance_id = v_open.id)
        OR EXISTS (SELECT 1 FROM public.pause_companion_events c WHERE c.pause_instance_id = v_open.id)
        OR (v_open.state = 'engaged')
      INTO v_open_touched;

    UPDATE public.pause_instances
       SET state = 'expired',
           expired_reason = 'system_cancelled',
           terminal_at = v_now,
           metadata = metadata || jsonb_build_object('pending_offer_replaced', true)
     WHERE user_id = p_user_id AND state = 'pending';

    IF NOT v_open_touched THEN
      UPDATE public.pause_instances
         SET state = 'expired',
             expired_reason = 'superseded',
             terminal_at = v_now,
             metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('auto_superseded_untouched_open', true)
       WHERE id = v_open.id;

      INSERT INTO public.pause_instances (
        user_id, template_id, state, source, context_snapshot, context_rule_result,
        context_fingerprint, window_starts_at, window_ends_at, superseded_by
      ) VALUES (
        p_user_id, v_tpl.id, 'active', p_source,
        COALESCE(p_context_snapshot, '{}'::jsonb), COALESCE(p_context_rule_result, '{}'::jsonb),
        p_context_fingerprint, v_now, v_window_end, null
      ) RETURNING id INTO v_new_id;

      UPDATE public.pause_instances
         SET superseded_by = v_new_id
       WHERE id = v_open.id;

      RETURN jsonb_build_object(
        'instance_id', v_new_id,
        'created', true,
        'reused_reason', null,
        'pending_offer', false,
        'prior_open_instance_id', v_open.id
      );
    END IF;

    INSERT INTO public.pause_instances (
      user_id, template_id, state, source, context_snapshot, context_rule_result,
      context_fingerprint, window_starts_at, window_ends_at, superseded_by, metadata
    ) VALUES (
      p_user_id, v_tpl.id, 'pending', p_source,
      COALESCE(p_context_snapshot, '{}'::jsonb), COALESCE(p_context_rule_result, '{}'::jsonb),
      p_context_fingerprint, v_now, v_window_end, NULL,
      jsonb_build_object('pending_replaces_open_id', v_open.id)
    ) RETURNING id INTO v_new_id;

    RETURN jsonb_build_object(
      'instance_id', v_new_id,
      'created', true,
      'reused_reason', null,
      'pending_offer', true,
      'prior_open_instance_id', v_open.id
    );
  END IF;

  UPDATE public.pause_instances
     SET state = 'expired',
         expired_reason = 'system_cancelled',
         terminal_at = v_now,
         metadata = metadata || jsonb_build_object('pending_cleared_for_new_active', true)
   WHERE user_id = p_user_id AND state = 'pending';

  SELECT * INTO v_recent_dismiss FROM public.pause_instances
   WHERE user_id = p_user_id AND state IN ('dismissed', 'expired')
     AND context_fingerprint = p_context_fingerprint
     AND terminal_at > (v_now - make_interval(secs => (v_tpl.dismissal_suppression_ms::double precision) / 1000.0))
   ORDER BY terminal_at DESC LIMIT 1;
  IF FOUND THEN
    RETURN jsonb_build_object(
      'instance_id', null, 'created', false, 'reused_reason', 'recent_dismissal',
      'pending_offer', false, 'prior_open_instance_id', null
    );
  END IF;

  INSERT INTO public.pause_instances (
    user_id, template_id, state, source, context_snapshot, context_rule_result,
    context_fingerprint, window_starts_at, window_ends_at, superseded_by
  ) VALUES (
    p_user_id, v_tpl.id, 'active', p_source,
    COALESCE(p_context_snapshot, '{}'::jsonb), COALESCE(p_context_rule_result, '{}'::jsonb),
    p_context_fingerprint, v_now, v_window_end, null
  ) RETURNING id INTO v_new_id;

  RETURN jsonb_build_object(
    'instance_id', v_new_id,
    'created', true,
    'reused_reason', null,
    'pending_offer', false,
    'prior_open_instance_id', null
  );
END;
$$;

-- 6) pause_create_or_reuse (authenticated) — same branching
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
  v_open_touched boolean;
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
   WHERE user_id = v_uid AND state IN ('active', 'engaged')
   ORDER BY created_at DESC LIMIT 1 FOR UPDATE;

  IF FOUND THEN
    IF v_open.context_fingerprint = p_context_fingerprint THEN
      RETURN jsonb_build_object(
        'instance_id', v_open.id, 'created', false, 'reused_reason', 'fingerprint_match',
        'pending_offer', false, 'prior_open_instance_id', null
      );
    END IF;

    SELECT EXISTS (SELECT 1 FROM public.pause_step_events e WHERE e.pause_instance_id = v_open.id)
        OR EXISTS (SELECT 1 FROM public.pause_companion_events c WHERE c.pause_instance_id = v_open.id)
        OR (v_open.state = 'engaged')
      INTO v_open_touched;

    UPDATE public.pause_instances
       SET state = 'expired',
           expired_reason = 'system_cancelled',
           terminal_at = v_now,
           metadata = metadata || jsonb_build_object('pending_offer_replaced', true)
     WHERE user_id = v_uid AND state = 'pending';

    IF NOT v_open_touched THEN
      UPDATE public.pause_instances
         SET state = 'expired',
             expired_reason = 'superseded',
             terminal_at = v_now,
             metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('auto_superseded_untouched_open', true)
       WHERE id = v_open.id;

      INSERT INTO public.pause_instances (
        user_id, template_id, state, source, context_snapshot, context_rule_result,
        context_fingerprint, window_starts_at, window_ends_at, superseded_by
      ) VALUES (
        v_uid, v_tpl.id, 'active', p_source,
        COALESCE(p_context_snapshot, '{}'::jsonb), COALESCE(p_context_rule_result, '{}'::jsonb),
        p_context_fingerprint, v_now, v_window_end, null
      ) RETURNING id INTO v_new_id;

      UPDATE public.pause_instances
         SET superseded_by = v_new_id
       WHERE id = v_open.id;

      RETURN jsonb_build_object(
        'instance_id', v_new_id,
        'created', true,
        'reused_reason', null,
        'pending_offer', false,
        'prior_open_instance_id', v_open.id
      );
    END IF;

    INSERT INTO public.pause_instances (
      user_id, template_id, state, source, context_snapshot, context_rule_result,
      context_fingerprint, window_starts_at, window_ends_at, superseded_by, metadata
    ) VALUES (
      v_uid, v_tpl.id, 'pending', p_source,
      COALESCE(p_context_snapshot, '{}'::jsonb), COALESCE(p_context_rule_result, '{}'::jsonb),
      p_context_fingerprint, v_now, v_window_end, null,
      jsonb_build_object('pending_replaces_open_id', v_open.id)
    ) RETURNING id INTO v_new_id;

    RETURN jsonb_build_object(
      'instance_id', v_new_id,
      'created', true,
      'reused_reason', null,
      'pending_offer', true,
      'prior_open_instance_id', v_open.id
    );
  END IF;

  UPDATE public.pause_instances
     SET state = 'expired',
         expired_reason = 'system_cancelled',
         terminal_at = v_now,
         metadata = metadata || jsonb_build_object('pending_cleared_for_new_active', true)
   WHERE user_id = v_uid AND state = 'pending';

  SELECT * INTO v_recent_dismiss FROM public.pause_instances
   WHERE user_id = v_uid AND state IN ('dismissed', 'expired')
     AND context_fingerprint = p_context_fingerprint
     AND terminal_at > (v_now - make_interval(secs => (v_tpl.dismissal_suppression_ms::double precision) / 1000.0))
   ORDER BY terminal_at DESC LIMIT 1;
  IF FOUND THEN
    RETURN jsonb_build_object(
      'instance_id', null, 'created', false, 'reused_reason', 'recent_dismissal',
      'pending_offer', false, 'prior_open_instance_id', null
    );
  END IF;

  INSERT INTO public.pause_instances (
    user_id, template_id, state, source, context_snapshot, context_rule_result,
    context_fingerprint, window_starts_at, window_ends_at, superseded_by
  ) VALUES (
    v_uid, v_tpl.id, 'active', p_source,
    COALESCE(p_context_snapshot, '{}'::jsonb), COALESCE(p_context_rule_result, '{}'::jsonb),
    p_context_fingerprint, v_now, v_window_end, null
  ) RETURNING id INTO v_new_id;

  RETURN jsonb_build_object(
    'instance_id', v_new_id,
    'created', true,
    'reused_reason', null,
    'pending_offer', false,
    'prior_open_instance_id', null
  );
END;
$$;

-- 7) Metrics view — count open_max_age expiries
DROP VIEW IF EXISTS public.v_pause_metrics_daily;
CREATE VIEW public.v_pause_metrics_daily
WITH (security_invoker = true)
AS
SELECT
  user_id,
  date_trunc('day', created_at)::date AS day,
  count(*) AS created,
  count(*) FILTER (WHERE engaged_at   IS NOT NULL) AS engaged,
  count(*) FILTER (WHERE state = 'completed')      AS completed,
  count(*) FILTER (WHERE state = 'dismissed')      AS dismissed,
  count(*) FILTER (WHERE state = 'expired')        AS expired,
  count(*) FILTER (WHERE state = 'expired' AND expired_reason = 'context_lost')    AS expired_context_lost,
  count(*) FILTER (WHERE state = 'expired' AND expired_reason = 'window_elapsed')  AS expired_window_elapsed,
  count(*) FILTER (WHERE state = 'expired' AND expired_reason = 'open_max_age')    AS expired_open_max_age,
  count(*) FILTER (WHERE state = 'expired' AND expired_reason = 'superseded')      AS expired_superseded,
  count(*) FILTER (WHERE state = 'expired' AND expired_reason = 'ineligible_user_state') AS expired_ineligible,
  count(*) FILTER (WHERE state = 'expired' AND expired_reason = 'system_cancelled') AS expired_system_cancelled
FROM public.pause_instances
GROUP BY 1, 2;

COMMENT ON VIEW public.v_pause_metrics_daily IS
  'Per-user, per-day pause lifecycle counters. Feeds admin dashboards.';
