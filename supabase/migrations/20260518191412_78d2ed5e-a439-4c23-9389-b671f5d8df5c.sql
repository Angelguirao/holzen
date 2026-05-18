DROP TRIGGER IF EXISTS trg_notifications_user_badges ON public.user_badges;
DROP TRIGGER IF EXISTS trg_notifications_night_reflections ON public.night_reflections;
DROP TRIGGER IF EXISTS trg_notifications_future_letters ON public.future_letters;
DROP TRIGGER IF EXISTS trg_notifications_reflection_insights ON public.reflection_insights;

DROP FUNCTION IF EXISTS public.notifications_from_user_badges();
DROP FUNCTION IF EXISTS public.notifications_from_night_reflections();
DROP FUNCTION IF EXISTS public.notifications_from_future_letters();
DROP FUNCTION IF EXISTS public.notifications_from_reflection_insights();

DELETE FROM public.notifications WHERE type IN ('badge','insight','letter','night_reflection');

DROP TABLE IF EXISTS public.user_badges CASCADE;
DROP TABLE IF EXISTS public.badge_definitions CASCADE;
DROP TABLE IF EXISTS public.practice_entries CASCADE;
DROP TABLE IF EXISTS public.reflection_insights CASCADE;
DROP TABLE IF EXISTS public.future_letters CASCADE;
DROP TABLE IF EXISTS public.night_reflections CASCADE;
DROP TABLE IF EXISTS public.graph_edges CASCADE;
DROP TABLE IF EXISTS public.ritual_completions CASCADE;
DROP TABLE IF EXISTS public.ritual_templates CASCADE;
ALTER TABLE IF EXISTS public.content_library RENAME TO companion_catalog;
COMMENT ON TABLE public.companion_catalog IS
  'Curated essays, papers, and events for companion catalog phase (renamed from content_library at pause-first launch).';

TRUNCATE public.analytics_events RESTART IDENTITY;
TRUNCATE public.generation_attempts RESTART IDENTITY;
TRUNCATE public.companion_serves RESTART IDENTITY;
TRUNCATE public.user_companion_serves RESTART IDENTITY;

ALTER TABLE public.profiles DROP COLUMN IF EXISTS ai_insights_enabled;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS night_reflection_hour;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS digest_frequency;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS ritual_template;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS notify_badges;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS streak_freeze_dates;

