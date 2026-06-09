-- `library_items` was dropped in 20260509140000; archive is instance-first via views.
-- Later pause promotion helpers still INSERTed bookmarks — fix adopt + promote paths.

CREATE OR REPLACE FUNCTION public.pause_promote_pending_for_user(
  p_user_id uuid,
  p_reason_key text,
  p_now timestamptz DEFAULT now()
)
RETURNS boolean
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pending public.pause_instances%ROWTYPE;
BEGIN
  IF p_user_id IS NULL OR p_reason_key IS NULL OR length(trim(p_reason_key)) = 0 THEN
    RETURN false;
  END IF;

  SELECT * INTO v_pending
    FROM public.pause_instances
   WHERE user_id = p_user_id
     AND state = 'pending'
   ORDER BY created_at DESC
   LIMIT 1
   FOR UPDATE;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  UPDATE public.pause_instances
     SET state = 'active',
         metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(p_reason_key, p_now)
   WHERE id = v_pending.id;

  RETURN true;
END;
$$;

COMMENT ON FUNCTION public.pause_promote_pending_for_user(uuid, text, timestamptz) IS
  'Promote the user''s pending pause row to active. Used after open_max expiry and from pause_dismiss_current.';

REVOKE ALL ON FUNCTION public.pause_promote_pending_for_user(uuid, text, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pause_promote_pending_for_user(uuid, text, timestamptz) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.pause_adopt_pending_offer()
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_now timestamptz := now();
  v_pending public.pause_instances%ROWTYPE;
  v_open public.pause_instances%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'pause_adopt_pending_offer: not authenticated';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(v_uid::text, 0));

  SELECT * INTO v_pending
    FROM public.pause_instances
   WHERE user_id = v_uid AND state = 'pending'
   ORDER BY created_at DESC
   LIMIT 1
   FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'no_pending');
  END IF;

  SELECT * INTO v_open
    FROM public.pause_instances
   WHERE user_id = v_uid AND state IN ('active', 'engaged')
   ORDER BY created_at DESC
   LIMIT 1
   FOR UPDATE;

  IF FOUND THEN
    UPDATE public.pause_instances
       SET state = 'expired',
           expired_reason = 'superseded',
           terminal_at = v_now,
           superseded_by = v_pending.id
     WHERE id = v_open.id;
  END IF;

  UPDATE public.pause_instances
     SET state = 'active',
         metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('pending_adopted_at', v_now)
   WHERE id = v_pending.id;

  RETURN jsonb_build_object('ok', true, 'instance_id', v_pending.id);
END;
$$;

REVOKE ALL ON FUNCTION public.pause_adopt_pending_offer() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pause_adopt_pending_offer() TO authenticated;
