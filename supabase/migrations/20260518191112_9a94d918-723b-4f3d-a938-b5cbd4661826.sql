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

ALTER TABLE public.profiles DROP COLUMN IF EXISTS last_message;