CREATE OR REPLACE FUNCTION public.update_profile_safe(_user_id uuid, _updates jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  safe_updates jsonb;
BEGIN
  IF auth.role() <> 'service_role' THEN
    IF auth.uid() IS NULL THEN RAISE EXCEPTION 'update_profile_safe: not authenticated' USING ERRCODE = '42501'; END IF;
    IF auth.uid() <> _user_id THEN RAISE EXCEPTION 'update_profile_safe: not authorized' USING ERRCODE = '42501'; END IF;
  END IF;
  safe_updates := _updates - 'subscription_status' - 'lifetime_access' - 'subscription_end' - 'subscription_checked_at' - 'user_id' - 'id' - 'created_at' - 'is_admin' - 'subscription_tier';
  UPDATE public.profiles
  SET
    threshold = COALESCE((safe_updates->>'threshold')::numeric, threshold),
    threshold_down = COALESCE((safe_updates->>'threshold_down')::numeric, threshold_down),
    cumulative_threshold = COALESCE((safe_updates->>'cumulative_threshold')::numeric, cumulative_threshold),
    cooldown_hours = COALESCE((safe_updates->>'cooldown_hours')::integer, cooldown_hours),
    email_notifications = COALESCE((safe_updates->>'email_notifications')::boolean, email_notifications),
    has_onboarded = COALESCE((safe_updates->>'has_onboarded')::boolean, has_onboarded),
    companion_breathing = COALESCE((safe_updates->>'companion_breathing')::boolean, companion_breathing),
    companion_haiku = COALESCE((safe_updates->>'companion_haiku')::boolean, companion_haiku),
    companion_grounding = COALESCE((safe_updates->>'companion_grounding')::boolean, (safe_updates->>'companion_learning')::boolean, companion_grounding),
    companion_signal = COALESCE((safe_updates->>'companion_signal')::boolean, companion_signal),
    companion_zoom_out = COALESCE((safe_updates->>'companion_zoom_out')::boolean, companion_zoom_out),
    companion_history = COALESCE((safe_updates->>'companion_history')::boolean, companion_history),
    silent_mode = COALESCE((safe_updates->>'silent_mode')::boolean, silent_mode),
    quiet_hours_start = CASE WHEN safe_updates ? 'quiet_hours_start' THEN (safe_updates->>'quiet_hours_start')::integer ELSE quiet_hours_start END,
    quiet_hours_end = CASE WHEN safe_updates ? 'quiet_hours_end' THEN (safe_updates->>'quiet_hours_end')::integer ELSE quiet_hours_end END,
    reflection_tone = COALESCE(safe_updates->>'reflection_tone', reflection_tone),
    reflection_style = COALESCE(safe_updates->>'reflection_style', reflection_style),
    custom_prompt = CASE WHEN safe_updates ? 'custom_prompt' THEN safe_updates->>'custom_prompt' ELSE custom_prompt END,
    first_name = CASE WHEN safe_updates ? 'first_name' THEN safe_updates->>'first_name' ELSE first_name END,
    timezone = CASE WHEN safe_updates ? 'timezone' THEN safe_updates->>'timezone' ELSE timezone END,
    hold_goal_type = CASE WHEN safe_updates ? 'hold_goal_type' THEN safe_updates->>'hold_goal_type' ELSE hold_goal_type END,
    hold_goal_currency = CASE WHEN safe_updates ? 'hold_goal_currency' THEN safe_updates->>'hold_goal_currency' ELSE hold_goal_currency END,
    hold_goal_start = CASE WHEN safe_updates ? 'hold_goal_start' THEN (safe_updates->>'hold_goal_start')::timestamptz ELSE hold_goal_start END,
    hold_goal_target_months = CASE WHEN safe_updates ? 'hold_goal_target_months' THEN (safe_updates->>'hold_goal_target_months')::integer ELSE hold_goal_target_months END,
    hold_goal_target_price = CASE WHEN safe_updates ? 'hold_goal_target_price' THEN (safe_updates->>'hold_goal_target_price')::numeric ELSE hold_goal_target_price END,
    tracked_asset_id = CASE WHEN safe_updates ? 'tracked_asset_id' THEN
        CASE lower(trim(safe_updates->>'tracked_asset_id'))
          WHEN 'bitcoin' THEN 'bitcoin' WHEN 'ethereum' THEN 'ethereum'
          WHEN 'solana' THEN 'solana' WHEN 'monero' THEN 'monero'
          ELSE tracked_asset_id END
      ELSE tracked_asset_id END,
    motivations = CASE WHEN safe_updates ? 'motivations' THEN ARRAY(SELECT jsonb_array_elements_text(safe_updates->'motivations')) ELSE motivations END,
    mantra = CASE WHEN safe_updates ? 'mantra' THEN safe_updates->>'mantra' ELSE mantra END,
    language = COALESCE(safe_updates->>'language', language),
    grounding_activities = CASE WHEN safe_updates ? 'grounding_activities' THEN ARRAY(SELECT jsonb_array_elements_text(safe_updates->'grounding_activities')) ELSE grounding_activities END,
    last_context = CASE WHEN safe_updates ? 'last_context' THEN safe_updates->>'last_context' ELSE last_context END,
    last_trigger_at = CASE WHEN safe_updates ? 'last_trigger_at' THEN (safe_updates->>'last_trigger_at')::timestamptz ELSE last_trigger_at END,
    referral_code = COALESCE(safe_updates->>'referral_code', referral_code),
    referred_by = CASE WHEN safe_updates ? 'referred_by' THEN safe_updates->>'referred_by' ELSE referred_by END,
    snoozed_until = CASE WHEN safe_updates ? 'snoozed_until' THEN (safe_updates->>'snoozed_until')::timestamptz ELSE snoozed_until END,
    updated_at = now()
  WHERE user_id = _user_id;
END;
$function$;

DROP VIEW IF EXISTS public.v_pause_full CASCADE;
CREATE OR REPLACE VIEW public.v_pause_full WITH (security_invoker = true) AS
SELECT
  pi.*,
  (EXISTS (SELECT 1 FROM public.pause_step_events e WHERE e.pause_instance_id = pi.id AND e.step_type = 'breath_completed')) AS has_breath_completed,
  (EXISTS (SELECT 1 FROM public.pause_step_events e WHERE e.pause_instance_id = pi.id AND e.step_type = 'initial_emotion_logged')) AS has_initial_emotion_logged,
  (EXISTS (SELECT 1 FROM public.pause_step_events e WHERE e.pause_instance_id = pi.id AND e.step_type = 'shift_emotion_logged')) AS has_shift_emotion_logged,
  (EXISTS (SELECT 1 FROM public.pause_step_events e WHERE e.pause_instance_id = pi.id AND e.step_type = 'post_pause_emotion_logged')) AS has_post_pause_emotion_logged,
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
  (SELECT NULLIF(trim(both from (e.payload->>'intensity')), '')::smallint FROM public.pause_step_events e WHERE e.pause_instance_id = pi.id AND e.step_type = 'initial_emotion_logged' ORDER BY e.created_at DESC LIMIT 1) AS initial_emotion_intensity,
  (SELECT NULLIF(trim(both from (e.payload->>'shift_intensity')), '')::smallint FROM public.pause_step_events e WHERE e.pause_instance_id = pi.id AND e.step_type = 'shift_emotion_logged' ORDER BY e.created_at DESC LIMIT 1) AS shift_emotion_intensity,
  (SELECT payload->>'mood' FROM public.pause_step_events e WHERE e.pause_instance_id = pi.id AND e.step_type = 'post_pause_emotion_logged' ORDER BY e.created_at DESC LIMIT 1) AS post_pause_mood,
  (SELECT NULLIF(trim(both from (e.payload->>'intensity')), '')::smallint FROM public.pause_step_events e WHERE e.pause_instance_id = pi.id AND e.step_type = 'post_pause_emotion_logged' ORDER BY e.created_at DESC LIMIT 1) AS post_pause_emotion_intensity,
  public.pause_instance_is_brief_ritual(pi.id) AS is_brief_ritual
FROM public.pause_instances pi;

CREATE OR REPLACE VIEW public.v_pause_archive_pauses WITH (security_invoker = true) AS
SELECT vf.* FROM public.v_pause_full vf
WHERE vf.state NOT IN ('active','engaged','pending')
  AND NOT ((vf.state='expired' AND vf.engaged_at IS NULL AND vf.expired_reason IS DISTINCT FROM 'superseded'::public.pause_expired_reason)
    OR (vf.state='dismissed' AND vf.engaged_at IS NULL));

CREATE OR REPLACE VIEW public.v_pause_archive_echoes WITH (security_invoker = true) AS
SELECT vf.* FROM public.v_pause_full vf
WHERE vf.state NOT IN ('active','engaged','pending') AND vf.engaged_at IS NULL
  AND (vf.state='dismissed' OR (vf.state='expired' AND vf.expired_reason IS DISTINCT FROM 'superseded'::public.pause_expired_reason));

GRANT SELECT ON public.v_pause_archive_pauses TO authenticated, service_role;
GRANT SELECT ON public.v_pause_archive_echoes TO authenticated, service_role;

DO $$
DECLARE
  v_names text[] := ARRAY['badge-notify','check-followups-hourly','daily-digest-10am','deliver-letters-check','fetch-source-feeds','ground-nudge','monthly-report-1st','night-reflection','personalized-nudge-12h'];
  v_name text;
  v_jobid bigint;
BEGIN
  FOREACH v_name IN ARRAY v_names LOOP
    SELECT jobid INTO v_jobid FROM cron.job WHERE jobname = v_name;
    IF v_jobid IS NOT NULL THEN PERFORM cron.unschedule(v_jobid); END IF;
  END LOOP;
EXCEPTION WHEN undefined_table OR invalid_schema_name THEN NULL;
END$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='email_queue') THEN
    EXECUTE $q$
      UPDATE public.email_queue SET status='cancelled', updated_at=now()
       WHERE status IN ('pending','processing')
         AND template_slug IN ('weekly_digest','monthly_report','night_reflection','badge_unlocked','letter_delivered','reflection_insight')
    $q$;
  END IF;
