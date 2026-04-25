-- ============================================================================
-- Pause V2 — Phase A, part 1: types, templates, instances, unique-active index
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pause_state') THEN
    CREATE TYPE public.pause_state AS ENUM (
      'active','engaged','completed','dismissed','expired'
    );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pause_expired_reason') THEN
    CREATE TYPE public.pause_expired_reason AS ENUM (
      'context_lost','window_elapsed','superseded','ineligible_user_state','system_cancelled'
    );
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.pause_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  version int NOT NULL DEFAULT 1,
  window_ms bigint NOT NULL,
  required_for_engaged text[] NOT NULL,
  required_for_completed text[] NOT NULL,
  allowed_companion_types text[] NOT NULL,
  required_companion_count int NOT NULL DEFAULT 1,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pause_templates_window_positive CHECK (window_ms > 0),
  CONSTRAINT pause_templates_companion_count_nonneg CHECK (required_companion_count >= 0)
);

ALTER TABLE public.pause_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS pause_templates_read ON public.pause_templates;
CREATE POLICY pause_templates_read ON public.pause_templates FOR SELECT TO authenticated USING (active = true);
DROP POLICY IF EXISTS pause_templates_service_role_write ON public.pause_templates;
CREATE POLICY pause_templates_service_role_write ON public.pause_templates FOR ALL USING (auth.role() = 'service_role');

