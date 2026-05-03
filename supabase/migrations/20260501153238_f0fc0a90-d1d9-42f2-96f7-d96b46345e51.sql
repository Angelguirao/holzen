-- v_pause_full: add emotion intensity columns
CREATE OR REPLACE VIEW public.v_pause_full WITH (security_invoker = true) AS
SELECT
  pi.*,
  (EXISTS (SELECT 1 FROM public.pause_step_events e WHERE e.pause_instance_id = pi.id AND e.step_type = 'breath_completed')) AS has_breath_completed,
  (EXISTS (SELECT 1 FROM public.pause_step_events e WHERE e.pause_instance_id = pi.id AND e.step_type = 'initial_emotion_logged')) AS has_initial_emotion_logged,
  (EXISTS (SELECT 1 FROM public.pause_step_events e WHERE e.pause_instance_id = pi.id AND e.step_type = 'shift_emotion_logged')) AS has_shift_emotion_logged,
  (EXISTS (SELECT 1 FROM public.pause_step_events e WHERE e.pause_instance_id = pi.id AND e.step_type = 'outcome_logged')) AS has_outcome_logged,
  (SELECT payload->>'mood' FROM public.pause_step_events e WHERE e.pause_instance_id = pi.id AND e.step_type = 'initial_emotion_logged' ORDER BY e.created_at DESC LIMIT 1) AS initial_mood,
  (SELECT payload->>'mood' FROM public.pause_step_events e WHERE e.pause_instance_id = pi.id AND e.step_type = 'shift_emotion_logged' ORDER BY e.created_at DESC LIMIT 1) AS shift_mood,
  (SELECT payload->>'outcome' FROM public.pause_step_events e WHERE e.pause_instance_id = pi.id AND e.step_type = 'outcome_logged' ORDER BY e.created_at DESC LIMIT 1) AS outcome,
  (SELECT payload->>'text' FROM public.pause_step_events e WHERE e.pause_instance_id = pi.id AND e.step_type = 'note_updated' ORDER BY e.created_at DESC LIMIT 1) AS note_text,
  (SELECT ARRAY(SELECT jsonb_array_elements_text(payload->'tags')) FROM public.pause_step_events e WHERE e.pause_instance_id = pi.id AND e.step_type = 'tag_updated' ORDER BY e.created_at DESC LIMIT 1) AS tags,
  COALESCE((SELECT (payload->>'is_favorite')::boolean FROM public.pause_step_events e WHERE e.pause_instance_id = pi.id AND e.step_type = 'favorite_toggled' ORDER BY e.created_at DESC LIMIT 1), false) AS is_favorite,
  (SELECT count(*) FROM public.pause_companion_events ce WHERE ce.pause_instance_id = pi.id AND ce.action='complete' AND ce.counts_for_pause=true)::int AS counted_companion_count,
  (SELECT COALESCE(array_agg(DISTINCT ce.companion_type), ARRAY[]::text[]) FROM public.pause_companion_events ce WHERE ce.pause_instance_id = pi.id AND ce.action='complete' AND ce.counts_for_pause=true) AS counted_companion_types,
  (SELECT content->>'message' FROM public.pause_ai_artifacts a WHERE a.pause_instance_id = pi.id AND a.kind = 'reflection_text' LIMIT 1) AS reflection_text,
  (SELECT content->>'haiku' FROM public.pause_ai_artifacts a WHERE a.pause_instance_id = pi.id AND a.kind = 'haiku' LIMIT 1) AS haiku_text,
  (SELECT NULLIF(trim(both from (e.payload->>'intensity')), '')::smallint
     FROM public.pause_step_events e
    WHERE e.pause_instance_id = pi.id AND e.step_type = 'initial_emotion_logged'
    ORDER BY e.created_at DESC LIMIT 1) AS initial_emotion_intensity,
  (SELECT NULLIF(trim(both from (e.payload->>'shift_intensity')), '')::smallint
     FROM public.pause_step_events e
    WHERE e.pause_instance_id = pi.id AND e.step_type = 'shift_emotion_logged'
    ORDER BY e.created_at DESC LIMIT 1) AS shift_emotion_intensity
FROM public.pause_instances pi;

COMMENT ON VIEW public.v_pause_full IS
  'Rich join of pause_instances + step presence + companion counts + artifact text + latest mood/intensity from step payloads.';

-- library_archive_list_page RPC
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