END$$;

ALTER TABLE public.roadmap_items ADD COLUMN IF NOT EXISTS slug text;
DROP INDEX IF EXISTS public.roadmap_items_slug_key;
ALTER TABLE public.roadmap_items DROP CONSTRAINT IF EXISTS roadmap_items_slug_key;
DELETE FROM public.roadmap_items a USING public.roadmap_items b
  WHERE a.ctid < b.ctid AND a.slug IS NOT NULL AND a.slug = b.slug;
ALTER TABLE public.roadmap_items ADD CONSTRAINT roadmap_items_slug_key UNIQUE (slug);

INSERT INTO public.roadmap_items (slug, title, description, status, category, vote_count)
VALUES
  ('skills-holzen-score','Skills & Holzen Score','Deep stats on regulation, tolerance, alignment, and awareness — beyond Journey overview.','planned','intelligence',0),
  ('badges-milestones','Badges & milestones','Achievement families and celebrations tied to your pause practice.','planned','self',0),
  ('tools-ground-ritual','Tools & ground rituals','Standalone breathing, grounding, and ritual templates outside a pause.','planned','self',0),
  ('content-library-ingest','Curated library ingest','RSS and admin-reviewed essays for companion Signal/Grounding pools.','planned','intelligence',0),
  ('night-reflection','Night reflection','Scheduled evening check-ins with AI summaries.','planned','self',0),
  ('weekly-digest-email','Weekly digest email','Email summaries of your pause patterns and companions.','planned','together',0),
  ('letter-to-future-self','Letter to future self','Write during fear or calm; delivered in the opposite market state.','planned','self',0),
  ('practice-journal','Practice journal','Body scan, guided journal, and emotional check-ins between pauses.','planned','self',0),
  ('referral-rewards','Referral rewards','Invite friends and earn rewards as they build their practice.','planned','reach',0)
ON CONFLICT (slug) DO UPDATE SET title=EXCLUDED.title, description=EXCLUDED.description, status=EXCLUDED.status, category=EXCLUDED.category;