CREATE TABLE IF NOT EXISTS public.pause_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id uuid NOT NULL REFERENCES public.pause_templates(id) ON DELETE RESTRICT,
  state public.pause_state NOT NULL DEFAULT 'active',
  source text NOT NULL,
  context_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  context_rule_result jsonb NOT NULL DEFAULT '{}'::jsonb,
  context_fingerprint text NOT NULL,
  window_starts_at timestamptz NOT NULL DEFAULT now(),
  window_ends_at  timestamptz NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  engaged_at   timestamptz,
  completed_at timestamptz,
  terminal_at  timestamptz,
  expired_reason public.pause_expired_reason,
  superseded_by uuid REFERENCES public.pause_instances(id) ON DELETE SET NULL,
  dismissed_by_user boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT pause_instances_window_bounds CHECK (window_ends_at > window_starts_at),
  CONSTRAINT pause_instances_active_no_engaged CHECK (state <> 'active' OR engaged_at IS NULL),
  CONSTRAINT pause_instances_engaged_has_engaged_at CHECK (state <> 'engaged' OR engaged_at IS NOT NULL),
  CONSTRAINT pause_instances_completed_ts CHECK (
    (state = 'completed' AND completed_at IS NOT NULL AND engaged_at IS NOT NULL)
    OR (state <> 'completed' AND completed_at IS NULL)
  ),
  CONSTRAINT pause_instances_terminal_ts CHECK (
    (state IN ('completed','dismissed','expired') AND terminal_at IS NOT NULL)
    OR (state IN ('active','engaged') AND terminal_at IS NULL)
  ),
  CONSTRAINT pause_instances_expired_reason_shape CHECK (
    (state = 'expired' AND expired_reason IS NOT NULL)
    OR (state <> 'expired' AND expired_reason IS NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_pause_per_user
  ON public.pause_instances (user_id) WHERE state IN ('active','engaged');
CREATE INDEX IF NOT EXISTS idx_pause_instances_user_state_created
  ON public.pause_instances (user_id, state, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pause_instances_user_completed_at
  ON public.pause_instances (user_id, completed_at DESC) WHERE state = 'completed';
CREATE INDEX IF NOT EXISTS idx_pause_instances_window_open
  ON public.pause_instances (window_ends_at) WHERE state IN ('active','engaged');
CREATE INDEX IF NOT EXISTS idx_pause_instances_user_fingerprint_recent
  ON public.pause_instances (user_id, context_fingerprint, created_at DESC);

ALTER TABLE public.pause_instances ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS pause_instances_owner_select ON public.pause_instances;
CREATE POLICY pause_instances_owner_select ON public.pause_instances FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS pause_instances_service_role_write ON public.pause_instances;
CREATE POLICY pause_instances_service_role_write ON public.pause_instances FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- Part 2: pause_step_events + pause_companion_events
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pause_step_type') THEN
    CREATE TYPE public.pause_step_type AS ENUM (
      'breath_completed','initial_emotion_logged','reflection_step','shift_emotion_logged',
      'outcome_logged','note_updated','tag_updated','favorite_toggled'
    );
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.pause_step_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pause_instance_id uuid NOT NULL REFERENCES public.pause_instances(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  step_type public.pause_step_type NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pause_step_events_pause ON public.pause_step_events (pause_instance_id, step_type, created_at);
CREATE INDEX IF NOT EXISTS idx_pause_step_events_user_type_created ON public.pause_step_events (user_id, step_type, created_at DESC);
ALTER TABLE public.pause_step_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS pause_step_events_owner_select ON public.pause_step_events;
CREATE POLICY pause_step_events_owner_select ON public.pause_step_events FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS pause_step_events_service_role_write ON public.pause_step_events;
CREATE POLICY pause_step_events_service_role_write ON public.pause_step_events FOR ALL USING (auth.role() = 'service_role');

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pause_companion_action') THEN
    CREATE TYPE public.pause_companion_action AS ENUM ('open','complete');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.pause_companion_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pause_instance_id uuid REFERENCES public.pause_instances(id) ON DELETE SET NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  companion_type text NOT NULL,
  action public.pause_companion_action NOT NULL,
  entry_point text NOT NULL,
  counts_for_pause boolean NOT NULL DEFAULT false,
  non_counting_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pause_companion_events_count_coherence CHECK (
    (counts_for_pause = true AND non_counting_reason IS NULL) OR counts_for_pause = false
  )
);
CREATE INDEX IF NOT EXISTS idx_pause_companion_events_pause ON public.pause_companion_events (pause_instance_id, companion_type, action, created_at);
CREATE INDEX IF NOT EXISTS idx_pause_companion_events_user_type_created ON public.pause_companion_events (user_id, companion_type, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_pause_companion_counted_per_instance
  ON public.pause_companion_events (pause_instance_id, companion_type)
  WHERE action = 'complete' AND counts_for_pause = true;
ALTER TABLE public.pause_companion_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS pause_companion_events_owner_select ON public.pause_companion_events;
CREATE POLICY pause_companion_events_owner_select ON public.pause_companion_events FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS pause_companion_events_service_role_write ON public.pause_companion_events;
CREATE POLICY pause_companion_events_service_role_write ON public.pause_companion_events FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- Part 3: pause_ai_artifacts
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.pause_ai_artifacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pause_instance_id uuid NOT NULL REFERENCES public.pause_instances(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL,
  content jsonb NOT NULL,
  model text,
  prompt_version text,
  cache_entry_id uuid REFERENCES public.companion_cache(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pause_ai_artifacts_kind_nonempty CHECK (length(trim(kind)) > 0),
  CONSTRAINT pause_ai_artifacts_unique_per_instance UNIQUE (pause_instance_id, kind)
);
CREATE INDEX IF NOT EXISTS idx_pause_ai_artifacts_instance ON public.pause_ai_artifacts (pause_instance_id);
CREATE INDEX IF NOT EXISTS idx_pause_ai_artifacts_user_kind_created ON public.pause_ai_artifacts (user_id, kind, created_at DESC);
ALTER TABLE public.pause_ai_artifacts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS pause_ai_artifacts_owner_select ON public.pause_ai_artifacts;
CREATE POLICY pause_ai_artifacts_owner_select ON public.pause_ai_artifacts FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS pause_ai_artifacts_service_role_write ON public.pause_ai_artifacts;
CREATE POLICY pause_ai_artifacts_service_role_write ON public.pause_ai_artifacts FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- Part 4: transition engine
-- ============================================================================

CREATE OR REPLACE FUNCTION public.pause_evaluate_transitions(p_instance_id uuid)
RETURNS public.pause_state
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public
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
  IF v_inst.state IN ('completed','dismissed','expired') THEN RETURN v_inst.state; END IF;
  IF v_inst.window_ends_at <= v_now THEN
    UPDATE public.pause_instances SET state='expired', expired_reason='window_elapsed', terminal_at=v_now WHERE id=p_instance_id;
    RETURN 'expired';
  END IF;
  SELECT * INTO v_tpl FROM public.pause_templates WHERE id = v_inst.template_id;
  IF NOT FOUND THEN RETURN v_inst.state; END IF;
  SELECT COALESCE(array_agg(DISTINCT step_type::text), ARRAY[]::text[]) INTO v_step_types
    FROM public.pause_step_events WHERE pause_instance_id = p_instance_id;
  SELECT count(*) INTO v_counted_count FROM public.pause_companion_events
   WHERE pause_instance_id = p_instance_id AND action = 'complete' AND counts_for_pause = true;
  v_engaged_ok := (v_tpl.required_for_engaged <@ v_step_types);
  v_completed_ok := (v_tpl.required_for_completed <@ v_step_types) AND (v_counted_count >= v_tpl.required_companion_count);
  IF v_completed_ok THEN
    UPDATE public.pause_instances SET state='completed',
      completed_at=COALESCE(completed_at,v_now), engaged_at=COALESCE(engaged_at,v_now), terminal_at=v_now
    WHERE id=p_instance_id;
    RETURN 'completed';
  END IF;
  IF v_engaged_ok AND v_inst.state = 'active' THEN
    UPDATE public.pause_instances SET state='engaged', engaged_at=COALESCE(engaged_at,v_now) WHERE id=p_instance_id;
    RETURN 'engaged';
  END IF;
  RETURN v_inst.state;
END;
$$;
REVOKE ALL ON FUNCTION public.pause_evaluate_transitions(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pause_evaluate_transitions(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.pause_dismiss(p_instance_id uuid, p_reason text DEFAULT NULL)
RETURNS public.pause_state
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_inst public.pause_instances%ROWTYPE;
  v_now timestamptz := now();
  v_caller_role text := auth.role();
  v_caller_uid  uuid := auth.uid();
BEGIN
  SELECT * INTO v_inst FROM public.pause_instances WHERE id = p_instance_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'pause_dismiss: instance not found'; END IF;
  IF v_caller_role <> 'service_role' AND v_inst.user_id <> v_caller_uid THEN
    RAISE EXCEPTION 'pause_dismiss: not authorized';
  END IF;
  IF v_inst.state IN ('completed','dismissed','expired') THEN RETURN v_inst.state; END IF;
  UPDATE public.pause_instances
     SET state='dismissed', dismissed_by_user=true, terminal_at=v_now,
         metadata = metadata || COALESCE(jsonb_build_object('dismiss_reason', p_reason), '{}'::jsonb)
   WHERE id = p_instance_id;
  RETURN 'dismissed';
END;
$$;
REVOKE ALL ON FUNCTION public.pause_dismiss(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pause_dismiss(uuid, text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.pause_expire(p_instance_id uuid, p_reason public.pause_expired_reason)
RETURNS public.pause_state
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_inst public.pause_instances%ROWTYPE;
  v_now timestamptz := now();
BEGIN
  IF auth.role() <> 'service_role' THEN RAISE EXCEPTION 'pause_expire: service_role required'; END IF;
  SELECT * INTO v_inst FROM public.pause_instances WHERE id = p_instance_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'pause_expire: instance not found'; END IF;
  IF v_inst.state IN ('completed','dismissed','expired') THEN RETURN v_inst.state; END IF;
  UPDATE public.pause_instances SET state='expired', expired_reason=p_reason, terminal_at=v_now WHERE id=p_instance_id;
  RETURN 'expired';
END;
$$;
REVOKE ALL ON FUNCTION public.pause_expire(uuid, public.pause_expired_reason) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pause_expire(uuid, public.pause_expired_reason) TO service_role;

CREATE OR REPLACE FUNCTION public.pause_sweep_window_elapsed()
RETURNS integer
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_now timestamptz := now(); v_count integer;
BEGIN
  WITH victims AS (
    SELECT id FROM public.pause_instances
     WHERE state IN ('active','engaged') AND window_ends_at <= v_now
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.pause_instances pi
     SET state='expired', expired_reason='window_elapsed', terminal_at=v_now
    FROM victims v WHERE pi.id = v.id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;
REVOKE ALL ON FUNCTION public.pause_sweep_window_elapsed() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pause_sweep_window_elapsed() TO service_role;

CREATE OR REPLACE FUNCTION public.trg_pause_step_events_after_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$ BEGIN PERFORM public.pause_evaluate_transitions(NEW.pause_instance_id); RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS trg_pause_step_events_ai ON public.pause_step_events;
CREATE TRIGGER trg_pause_step_events_ai AFTER INSERT ON public.pause_step_events
FOR EACH ROW EXECUTE FUNCTION public.trg_pause_step_events_after_insert();

CREATE OR REPLACE FUNCTION public.trg_pause_companion_events_after_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.action = 'complete' AND NEW.counts_for_pause = true AND NEW.pause_instance_id IS NOT NULL THEN
    PERFORM public.pause_evaluate_transitions(NEW.pause_instance_id);
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_pause_companion_events_ai ON public.pause_companion_events;
CREATE TRIGGER trg_pause_companion_events_ai AFTER INSERT ON public.pause_companion_events
FOR EACH ROW EXECUTE FUNCTION public.trg_pause_companion_events_after_insert();

-- ============================================================================
-- Part 5: views
-- ============================================================================

DROP VIEW IF EXISTS public.v_pause_current;
CREATE VIEW public.v_pause_current WITH (security_invoker = true) AS
SELECT * FROM public.pause_instances WHERE state IN ('active','engaged');

DROP VIEW IF EXISTS public.v_pause_completed;
CREATE VIEW public.v_pause_completed WITH (security_invoker = true) AS
SELECT * FROM public.pause_instances WHERE state = 'completed';

DROP VIEW IF EXISTS public.v_pause_full;
CREATE VIEW public.v_pause_full WITH (security_invoker = true) AS
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
  (SELECT content->>'haiku' FROM public.pause_ai_artifacts a WHERE a.pause_instance_id = pi.id AND a.kind = 'haiku' LIMIT 1) AS haiku_text
FROM public.pause_instances pi;

DROP VIEW IF EXISTS public.v_pause_metrics_daily;
CREATE VIEW public.v_pause_metrics_daily WITH (security_invoker = true) AS
SELECT
  user_id,
  date_trunc('day', created_at)::date AS day,
  count(*) AS created,
  count(*) FILTER (WHERE engaged_at IS NOT NULL) AS engaged,
  count(*) FILTER (WHERE state = 'completed') AS completed,
  count(*) FILTER (WHERE state = 'dismissed') AS dismissed,
  count(*) FILTER (WHERE state = 'expired') AS expired,
  count(*) FILTER (WHERE state = 'expired' AND expired_reason = 'context_lost') AS expired_context_lost,
  count(*) FILTER (WHERE state = 'expired' AND expired_reason = 'window_elapsed') AS expired_window_elapsed,
  count(*) FILTER (WHERE state = 'expired' AND expired_reason = 'superseded') AS expired_superseded,
  count(*) FILTER (WHERE state = 'expired' AND expired_reason = 'ineligible_user_state') AS expired_ineligible,
  count(*) FILTER (WHERE state = 'expired' AND expired_reason = 'system_cancelled') AS expired_system_cancelled
FROM public.pause_instances GROUP BY 1, 2;

-- ============================================================================
-- Part 6: seed default volatility_v1 template
-- ============================================================================

INSERT INTO public.pause_templates (
  slug, version, window_ms, required_for_engaged, required_for_completed,
  allowed_companion_types, required_companion_count, config, active
) VALUES (
  'volatility_v1', 1, 21600000,
  ARRAY['breath_completed','initial_emotion_logged']::text[],
  ARRAY['breath_completed','initial_emotion_logged','shift_emotion_logged','outcome_logged']::text[],
  ARRAY['signal','ground_nudge','historical_insight','zoom_out','zoom_out_deep_time','haiku']::text[],
  1,
  jsonb_build_object('description','Volatility-driven pause. Default template for manual and cron pauses.','surface','bell + home + library'),
  true
) ON CONFLICT (slug) DO NOTHING;
