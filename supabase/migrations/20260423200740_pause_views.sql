-- ============================================================================
-- Pause V2 — Phase A, part 5: read-model views
--
-- All views are `security_invoker = true` so RLS on the underlying tables
-- applies to view consumers (standard pattern per docs/ops/migration-view-safety.md).
--
-- Four views:
--   v_pause_current         — the single active/engaged instance per user (if any)
--   v_pause_completed       — all completed instances
--   v_pause_full            — rich join of instance + step counts + companion counts + artifact shape
--   v_pause_metrics_daily   — daily aggregates (created/engaged/completed/expired, rates)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- v_pause_current
-- ---------------------------------------------------------------------------
DROP VIEW IF EXISTS public.v_pause_current;
CREATE VIEW public.v_pause_current
WITH (security_invoker = true)
AS
SELECT *
  FROM public.pause_instances
 WHERE state IN ('active','engaged');

COMMENT ON VIEW public.v_pause_current IS
  'The single open (active or engaged) pause per user, if any. Enforced by '
  'the partial unique index uniq_active_pause_per_user on pause_instances.';

-- ---------------------------------------------------------------------------
-- v_pause_completed
-- ---------------------------------------------------------------------------
DROP VIEW IF EXISTS public.v_pause_completed;
CREATE VIEW public.v_pause_completed
WITH (security_invoker = true)
AS
SELECT *
  FROM public.pause_instances
 WHERE state = 'completed';

COMMENT ON VIEW public.v_pause_completed IS
  'All completed pause instances. Canonical source for volume / timing / '
  'effectiveness metrics in stats and badges.';

-- ---------------------------------------------------------------------------
-- v_pause_full
-- ---------------------------------------------------------------------------
-- Rich per-instance read model: instance row + step presence booleans +
-- counted companion count + artifact text/shape lookups.
--
-- Build as scalar subqueries (cheap against indexes) rather than GROUP BY so
-- the row shape stays 1:1 with pause_instances.id.
--
-- Columns added compared to pause_instances.*:
--   has_breath_completed / has_initial_emotion_logged / has_shift_emotion_logged /
--   has_outcome_logged / has_note / has_tag / has_favorite
--   initial_mood / shift_mood / outcome / note_text / tags / is_favorite
--   counted_companion_count
--   counted_companion_types
--   reflection_text / haiku_text
DROP VIEW IF EXISTS public.v_pause_full;
CREATE VIEW public.v_pause_full
WITH (security_invoker = true)
AS
SELECT
  pi.*,
  (EXISTS (
    SELECT 1 FROM public.pause_step_events e
     WHERE e.pause_instance_id = pi.id AND e.step_type = 'breath_completed'
  )) AS has_breath_completed,
  (EXISTS (
    SELECT 1 FROM public.pause_step_events e
     WHERE e.pause_instance_id = pi.id AND e.step_type = 'initial_emotion_logged'
  )) AS has_initial_emotion_logged,
  (EXISTS (
    SELECT 1 FROM public.pause_step_events e
     WHERE e.pause_instance_id = pi.id AND e.step_type = 'shift_emotion_logged'
  )) AS has_shift_emotion_logged,
  (EXISTS (
    SELECT 1 FROM public.pause_step_events e
     WHERE e.pause_instance_id = pi.id AND e.step_type = 'outcome_logged'
  )) AS has_outcome_logged,
  (SELECT payload->>'mood' FROM public.pause_step_events e
    WHERE e.pause_instance_id = pi.id AND e.step_type = 'initial_emotion_logged'
    ORDER BY e.created_at DESC LIMIT 1
  ) AS initial_mood,
  (SELECT payload->>'mood' FROM public.pause_step_events e
    WHERE e.pause_instance_id = pi.id AND e.step_type = 'shift_emotion_logged'
    ORDER BY e.created_at DESC LIMIT 1
  ) AS shift_mood,
  (SELECT payload->>'outcome' FROM public.pause_step_events e
    WHERE e.pause_instance_id = pi.id AND e.step_type = 'outcome_logged'
    ORDER BY e.created_at DESC LIMIT 1
  ) AS outcome,
  (SELECT payload->>'text' FROM public.pause_step_events e
    WHERE e.pause_instance_id = pi.id AND e.step_type = 'note_updated'
    ORDER BY e.created_at DESC LIMIT 1
  ) AS note_text,
  (SELECT ARRAY(SELECT jsonb_array_elements_text(payload->'tags'))
     FROM public.pause_step_events e
    WHERE e.pause_instance_id = pi.id AND e.step_type = 'tag_updated'
    ORDER BY e.created_at DESC LIMIT 1
  ) AS tags,
  COALESCE((SELECT (payload->>'is_favorite')::boolean
     FROM public.pause_step_events e
    WHERE e.pause_instance_id = pi.id AND e.step_type = 'favorite_toggled'
    ORDER BY e.created_at DESC LIMIT 1
  ), false) AS is_favorite,
  (SELECT count(*) FROM public.pause_companion_events ce
    WHERE ce.pause_instance_id = pi.id
      AND ce.action = 'complete'
      AND ce.counts_for_pause = true
  )::int AS counted_companion_count,
  (SELECT COALESCE(array_agg(DISTINCT ce.companion_type), ARRAY[]::text[])
     FROM public.pause_companion_events ce
    WHERE ce.pause_instance_id = pi.id
      AND ce.action = 'complete'
      AND ce.counts_for_pause = true
  ) AS counted_companion_types,
  (SELECT content->>'message' FROM public.pause_ai_artifacts a
    WHERE a.pause_instance_id = pi.id AND a.kind = 'reflection_text' LIMIT 1
  ) AS reflection_text,
  (SELECT content->>'haiku' FROM public.pause_ai_artifacts a
    WHERE a.pause_instance_id = pi.id AND a.kind = 'haiku' LIMIT 1
  ) AS haiku_text
FROM public.pause_instances pi;

COMMENT ON VIEW public.v_pause_full IS
  'Per-instance read model joining step presence + counted companions + '
  'canonical artifact text. Row shape 1:1 with pause_instances.id. Use this '
  'for PauseSession hydration, History, stats, and badges.';

-- ---------------------------------------------------------------------------
-- v_pause_metrics_daily
-- ---------------------------------------------------------------------------
-- Per-user daily counters. Aligned with stats plan §7.1.
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
  count(*) FILTER (WHERE state = 'expired' AND expired_reason = 'superseded')      AS expired_superseded,
  count(*) FILTER (WHERE state = 'expired' AND expired_reason = 'ineligible_user_state') AS expired_ineligible,
  count(*) FILTER (WHERE state = 'expired' AND expired_reason = 'system_cancelled') AS expired_system_cancelled
FROM public.pause_instances
GROUP BY 1, 2;

COMMENT ON VIEW public.v_pause_metrics_daily IS
  'Per-user, per-day pause lifecycle counters. Feeds admin dashboards.';
