-- ============================================================================
-- Combined application of 4 pending repo migrations:
--   20260420190000_cron_heartbeats_app_config.sql
--   20260420200000_normalize_outcome_hold_to_held.sql
--   20260420220000_reflection_source_and_engagement_views.sql
--   20260420230000_reflection_engaged_at.sql
-- ============================================================================

-- ── 1) cron_heartbeats_app_config ───────────────────────────────────────────
INSERT INTO public.app_config (key, value, description) VALUES
  ('heartbeat.refresh_btc_prices', '""'::jsonb, 'BetterStack heartbeat UUID for refresh-btc-prices.'),
  ('heartbeat.fetch_source_feeds', '""'::jsonb, 'BetterStack heartbeat UUID for fetch-source-feeds.'),
  ('heartbeat.pregenerate_companions', '""'::jsonb, 'BetterStack heartbeat UUID for pregenerate-companions.'),
  ('heartbeat.check_volatility', '""'::jsonb, 'BetterStack heartbeat UUID for check-volatility.'),
  ('heartbeat.check_followups', '""'::jsonb, 'BetterStack heartbeat UUID for check-followups.'),
  ('heartbeat.process_referral_pending', '""'::jsonb, 'BetterStack heartbeat UUID for process-referral-pending.'),
  ('heartbeat.night_reflection', '""'::jsonb, 'BetterStack heartbeat UUID for night-reflection.'),
  ('heartbeat.process_email_queue', '""'::jsonb, 'BetterStack heartbeat UUID for process-email-queue.'),
  ('heartbeat._base_url', '""'::jsonb, 'Override base URL for heartbeat HTTP GETs. Empty = BetterStack default.')
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.emit_job_heartbeat(job_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  hb_uuid       text;
  override_base text;
  base_url      text;
  url           text;
BEGIN
  IF job_name IS NULL OR length(job_name) = 0 THEN RETURN; END IF;
  SELECT value #>> '{}' INTO hb_uuid FROM public.app_config WHERE key = 'heartbeat.' || job_name;
  IF hb_uuid IS NULL OR length(hb_uuid) = 0 THEN RETURN; END IF;
  SELECT value #>> '{}' INTO override_base FROM public.app_config WHERE key = 'heartbeat._base_url';
  IF override_base IS NULL OR length(override_base) = 0 THEN
    base_url := 'https://uptime.betterstack.com/api/v1/heartbeat/';
  ELSE
    base_url := override_base;
  END IF;
  url := base_url || hb_uuid;
  BEGIN PERFORM net.http_get(url); EXCEPTION WHEN others THEN PERFORM NULL; END;
END;
$$;

-- ── 2) normalize_outcome_hold_to_held ───────────────────────────────────────
UPDATE public.reflections SET outcome = 'held' WHERE outcome = 'hold';

CREATE OR REPLACE FUNCTION public.get_holzen_number()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT jsonb_build_object(
    'total', COUNT(*) FILTER (WHERE outcome IS NOT NULL),
    'held_steady', COUNT(*) FILTER (WHERE outcome IN ('held', 'nothing')),
    'percent', CASE
      WHEN COUNT(*) FILTER (WHERE outcome IS NOT NULL) = 0 THEN 0
      ELSE ROUND(
        (COUNT(*) FILTER (WHERE outcome IN ('held', 'nothing'))::numeric /
         COUNT(*) FILTER (WHERE outcome IS NOT NULL)::numeric) * 100
      )
    END,
    'calculated_at', now()
  )
  FROM reflections
  WHERE created_at >= (now() - interval '7 days')
    AND outcome IS NOT NULL;
$$;

-- ── 3) reflection_source_and_engagement_views ───────────────────────────────
ALTER TABLE public.reflections ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual';
UPDATE public.reflections SET source = 'manual' WHERE source IS NULL;

CREATE INDEX IF NOT EXISTS idx_reflections_orphan_notifications
  ON public.reflections (created_at)
  WHERE source IS NOT NULL AND source <> 'manual'
    AND outcome IS NULL AND mood_after IS NULL
    AND breathing_completed = false;

DROP POLICY IF EXISTS "Admins can view all pause notifications" ON public.pause_notifications;
CREATE POLICY "Admins can view all pause notifications"
  ON public.pause_notifications FOR SELECT USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.purge_orphan_notification_reflections(cutoff_days integer DEFAULT 30)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE deleted_count integer;
