-- Letters IA: canonical client URL is /tools/letters (not /journey/letters).
SET search_path = public;

CREATE OR REPLACE FUNCTION public.notifications_from_future_letters() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.delivered IS DISTINCT FROM TRUE OR NEW.delivered_at IS NULL THEN RETURN NEW; END IF;
  PERFORM public.notifications_upsert(NEW.user_id, 'letter', 'future_letters', NEW.id,
    '{}'::jsonb, format('/tools/letters?letter=%s', NEW.id::text), NULL, NEW.delivered_at);
  RETURN NEW;
END; $$;

UPDATE public.notifications
SET
  action_path = format('/tools/letters?letter=%s', source_id::text),
  action_state = NULL
WHERE type = 'letter' AND source_table = 'future_letters' AND action_path LIKE '/journey/letters%';
