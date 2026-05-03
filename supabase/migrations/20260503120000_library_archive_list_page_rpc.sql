-- Server-side filtered + sorted + paginated archive lists (Pauses / Echo segments).
-- Replaces client-side filtering over offset pages. SECURITY INVOKER + auth.uid().
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
  WITH filt AS (
    SELECT li.*
    FROM public.library_items li
    LEFT JOIN public.pause_instances pi ON pi.id = li.pause_instance_id
    WHERE li.user_id = auth.uid()
      AND p_segment IN ('default', 'echo', 'pauses')
      AND li.status NOT IN ('deleted', 'archived')
      AND (NOT p_favorites_only OR li.is_favorite = true)
      AND (
        NOT p_main_pause_only
        OR p_segment <> 'pauses'
        OR li.source_type = 'pause'
      )
      AND (
        p_segment = 'default'
        OR (
          p_segment = 'echo'
          AND li.pause_instance_id IS NOT NULL
          AND li.source_type = 'pause'
          AND pi.state IN ('expired', 'dismissed')
          AND pi.engaged_at IS NULL
        )
        OR (
          p_segment = 'pauses'
          AND (
            li.pause_instance_id IS NULL
            OR pi.id IS NULL
            OR NOT (pi.state IN ('expired', 'dismissed') AND pi.engaged_at IS NULL)
          )
        )
      )
      AND (
        p_search IS NULL
        OR btrim(p_search) = ''
        OR li.title ILIKE '%' || btrim(p_search) || '%'
        OR li.body ILIKE '%' || btrim(p_search) || '%'
        OR EXISTS (
          SELECT 1
          FROM unnest(coalesce(li.tags, '{}'::text[])) AS t(tag)
          WHERE t.tag ILIKE '%' || btrim(p_search) || '%'
        )
      )
      AND (p_tag IS NULL OR btrim(p_tag) = '' OR p_tag = ANY (coalesce(li.tags, '{}'::text[])))
      AND (
        p_source_types IS NULL
        OR coalesce(cardinality(p_source_types), 0) = 0
        OR li.source_type = ANY (p_source_types)
      )
      AND (
        p_smart_ids IS NULL
        OR coalesce(cardinality(p_smart_ids), 0) = 0
        OR li.id = ANY (p_smart_ids)
      )
  )
  SELECT *
  FROM filt
  ORDER BY
    pinned DESC NULLS LAST,
    CASE WHEN p_sort = 'alphabetical' THEN lower(coalesce(title, '')) END ASC NULLS LAST,
    CASE WHEN p_sort = 'oldest' THEN created_at END ASC NULLS LAST,
    CASE WHEN p_sort = 'newest' THEN created_at END DESC NULLS LAST,
    CASE WHEN p_sort = 'alphabetical' THEN created_at END DESC NULLS LAST,
    id DESC
  LIMIT greatest(1, least(p_limit, 100))
  OFFSET greatest(0, p_offset);
$$;

COMMENT ON FUNCTION public.library_archive_list_page IS
  'Archive Pauses/Echo/Default list: segment + optional favorites, search, tag, source_types, smart id set, sort, limit/offset. Caller must be authenticated.';

REVOKE ALL ON FUNCTION public.library_archive_list_page(
  text, boolean, text, text, text[], uuid[], text, boolean, int, bigint
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.library_archive_list_page(
  text, boolean, text, text, text[], uuid[], text, boolean, int, bigint
) TO authenticated, service_role;
