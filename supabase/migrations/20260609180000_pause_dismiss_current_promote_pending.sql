-- C′ Home discard (Figma 578:29994): when a pending offer exists, dismiss the open
-- pause and promote pending → active instead of cancelling the queued row.

CREATE OR REPLACE FUNCTION public.pause_dismiss_current()
RETURNS public.pause_state
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_open_id uuid;
  v_pending public.pause_instances%ROWTYPE;
  v_now timestamptz := now();
  v_out public.pause_state;
  v_msg text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'pause_dismiss_current: not authenticated';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(v_uid::text, 0));

  SELECT id INTO v_open_id
    FROM public.pause_instances
   WHERE user_id = v_uid
     AND state IN ('active', 'engaged')
   ORDER BY created_at DESC
   LIMIT 1
   FOR UPDATE;

  IF v_open_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_pending
    FROM public.pause_instances
   WHERE user_id = v_uid
     AND state = 'pending'
   ORDER BY created_at DESC
   LIMIT 1
   FOR UPDATE;

  IF FOUND THEN
    v_out := public.pause_dismiss(v_open_id, 'user_dismissed_current');

    UPDATE public.pause_instances
       SET state = 'active',
           metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
             'pending_promoted_on_dismiss_current', v_now
           )
     WHERE id = v_pending.id;

    SELECT content->>'message'
      INTO v_msg
      FROM public.pause_ai_artifacts
     WHERE pause_instance_id = v_pending.id
       AND kind = 'reflection_text'
     LIMIT 1;

    INSERT INTO public.library_items (
      user_id, type, title, body, source_type, pause_instance_id, tags, pinned, is_favorite
    )
    SELECT
      v_pending.user_id,
      'bookmark',
      'Pause',
      COALESCE(v_msg, ''),
      'pause',
      v_pending.id,
      ARRAY[]::text[],
      false,
      false
    WHERE NOT EXISTS (
      SELECT 1
        FROM public.library_items li
       WHERE li.user_id = v_pending.user_id
         AND li.pause_instance_id = v_pending.id
         AND li.source_type = 'pause'
         AND li.status IS DISTINCT FROM 'deleted'
         AND li.status IS DISTINCT FROM 'archived'
    );

    RETURN v_out;
  END IF;

  UPDATE public.pause_instances
     SET state = 'expired',
         expired_reason = 'system_cancelled',
         terminal_at = v_now,
         metadata = metadata || jsonb_build_object('cleared_with_dismiss_current', true)
   WHERE user_id = v_uid
     AND state = 'pending';

  v_out := public.pause_dismiss(v_open_id, 'user_dismissed_current');
  RETURN v_out;
END;
$$;
