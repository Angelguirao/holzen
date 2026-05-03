-- Apply pending: app_config_pregenerate_cache_topup + journey_routes_notification_paths + letters_tools_action_path + practice_entries_pause_instance_id + library_items_source_type_pause + archive views

-- 1. pregenerate_cache_topup config
INSERT INTO public.app_config (key, value, description) VALUES
  (
    'pregenerate_cache_topup',
    jsonb_build_object(
      'ground_nudge', jsonb_build_object('minHealthyRows', 18, 'maxGeneratePerRun', 2),
      'signal', jsonb_build_object('minHealthyRows', 12, 'maxGeneratePerRun', 1),
      'historical_insight', jsonb_build_object('minHealthyRows', 12, 'maxGeneratePerRun', 1),
      'zoom_out_deep_time', jsonb_build_object('minHealthyRows', 10, 'maxGeneratePerRun', 1)
    ),
    'Pregenerate companions: min count of healthy (quality>=2, non-expired) en rows per type before skipping; max new rows per cron per type.'
  )
ON CONFLICT (key) DO NOTHING;

-- 2. Journey routes notification paths (idempotent — already partially in DB)
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

UPDATE public.notifications SET action_path = '/journey/badges', action_state = NULL
WHERE type = 'badge' AND action_path = '/profile';
UPDATE public.notifications SET action_path = '/journey/insights', action_state = NULL
WHERE type = 'insight' AND action_path = '/profile';
UPDATE public.notifications SET action_path = format('/tools/letters?letter=%s', source_id::text), action_state = NULL
WHERE type = 'letter' AND action_path = '/profile' AND source_table = 'future_letters';
UPDATE public.notifications SET action_path = format('/tools/letters?letter=%s', source_id::text), action_state = NULL
WHERE type = 'letter' AND source_table = 'future_letters' AND action_path LIKE '/journey/letters%';

-- 3. practice_entries.pause_instance_id (idempotent)
ALTER TABLE public.practice_entries
  ADD COLUMN IF NOT EXISTS pause_instance_id uuid REFERENCES public.pause_instances (id) ON DELETE CASCADE;

COMMENT ON COLUMN public.practice_entries.pause_instance_id IS
  'Optional link to a pause instance (required for type=replay thread; null for standalone check-in/journal/bodyscan).';

CREATE INDEX IF NOT EXISTS idx_practice_entries_user_pause_replay
  ON public.practice_entries (user_id, pause_instance_id)
  WHERE type = 'replay' AND pause_instance_id IS NOT NULL;

DROP POLICY IF EXISTS "Users can insert own practice entries" ON public.practice_entries;
CREATE POLICY "Users can insert own practice entries"
  ON public.practice_entries FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (
      pause_instance_id IS NULL
      OR EXISTS (SELECT 1 FROM public.pause_instances pi WHERE pi.id = pause_instance_id AND pi.user_id = auth.uid())
    )
  );

-- 4. library_items.source_type rename
UPDATE public.library_items SET source_type = 'pause' WHERE source_type = 'reflection';
UPDATE public.library_items SET source_type = 'pause_note' WHERE source_type = 'reflection_note';

-- 5. Archive views
CREATE OR REPLACE VIEW public.library_archive_echo_items AS
SELECT li.*
FROM public.library_items li
INNER JOIN public.pause_instances pi ON pi.id = li.pause_instance_id
WHERE li.pause_instance_id IS NOT NULL
  AND li.source_type = 'pause'
  AND pi.state IN ('expired', 'dismissed')
  AND pi.engaged_at IS NULL
  AND li.status NOT IN ('deleted', 'archived');

COMMENT ON VIEW public.library_archive_echo_items IS
  'Echo archive: main pause rows where pause_instances ended expired/dismissed without Reflect (engaged_at IS NULL). Echo membership is keyed on pause_instances (same as client isArchiveEchoPause); hydrate still reads v_pause_full for card fields.';

ALTER VIEW public.library_archive_echo_items SET (security_invoker = true);
GRANT SELECT ON public.library_archive_echo_items TO authenticated;
GRANT SELECT ON public.library_archive_echo_items TO service_role;

CREATE OR REPLACE VIEW public.library_archive_pauses_tab_items AS
SELECT li.*
FROM public.library_items li
LEFT JOIN public.pause_instances pi ON pi.id = li.pause_instance_id
WHERE li.status NOT IN ('deleted', 'archived')
  AND (
    li.pause_instance_id IS NULL
    OR pi.id IS NULL
    OR NOT (pi.state IN ('expired', 'dismissed') AND pi.engaged_at IS NULL)
  );

COMMENT ON VIEW public.library_archive_pauses_tab_items IS
  'Archive Pauses tab: library_items excluding rows for echo-only pause_instances (terminal without Reflect). Keep in sync with src/lib/archive-segment.ts itemBelongsToPausesTab.';

ALTER VIEW public.library_archive_pauses_tab_items SET (security_invoker = true);
GRANT SELECT ON public.library_archive_pauses_tab_items TO authenticated;
GRANT SELECT ON public.library_archive_pauses_tab_items TO service_role;