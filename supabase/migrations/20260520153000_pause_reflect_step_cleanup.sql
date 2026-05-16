-- Pause V2 reflect-step cleanup: drop profiles.last_message, enrich pause notifications
-- with reflection_text when present, and backfill bell metadata when artifacts land.

-- 1) Pause notification metadata includes reflection preview when artifact already exists (silent stub).
CREATE OR REPLACE FUNCTION public.pause_notification_metadata(p_pause_instance public.pause_instances)
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'pause_instance_id', p_pause_instance.id,
    'template_slug', (SELECT slug FROM public.pause_templates WHERE id = p_pause_instance.template_id),
    'source', p_pause_instance.source,
    'severity', p_pause_instance.context_snapshot->>'severity',
    'context', p_pause_instance.context_snapshot->>'context_text',
    'message', (
      SELECT NULLIF(trim(a.content->>'message'), '')
      FROM public.pause_ai_artifacts a
      WHERE a.pause_instance_id = p_pause_instance.id
        AND a.kind = 'reflection_text'
      ORDER BY a.created_at DESC
      LIMIT 1
    ),
    'window_ends_at', p_pause_instance.window_ends_at,
    'pending_offer', p_pause_instance.state = 'pending'
  );
$$;

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
      public.pause_notification_metadata(NEW),
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
      public.pause_notification_metadata(NEW),
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
      public.pause_notification_metadata(NEW),
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

-- 2) When reflection_text is written at Reflect, enrich the open pause notification row.
CREATE OR REPLACE FUNCTION public.notifications_enrich_pause_from_reflection_artifact()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_msg text;
BEGIN
  IF NEW.kind <> 'reflection_text' THEN
    RETURN NEW;
  END IF;

  v_msg := NULLIF(trim(NEW.content->>'message'), '');
  IF v_msg IS NULL THEN
    RETURN NEW;
  END IF;

  UPDATE public.notifications n
     SET metadata = COALESCE(n.metadata, '{}'::jsonb) || jsonb_build_object('message', v_msg),
         updated_at = now()
   WHERE n.source_table = 'pause_instances'
     AND n.source_id = NEW.pause_instance_id
     AND n.type = 'pause'
     AND n.dismissed_at IS NULL;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notifications_enrich_pause_reflection ON public.pause_ai_artifacts;
CREATE TRIGGER trg_notifications_enrich_pause_reflection
  AFTER INSERT OR UPDATE OF content, kind ON public.pause_ai_artifacts
  FOR EACH ROW
  EXECUTE FUNCTION public.notifications_enrich_pause_from_reflection_artifact();

-- 3) Drop legacy profiles.last_message (delivery uses last_context + pause_instances / artifacts).
ALTER TABLE public.profiles DROP COLUMN IF EXISTS last_message;

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
