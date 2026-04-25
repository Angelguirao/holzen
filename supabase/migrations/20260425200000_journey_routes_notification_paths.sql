-- IA refresh: in-app "Profile" → bookmarkable /journey/* URLs.
-- Update notification action_path (and state for letters) for new client + deep links.
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
    '{}'::jsonb, format('/journey/letters?letter=%s', NEW.id::text), NULL, NEW.delivered_at);
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.notifications_from_reflection_insights() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  PERFORM public.notifications_upsert(NEW.user_id, 'insight', 'reflection_insights', NEW.id,
    jsonb_build_object('reflection_count', NEW.reflection_count), '/journey/insights', NULL, NEW.generated_at);
  RETURN NEW;
END; $$;

-- Recent rows: align paths with new app routes (idempotent for already-migrated values).
UPDATE public.notifications
SET
  action_path = '/journey/badges',
  action_state = NULL
WHERE type = 'badge' AND action_path = '/profile';

UPDATE public.notifications
SET
  action_path = '/journey/insights',
  action_state = NULL
WHERE type = 'insight' AND action_path = '/profile';

UPDATE public.notifications
SET
  action_path = format('/journey/letters?letter=%s', source_id::text),
  action_state = NULL
WHERE type = 'letter' AND action_path = '/profile' AND source_table = 'future_letters';