BEGIN
  IF cutoff_days IS NULL OR cutoff_days < 1 THEN RAISE EXCEPTION 'cutoff_days must be >= 1'; END IF;
  WITH victims AS (
    DELETE FROM public.reflections
    WHERE source IS NOT NULL AND source <> 'manual'
      AND outcome IS NULL AND mood_after IS NULL
      AND (breathing_completed IS NULL OR breathing_completed = false)
      AND created_at < (now() - make_interval(days => cutoff_days))
    RETURNING 1
  )
  SELECT count(*) INTO deleted_count FROM victims;
  RETURN COALESCE(deleted_count, 0);
END;
$$;
REVOKE ALL ON FUNCTION public.purge_orphan_notification_reflections(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.purge_orphan_notification_reflections(integer) TO service_role;

-- ── 4) reflection_engaged_at ────────────────────────────────────────────────
ALTER TABLE public.reflections ADD COLUMN IF NOT EXISTS engaged_at timestamptz;

COMMENT ON COLUMN public.reflections.engaged_at IS
  'First moment the user recorded a decision (outcome transitioned null→set). NULL for ignored-notification orphans.';

CREATE OR REPLACE FUNCTION public.set_reflection_engaged_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.engaged_at IS NOT NULL THEN RETURN NEW; END IF;
    IF NEW.outcome IS NOT NULL AND NEW.outcome <> '' THEN
      NEW.engaged_at := now();
    END IF;
    RETURN NEW;
  END IF;
  IF NEW.engaged_at IS DISTINCT FROM OLD.engaged_at THEN RETURN NEW; END IF;
  IF OLD.engaged_at IS NULL
     AND NEW.outcome IS NOT NULL AND NEW.outcome <> ''
     AND (OLD.outcome IS NULL OR OLD.outcome = '') THEN
    NEW.engaged_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_reflections_set_engaged_at ON public.reflections;
CREATE TRIGGER trg_reflections_set_engaged_at
  BEFORE INSERT OR UPDATE ON public.reflections
  FOR EACH ROW EXECUTE FUNCTION public.set_reflection_engaged_at();

UPDATE public.reflections SET engaged_at = created_at
WHERE engaged_at IS NULL AND outcome IS NOT NULL AND outcome <> '';

-- Rebuild engagement views (must drop dependent view first)
DROP VIEW IF EXISTS public.v_notification_response_rate;
DROP VIEW IF EXISTS public.v_reflections_completed;
DROP VIEW IF EXISTS public.v_reflections_engaged;

CREATE VIEW public.v_reflections_completed AS
SELECT * FROM public.reflections r
WHERE r.outcome IS NOT NULL AND r.outcome <> '';
ALTER VIEW public.v_reflections_completed SET (security_invoker = true);

CREATE VIEW public.v_reflections_engaged AS
SELECT * FROM public.reflections r
WHERE r.breathing_completed = true
  AND r.mood IS NOT NULL AND r.mood <> ''
  AND r.mood_after IS NOT NULL AND r.mood_after <> ''
  AND r.outcome IS NOT NULL AND r.outcome <> '';
ALTER VIEW public.v_reflections_engaged SET (security_invoker = true);

CREATE VIEW public.v_notification_response_rate AS
SELECT
  date_trunc('day', pn.created_at)::date AS day,
  count(*) AS notifications,
  count(*) FILTER (WHERE r.outcome IS NOT NULL AND r.outcome <> '') AS completed,
  count(*) FILTER (
    WHERE r.breathing_completed = true
      AND r.mood IS NOT NULL AND r.mood <> ''
      AND r.mood_after IS NOT NULL AND r.mood_after <> ''
      AND r.outcome IS NOT NULL AND r.outcome <> ''
  ) AS engaged,
  count(*) FILTER (
    WHERE pn.reflection_id IS NULL OR r.outcome IS NULL OR r.outcome = ''
  ) AS ignored,
  round(100.0 * count(*) FILTER (WHERE r.outcome IS NOT NULL AND r.outcome <> '') / nullif(count(*), 0), 1) AS pct_completed,
  round(100.0 * count(*) FILTER (
    WHERE r.breathing_completed = true
      AND r.mood IS NOT NULL AND r.mood <> ''
      AND r.mood_after IS NOT NULL AND r.mood_after <> ''
      AND r.outcome IS NOT NULL AND r.outcome <> ''
  ) / nullif(count(*), 0), 1) AS pct_engaged
