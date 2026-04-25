-- ============================================================================
-- Pause V2 — notifications trigger on pause_instances lifecycle.
--
-- Fans pause_instance INSERT/UPDATE into the unified `notifications` feed:
--   * INSERT with state='active' -> upsert a 'pause' notification.
--   * UPDATE from active|engaged to terminal -> stamp dismissed_at=now().
--
-- The paired destructive migration (commit 7) drops the legacy
-- notifications_from_reflections / notifications_from_pause_notifications
-- triggers, so there's no flag-check here. Either this trigger runs or
-- the legacy ones do, never both.
-- ============================================================================

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
      jsonb_build_object(
        'pause_instance_id', NEW.id,
        'template_slug', (SELECT slug FROM public.pause_templates WHERE id = NEW.template_id),
        'source', NEW.source,
        'severity', NEW.context_snapshot->>'severity',
        'context', NEW.context_snapshot->>'context_text',
        'window_ends_at', NEW.window_ends_at
      ),
      '/pause',
      jsonb_build_object('pauseInstanceId', NEW.id::text),
      NEW.created_at
    );
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE'
     AND OLD.state IN ('active','engaged')
     AND NEW.state IN ('completed','dismissed','expired') THEN
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

DROP TRIGGER IF EXISTS trg_notifications_pause_instances ON public.pause_instances;
CREATE TRIGGER trg_notifications_pause_instances
  AFTER INSERT OR UPDATE OF state ON public.pause_instances
  FOR EACH ROW
  EXECUTE FUNCTION public.notifications_from_pause_instances();
