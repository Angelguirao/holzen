-- Pause-first MVP: drop legacy settings tables and profile columns that supported
-- removed Settings surfaces (quiet hours, per-user source prefs, changelog UI,
-- email/reflection toggles). Keep public.signal_sources for companion orchestration.

DROP TABLE IF EXISTS public.quiet_windows;
DROP TABLE IF EXISTS public.user_signal_preferences;
DROP TABLE IF EXISTS public.signal_source_suggestions;
DROP TABLE IF EXISTS public.changelog_entries;

ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS quiet_hours_start,
  DROP COLUMN IF EXISTS quiet_hours_end,
  DROP COLUMN IF EXISTS silent_mode,
  DROP COLUMN IF EXISTS reflection_tone,
  DROP COLUMN IF EXISTS reflection_style,
  DROP COLUMN IF EXISTS custom_prompt,
  DROP COLUMN IF EXISTS email_notifications;

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
    IF auth.uid() IS NULL THEN
      RAISE EXCEPTION 'update_profile_safe: not authenticated' USING ERRCODE = '42501';
    END IF;
    IF auth.uid() <> _user_id THEN
      RAISE EXCEPTION 'update_profile_safe: not authorized' USING ERRCODE = '42501';
    END IF;
  END IF;

  safe_updates := _updates
    - 'subscription_status' - 'lifetime_access' - 'subscription_end' - 'subscription_checked_at'
    - 'user_id' - 'id' - 'created_at' - 'is_admin' - 'subscription_tier'
    - 'practice_presence_xp_total' - 'completed_pause_count'
    - 'hold_goal_currency'
    - 'cumulative_threshold'
    - 'cooldown_hours'
    - 'quiet_hours_start' - 'quiet_hours_end' - 'silent_mode'
    - 'reflection_tone' - 'reflection_style' - 'custom_prompt' - 'email_notifications';

  UPDATE public.profiles SET
    threshold = COALESCE((safe_updates->>'threshold')::numeric, threshold),
    threshold_down = COALESCE((safe_updates->>'threshold_down')::numeric, threshold_down),
    has_onboarded = COALESCE((safe_updates->>'has_onboarded')::boolean, has_onboarded),
    companion_haiku = COALESCE((safe_updates->>'companion_haiku')::boolean, companion_haiku),
    companion_grounding = COALESCE((safe_updates->>'companion_grounding')::boolean, companion_grounding),
    companion_signal = COALESCE((safe_updates->>'companion_signal')::boolean, companion_signal),
    companion_zoom_out = COALESCE((safe_updates->>'companion_zoom_out')::boolean, companion_zoom_out),
    companion_history = COALESCE((safe_updates->>'companion_history')::boolean, companion_history),
    first_name = CASE
      WHEN safe_updates ? 'first_name' THEN safe_updates->>'first_name'
      ELSE first_name
    END,
    timezone = CASE
      WHEN safe_updates ? 'timezone' THEN safe_updates->>'timezone'
      ELSE timezone
    END,
    display_currency = CASE
      WHEN safe_updates ? 'display_currency' THEN safe_updates->>'display_currency'
      WHEN safe_updates ? 'hold_goal_currency' THEN safe_updates->>'hold_goal_currency'
      ELSE display_currency
    END,
    tracked_asset_id = CASE
      WHEN safe_updates ? 'tracked_asset_id' THEN
        CASE lower(trim(safe_updates->>'tracked_asset_id'))
          WHEN 'bitcoin' THEN 'bitcoin'
          ELSE tracked_asset_id
        END
      ELSE tracked_asset_id
    END,
    motivations = CASE
      WHEN safe_updates ? 'motivations' THEN ARRAY(SELECT jsonb_array_elements_text(safe_updates->'motivations'))
      ELSE motivations
    END,
    mantra = CASE
      WHEN safe_updates ? 'mantra' THEN safe_updates->>'mantra'
      ELSE mantra
    END,
    pause_thesis = CASE
      WHEN safe_updates ? 'pause_thesis' THEN NULLIF(trim(safe_updates->>'pause_thesis'), '')
      ELSE pause_thesis
    END,
    language = COALESCE(safe_updates->>'language', language),
    grounding_activities = CASE
      WHEN safe_updates ? 'grounding_activities' THEN ARRAY(SELECT jsonb_array_elements_text(safe_updates->'grounding_activities'))
      ELSE grounding_activities
    END,
    last_context = CASE
      WHEN safe_updates ? 'last_context' THEN safe_updates->>'last_context'
      ELSE last_context
    END,
    last_trigger_at = CASE
      WHEN safe_updates ? 'last_trigger_at' THEN (safe_updates->>'last_trigger_at')::timestamptz
      ELSE last_trigger_at
    END,
    snoozed_until = CASE
      WHEN safe_updates ? 'snoozed_until' THEN (safe_updates->>'snoozed_until')::timestamptz
      ELSE snoozed_until
    END,
    updated_at = now()
  WHERE user_id = _user_id;
END;
$function$;
