BEGIN;

DROP TRIGGER IF EXISTS trg_notifications_reflections ON public.reflections;
DROP TRIGGER IF EXISTS trg_reflections_set_engaged_at ON public.reflections;
DROP TRIGGER IF EXISTS trg_notifications_pause_notifications ON public.pause_notifications;

DROP FUNCTION IF EXISTS public.notifications_from_reflections();
DROP FUNCTION IF EXISTS public.notifications_from_pause_notifications();
DROP FUNCTION IF EXISTS public.set_reflection_engaged_at();
DROP FUNCTION IF EXISTS public.purge_orphan_notification_reflections(integer);
DROP FUNCTION IF EXISTS public.find_similar_reflection(uuid, uuid);
DROP FUNCTION IF EXISTS public.find_similar_reflection(uuid, uuid, integer);

CREATE OR REPLACE FUNCTION public.get_holzen_number()
  RETURNS jsonb
  LANGUAGE sql
  STABLE SECURITY DEFINER
  SET search_path = public
AS $$
  WITH latest_outcomes AS (
    SELECT DISTINCT ON (e.pause_instance_id)
           e.pause_instance_id,
           e.payload->>'outcome' AS outcome
      FROM public.pause_step_events e
     WHERE e.step_type = 'outcome_logged'
     ORDER BY e.pause_instance_id, e.created_at DESC
  ),
  window_rows AS (
    SELECT lo.outcome
      FROM public.pause_instances pi
      JOIN latest_outcomes lo ON lo.pause_instance_id = pi.id
     WHERE pi.state = 'completed'
       AND pi.completed_at >= (now() - interval '7 days')
  )
  SELECT jsonb_build_object(
    'total', COUNT(*) FILTER (WHERE outcome IS NOT NULL),
    'held_steady', COUNT(*) FILTER (WHERE outcome IN ('held','nothing')),
    'percent', CASE
      WHEN COUNT(*) FILTER (WHERE outcome IS NOT NULL) = 0 THEN 0
      ELSE ROUND(
        (COUNT(*) FILTER (WHERE outcome IN ('held','nothing'))::numeric /
         COUNT(*) FILTER (WHERE outcome IS NOT NULL)::numeric) * 100
      )
    END,
    'calculated_at', now()
  )
  FROM window_rows;
$$;

DROP VIEW IF EXISTS public.v_reflection_with_companions CASCADE;
DROP VIEW IF EXISTS public.v_reflections_engaged CASCADE;
DROP VIEW IF EXISTS public.v_reflections_completed CASCADE;
DROP VIEW IF EXISTS public.v_notification_response_rate CASCADE;
DROP VIEW IF EXISTS public.v_reflection_with_companion_serve_sources CASCADE;

DROP INDEX IF EXISTS public.idx_library_items_user_reflection_source;
DROP INDEX IF EXISTS public.idx_library_items_reflection;
ALTER TABLE public.library_items DROP COLUMN IF EXISTS reflection_id CASCADE;

ALTER TABLE public.practice_entries DROP COLUMN IF EXISTS source_reflection_id CASCADE;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='ritual_completions') THEN
    EXECUTE 'ALTER TABLE public.ritual_completions DROP COLUMN IF EXISTS reflection_id CASCADE';
  END IF;
END$$;

ALTER TABLE public.companion_serves DROP COLUMN IF EXISTS reflection_id CASCADE;

DROP INDEX IF EXISTS public.idx_generation_attempts_reflection_id;
ALTER TABLE public.generation_attempts DROP COLUMN IF EXISTS reflection_id CASCADE;

DELETE FROM public.notifications
 WHERE source_table IN ('reflections', 'pause_notifications', 'follow_ups');

DROP INDEX IF EXISTS public.idx_analytics_events_companion_feedback;
CREATE INDEX IF NOT EXISTS idx_analytics_events_companion_feedback
  ON public.analytics_events ((metadata->>'pause_instance_id'), (metadata->>'companion_type'))
  WHERE event = 'companion_feedback';

DROP TABLE IF EXISTS public.follow_ups CASCADE;
DROP TABLE IF EXISTS public.pause_notifications CASCADE;
DROP TABLE IF EXISTS public.reflection_companions CASCADE;
DROP TABLE IF EXISTS public.reflections CASCADE;

DELETE FROM public.notifications WHERE source_table = 'user_badges';

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='user_badges') THEN
    EXECUTE 'TRUNCATE public.user_badges RESTART IDENTITY';
  END IF;
END$$;

DO $$
DECLARE
  v_jobid bigint;
BEGIN
  SELECT jobid INTO v_jobid FROM cron.job WHERE jobname = 'check-followups-hourly';
  IF v_jobid IS NOT NULL THEN
    PERFORM cron.unschedule(v_jobid);
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END$$;

COMMIT;