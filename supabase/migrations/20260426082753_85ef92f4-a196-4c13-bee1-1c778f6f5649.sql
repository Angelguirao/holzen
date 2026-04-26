-- Admin-only RPC to expose migration tracking from supabase_migrations.schema_migrations.
-- Read-only; restricted by is_admin() check.
CREATE OR REPLACE FUNCTION public.get_applied_migrations(p_limit integer DEFAULT 20)
RETURNS TABLE(version text, name text, statements_count integer)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, supabase_migrations
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT m.version::text,
         COALESCE(m.name, '')::text AS name,
         COALESCE(array_length(m.statements, 1), 0)::integer AS statements_count
  FROM supabase_migrations.schema_migrations m
  ORDER BY m.version DESC
  LIMIT GREATEST(COALESCE(p_limit, 20), 1);
END;
$$;

REVOKE ALL ON FUNCTION public.get_applied_migrations(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_applied_migrations(integer) TO authenticated;