
-- 1) Fix the SECURITY DEFINER view (the only ERROR-level finding).
ALTER VIEW public.v_companion_cache_hit_rate SET (security_invoker = true);

-- 2) Harden update_profile_safe: it was SECURITY DEFINER + callable by any
--    role + accepted an arbitrary _user_id, so any signed-in user could
--    pass another user's id and update their profile. Add a caller check.
CREATE OR REPLACE FUNCTION public.update_profile_safe(_user_id uuid, _updates jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  safe_updates jsonb;
BEGIN
  -- Only the owner (or service role) may update a profile via this RPC.
  IF auth.role() <> 'service_role' THEN
    IF auth.uid() IS NULL THEN
      RAISE EXCEPTION 'update_profile_safe: not authenticated' USING ERRCODE = '42501';
    END IF;
    IF auth.uid() <> _user_id THEN
      RAISE EXCEPTION 'update_profile_safe: not authorized' USING ERRCODE = '42501';
    END IF;
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
    companion_grounding = COALESCE(
      (safe_updates->>'companion_grounding')::boolean,
      (safe_updates->>'companion_learning')::boolean,
      companion_grounding
    ),
    companion_signal = COALESCE((safe_updates->>'companion_signal')::boolean, companion_signal),
    companion_zoom_out = COALESCE((safe_updates->>'companion_zoom_out')::boolean, companion_zoom_out),
    companion_history = COALESCE((safe_updates->>'companion_history')::boolean, companion_history),
    silent_mode = COALESCE((safe_updates->>'silent_mode')::boolean, silent_mode),
    quiet_hours_start = CASE WHEN safe_updates ? 'quiet_hours_start' THEN (safe_updates->>'quiet_hours_start')::integer ELSE quiet_hours_start END,
    quiet_hours_end = CASE WHEN safe_updates ? 'quiet_hours_end' THEN (safe_updates->>'quiet_hours_end')::integer ELSE quiet_hours_end END,
    night_reflection_hour = CASE WHEN safe_updates ? 'night_reflection_hour' THEN (safe_updates->>'night_reflection_hour')::integer ELSE night_reflection_hour END,
    ai_insights_enabled = COALESCE((safe_updates->>'ai_insights_enabled')::boolean, ai_insights_enabled),
    reflection_tone = COALESCE(safe_updates->>'reflection_tone', reflection_tone),
    reflection_style = COALESCE(safe_updates->>'reflection_style', reflection_style),
    custom_prompt = CASE WHEN safe_updates ? 'custom_prompt' THEN safe_updates->>'custom_prompt' ELSE custom_prompt END,
    first_name = CASE WHEN safe_updates ? 'first_name' THEN safe_updates->>'first_name' ELSE first_name END,
    timezone = CASE WHEN safe_updates ? 'timezone' THEN safe_updates->>'timezone' ELSE timezone END,
    ritual_template = COALESCE(safe_updates->>'ritual_template', ritual_template),
    hold_goal_type = CASE WHEN safe_updates ? 'hold_goal_type' THEN safe_updates->>'hold_goal_type' ELSE hold_goal_type END,
    hold_goal_currency = CASE WHEN safe_updates ? 'hold_goal_currency' THEN safe_updates->>'hold_goal_currency' ELSE hold_goal_currency END,
    hold_goal_start = CASE WHEN safe_updates ? 'hold_goal_start' THEN (safe_updates->>'hold_goal_start')::timestamptz ELSE hold_goal_start END,
    hold_goal_target_months = CASE WHEN safe_updates ? 'hold_goal_target_months' THEN (safe_updates->>'hold_goal_target_months')::integer ELSE hold_goal_target_months END,
    hold_goal_target_price = CASE WHEN safe_updates ? 'hold_goal_target_price' THEN (safe_updates->>'hold_goal_target_price')::numeric ELSE hold_goal_target_price END,
    tracked_asset_id = CASE
      WHEN safe_updates ? 'tracked_asset_id' THEN
        CASE lower(trim(safe_updates->>'tracked_asset_id'))
          WHEN 'bitcoin' THEN 'bitcoin'
          WHEN 'ethereum' THEN 'ethereum'
          WHEN 'solana' THEN 'solana'
          WHEN 'monero' THEN 'monero'
          ELSE tracked_asset_id
        END
      ELSE tracked_asset_id
    END,
    motivations = CASE WHEN safe_updates ? 'motivations' THEN ARRAY(SELECT jsonb_array_elements_text(safe_updates->'motivations')) ELSE motivations END,
    mantra = CASE WHEN safe_updates ? 'mantra' THEN safe_updates->>'mantra' ELSE mantra END,
    language = COALESCE(safe_updates->>'language', language),
    grounding_activities = CASE WHEN safe_updates ? 'grounding_activities' THEN ARRAY(SELECT jsonb_array_elements_text(safe_updates->'grounding_activities')) ELSE grounding_activities END,
    digest_frequency = COALESCE(safe_updates->>'digest_frequency', digest_frequency),
    notify_badges = COALESCE((safe_updates->>'notify_badges')::boolean, notify_badges),
    last_message = CASE WHEN safe_updates ? 'last_message' THEN safe_updates->>'last_message' ELSE last_message END,
    last_context = CASE WHEN safe_updates ? 'last_context' THEN safe_updates->>'last_context' ELSE last_context END,
    last_trigger_at = CASE WHEN safe_updates ? 'last_trigger_at' THEN (safe_updates->>'last_trigger_at')::timestamptz ELSE last_trigger_at END,
    streak_freeze_dates = CASE WHEN safe_updates ? 'streak_freeze_dates' THEN ARRAY(SELECT jsonb_array_elements_text(safe_updates->'streak_freeze_dates')) ELSE streak_freeze_dates END,
    referral_code = COALESCE(safe_updates->>'referral_code', referral_code),
    referred_by = CASE WHEN safe_updates ? 'referred_by' THEN safe_updates->>'referred_by' ELSE referred_by END,
    snoozed_until = CASE WHEN safe_updates ? 'snoozed_until' THEN (safe_updates->>'snoozed_until')::timestamptz ELSE snoozed_until END,
    updated_at = now()
  WHERE user_id = _user_id;
END;
$function$;

-- 3) Revoke anon EXECUTE on functions that were never meant to be callable
--    by unauthenticated users. Each of these still self-validates inside,
--    but defense-in-depth + clears the linter "Public Can Execute SECURITY
--    DEFINER Function" warnings.
--
-- Intentionally KEEP anon access on:
--   get_holzen_number   (public homepage stat)
--   get_signup_gate     (called pre-signup)
--   is_admin            (called by RLS evaluation; leave alone)
--   owns_collection     (called by RLS evaluation; leave alone)
--   handle_new_user     (auth trigger; leave alone)

