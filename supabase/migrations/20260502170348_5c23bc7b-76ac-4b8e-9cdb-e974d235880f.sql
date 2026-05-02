DROP FUNCTION IF EXISTS public.library_archive_list_page(text, boolean, text, text, text[], uuid[], text, boolean, integer, bigint);

CREATE OR REPLACE FUNCTION public.library_archive_list_page(
  p_segment text,
  p_favorites_only boolean DEFAULT false,
  p_search text DEFAULT NULL,
  p_tag text DEFAULT NULL,
  p_source_types text[] DEFAULT NULL,
  p_smart_ids uuid[] DEFAULT NULL,
  p_sort text DEFAULT 'newest',
  p_main_pause_only boolean DEFAULT false,
  p_limit int DEFAULT 50,
  p_offset bigint DEFAULT 0
)
RETURNS SETOF public.library_items
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH src AS (
    SELECT id, user_id, type, title, body, source_type, source_url, tags, pinned, created_at, status, is_favorite, pause_instance_id
    FROM public.library_archive_pauses_tab_items
    WHERE p_segment = 'pauses'
    UNION ALL
    SELECT id, user_id, type, title, body, source_type, source_url, tags, pinned, created_at, status, is_favorite, pause_instance_id
    FROM public.library_archive_echo_items
    WHERE p_segment = 'echo'
    UNION ALL
    SELECT id, user_id, type, title, body, source_type, source_url, tags, pinned, created_at, status, is_favorite, pause_instance_id
    FROM public.library_items
    WHERE p_segment = 'default' AND status NOT IN ('deleted','archived')
  ),
  filt AS (
    SELECT s.* FROM src s
    WHERE s.user_id = auth.uid()
      AND (NOT p_favorites_only OR s.is_favorite = true)
      AND (NOT p_main_pause_only OR p_segment <> 'pauses' OR s.source_type = 'pause')
      AND (p_search IS NULL OR btrim(p_search) = ''
           OR s.title ILIKE '%' || btrim(p_search) || '%'
           OR s.body ILIKE '%' || btrim(p_search) || '%'
           OR EXISTS (SELECT 1 FROM unnest(coalesce(s.tags, '{}'::text[])) AS t(tag) WHERE t.tag ILIKE '%' || btrim(p_search) || '%'))
      AND (p_tag IS NULL OR btrim(p_tag) = '' OR p_tag = ANY (coalesce(s.tags, '{}'::text[])))
      AND (p_source_types IS NULL OR coalesce(cardinality(p_source_types), 0) = 0 OR s.source_type = ANY (p_source_types))
      AND (p_smart_ids IS NULL OR coalesce(cardinality(p_smart_ids), 0) = 0 OR s.id = ANY (p_smart_ids))
  )
  SELECT * FROM filt
  ORDER BY pinned DESC NULLS LAST,
    CASE WHEN p_sort = 'alphabetical' THEN lower(coalesce(title, '')) END ASC NULLS LAST,
    CASE WHEN p_sort = 'oldest' THEN created_at END ASC NULLS LAST,
    CASE WHEN p_sort = 'newest' THEN created_at END DESC NULLS LAST,
    CASE WHEN p_sort = 'alphabetical' THEN created_at END DESC NULLS LAST,
    id DESC
  LIMIT greatest(1, least(p_limit, 100)) OFFSET greatest(0, p_offset);
$$;