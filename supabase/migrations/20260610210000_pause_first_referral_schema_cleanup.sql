-- Pause-first referral program cutover: drop referral tables, profile columns, and worker RPC.
-- Client/edges quarantined in src/legacy/referrals/ and supabase/functions/legacy/referrals/.
-- See docs/ops/active-surface.md § Referrals (legacy).

BEGIN;

-- Unschedule referral cron if wired manually (job name from docs/ops/cron-setup.md).
DO $$
DECLARE
  v_jobid bigint;
BEGIN
  SELECT jobid INTO v_jobid FROM cron.job WHERE jobname = 'process-referral-pending';
  IF v_jobid IS NOT NULL THEN
    PERFORM cron.unschedule(v_jobid);
  END IF;
EXCEPTION WHEN undefined_table OR invalid_schema_name THEN
  NULL;
END$$;

DELETE FROM public.app_config WHERE key = 'heartbeat.process_referral_pending';

DROP FUNCTION IF EXISTS public.claim_referral_pending_jobs(integer);

DROP TRIGGER IF EXISTS update_referral_pending_jobs_updated_at ON public.referral_pending_jobs;
DROP TABLE IF EXISTS public.referral_pending_jobs CASCADE;
DROP TABLE IF EXISTS public.referral_rewards CASCADE;
DROP TABLE IF EXISTS public.referrals CASCADE;

ALTER TABLE public.profiles DROP COLUMN IF EXISTS referral_code;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS referred_by;

CREATE OR REPLACE FUNCTION public.profiles_block_privileged_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_service_role boolean := (auth.role() = 'service_role');
  caller_is_admin boolean := false;
BEGIN
  IF is_service_role THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(p.is_admin, false) INTO caller_is_admin
  FROM public.profiles p
  WHERE p.user_id = auth.uid()
  LIMIT 1;

  IF caller_is_admin THEN
    RETURN NEW;
  END IF;

  IF NEW.is_admin IS DISTINCT FROM OLD.is_admin THEN
    RAISE EXCEPTION 'profiles.is_admin cannot be modified by the user';
  END IF;
  IF NEW.lifetime_access IS DISTINCT FROM OLD.lifetime_access THEN
    RAISE EXCEPTION 'profiles.lifetime_access cannot be modified by the user';
  END IF;
  IF NEW.subscription_status IS DISTINCT FROM OLD.subscription_status THEN
    RAISE EXCEPTION 'profiles.subscription_status cannot be modified by the user';
  END IF;
  IF NEW.subscription_tier IS DISTINCT FROM OLD.subscription_tier THEN
    RAISE EXCEPTION 'profiles.subscription_tier cannot be modified by the user';
  END IF;
  IF NEW.trial_used_at IS DISTINCT FROM OLD.trial_used_at THEN
    RAISE EXCEPTION 'profiles.trial_used_at cannot be modified by the user';
  END IF;

  RETURN NEW;
END;
$$;

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
    - 'cumulative_threshold';

  UPDATE public.profiles SET
    threshold = COALESCE((safe_updates->>'threshold')::numeric, threshold),
    threshold_down = COALESCE((safe_updates->>'threshold_down')::numeric, threshold_down),
    cooldown_hours = COALESCE((safe_updates->>'cooldown_hours')::integer, cooldown_hours),
    email_notifications = COALESCE((safe_updates->>'email_notifications')::boolean, email_notifications),
    has_onboarded = COALESCE((safe_updates->>'has_onboarded')::boolean, has_onboarded),
    companion_haiku = COALESCE((safe_updates->>'companion_haiku')::boolean, companion_haiku),
    companion_grounding = COALESCE((safe_updates->>'companion_grounding')::boolean, companion_grounding),
    companion_signal = COALESCE((safe_updates->>'companion_signal')::boolean, companion_signal),
    companion_zoom_out = COALESCE((safe_updates->>'companion_zoom_out')::boolean, companion_zoom_out),
    companion_history = COALESCE((safe_updates->>'companion_history')::boolean, companion_history),
    silent_mode = COALESCE((safe_updates->>'silent_mode')::boolean, silent_mode),
    quiet_hours_start = CASE
      WHEN safe_updates ? 'quiet_hours_start' THEN (safe_updates->>'quiet_hours_start')::integer
      ELSE quiet_hours_start
    END,
    quiet_hours_end = CASE
      WHEN safe_updates ? 'quiet_hours_end' THEN (safe_updates->>'quiet_hours_end')::integer
      ELSE quiet_hours_end
    END,
    reflection_tone = COALESCE(safe_updates->>'reflection_tone', reflection_tone),
    reflection_style = COALESCE(safe_updates->>'reflection_style', reflection_style),
    custom_prompt = CASE
      WHEN safe_updates ? 'custom_prompt' THEN safe_updates->>'custom_prompt'
      ELSE custom_prompt
    END,
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

COMMIT;