-- User-context RPCs
REVOKE EXECUTE ON FUNCTION public.update_profile_safe(uuid, jsonb) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.pause_adopt_pending_offer() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.pause_create_or_reuse(text, text, jsonb, jsonb, text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.pause_decline_pending_offer() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.pause_dismiss(uuid, text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.pause_dismiss_current() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.pause_log_companion(uuid, text, pause_companion_action, text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.pause_log_step(uuid, pause_step_type, jsonb) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.pause_evaluate_transitions(uuid) FROM anon, PUBLIC;

-- Service-role-only wrappers (already self-check, but block at the door)
REVOKE EXECUTE ON FUNCTION public.claim_trigger_slot(uuid, integer) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.claim_referral_pending_jobs(integer) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.pause_create_or_reuse_as(uuid, text, text, jsonb, jsonb, text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.pause_expire(uuid, pause_expired_reason) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.pause_sweep_window_elapsed() FROM anon, PUBLIC;

-- Admin-only reports
REVOKE EXECUTE ON FUNCTION public.get_admin_stats() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_applied_migrations(integer) FROM anon, PUBLIC;

-- Email queue wrappers (used by edge functions w/ service role)
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM anon, PUBLIC;

-- Trigger functions (fired by Postgres directly; do not need PUBLIC EXECUTE)
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure::text AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'profiles_block_privileged_updates',
        'protect_subscription_fields',
        'update_roadmap_vote_count',
        'trg_pause_step_events_after_insert',
        'trg_pause_companion_events_after_insert',
        'notifications_from_pause_instances',
        'app_config_touch_updated_at',
        'update_updated_at_column',
        'emit_heartbeat',
        'emit_job_heartbeat'
      )
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon, PUBLIC', r.sig);
  END LOOP;
END $$;