FROM public.pause_notifications pn
LEFT JOIN public.reflections r ON r.id = pn.reflection_id
GROUP BY 1 ORDER BY 1 DESC;
ALTER VIEW public.v_notification_response_rate SET (security_invoker = true);

-- Rebuild v_reflection_with_companions to include engaged_at
DROP VIEW IF EXISTS public.v_reflection_with_companions;
CREATE VIEW public.v_reflection_with_companions
WITH (security_invoker = true) AS
SELECT
  r.id, r.user_id, r.message, r.context, r.created_at, r.engaged_at,
  r.is_favorite, r.haiku, r.outcome, r.mood, r.note, r.tags,
  r.breathing_completed, r.haiku_read, r.mood_after,
  r.grounding_read, r.grounding_title, r.grounding_body,
  sc.content ->> 'title' AS signal_title,
  sc.content ->> 'body' AS signal_body,
  sc.content ->> 'source' AS signal_source,
  sc.content ->> 'url' AS signal_url,
  sc.read AS signal_read,
  sc.content ->> 'title' AS companion_signal_title,
  sc.content ->> 'body' AS companion_signal_body,
  sc.content ->> 'source' AS companion_signal_source,
  sc.content ->> 'url' AS companion_signal_url,
  sc.read AS companion_signal_read,
  gc.content ->> 'title' AS companion_grounding_title,
  gc.content ->> 'body' AS companion_grounding_body,
  gc.content ->> 'citation' AS companion_grounding_citation,
  gc.content ->> 'url' AS companion_grounding_url,
  gc.read AS companion_grounding_read,
  hc.content AS history_insight_data,
  hc.read AS history_read,
  hc.content AS companion_history_data,
  hc.read AS companion_history_read,
  COALESCE(zc.content, zdt.content) AS zoom_out_data,
  COALESCE(zc.read, zdt.read) AS zoom_out_read,
  COALESCE(zc.content, zdt.content) AS companion_zoom_out_data,
  COALESCE(zc.read, zdt.read) AS companion_zoom_out_read,
  (SELECT cs.serve_source FROM public.companion_serves cs WHERE cs.reflection_id = r.id AND cs.companion_type = 'signal' ORDER BY cs.created_at DESC NULLS LAST LIMIT 1) AS serve_source_signal,
  (SELECT cs.serve_source FROM public.companion_serves cs WHERE cs.reflection_id = r.id AND cs.companion_type = 'ground_nudge' ORDER BY cs.created_at DESC NULLS LAST LIMIT 1) AS serve_source_ground_nudge,
  (SELECT cs.serve_source FROM public.companion_serves cs WHERE cs.reflection_id = r.id AND cs.companion_type = 'historical_insight' ORDER BY cs.created_at DESC NULLS LAST LIMIT 1) AS serve_source_historical_insight,
  (SELECT cs.serve_source FROM public.companion_serves cs WHERE cs.reflection_id = r.id AND cs.companion_type IN ('zoom_out', 'zoom_out_deep_time') ORDER BY cs.created_at DESC NULLS LAST LIMIT 1) AS serve_source_zoom_out
FROM reflections r
LEFT JOIN reflection_companions sc ON sc.reflection_id = r.id AND sc.companion_type = 'signal'
LEFT JOIN reflection_companions gc ON gc.reflection_id = r.id AND gc.companion_type = 'ground_nudge'
LEFT JOIN reflection_companions hc ON hc.reflection_id = r.id AND hc.companion_type = 'historical_insight'
LEFT JOIN reflection_companions zc ON zc.reflection_id = r.id AND zc.companion_type = 'zoom_out'
LEFT JOIN reflection_companions zdt ON zdt.reflection_id = r.id AND zdt.companion_type = 'zoom_out_deep_time';

CREATE INDEX IF NOT EXISTS idx_reflections_user_engaged_at
  ON public.reflections (user_id, engaged_at DESC)
  WHERE outcome IS NOT NULL AND outcome <> '';