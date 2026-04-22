CREATE OR REPLACE FUNCTION public.notifications_upsert(
  p_user_id uuid,
  p_type text,
  p_source_table text,
  p_source_id uuid,
  p_metadata jsonb DEFAULT '{}'::jsonb,
  p_action_path text DEFAULT NULL::text,
  p_action_state jsonb DEFAULT NULL::jsonb,
  p_created_at timestamp with time zone DEFAULT now()
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
BEGIN
  IF p_user_id IS NULL OR p_source_id IS NULL THEN RETURN; END IF;
  -- Skip orphaned rows whose user no longer exists in auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN RETURN; END IF;
  INSERT INTO public.notifications (user_id, type, source_table, source_id, metadata, action_path, action_state, created_at)
  VALUES (p_user_id, p_type, p_source_table, p_source_id, COALESCE(p_metadata, '{}'::jsonb), p_action_path, p_action_state, COALESCE(p_created_at, now()))
  ON CONFLICT (source_table, source_id) DO UPDATE SET
    type = EXCLUDED.type, metadata = EXCLUDED.metadata,
    action_path = EXCLUDED.action_path, action_state = EXCLUDED.action_state, created_at = EXCLUDED.created_at;
END;
$function$;