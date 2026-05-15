-- Instance-first archive: keep every qualifying `library_items` row (Pauses tab),
-- plus synthetic "main pause" rows for terminal `pause_instances` that have no
-- non-deleted/archived library rows at all. Echo tab mirrors the same pattern.
-- Always exclude open states: active, engaged, pending.

-- Prior revisions used different column positions; `CREATE OR REPLACE VIEW` cannot
-- rename columns in place (42P16). Drop first per migration-view-safety.
DROP VIEW IF EXISTS public.library_archive_echo_items CASCADE;
DROP VIEW IF EXISTS public.library_archive_pauses_tab_items CASCADE;

CREATE VIEW public.library_archive_pauses_tab_items AS
WITH
  synth_title AS (
    SELECT
      pi.id AS pause_instance_id,
      NULLIF(
        trim(
          both
          FROM
            coalesce(
              (SELECT a.content->>'message'
                 FROM public.pause_ai_artifacts a
                WHERE a.pause_instance_id = pi.id AND a.kind = 'reflection_text'
                LIMIT 1),
              (SELECT a.content->>'haiku'
                 FROM public.pause_ai_artifacts a
                WHERE a.pause_instance_id = pi.id AND a.kind = 'haiku'
                LIMIT 1),
              (SELECT e.payload->>'text'
                 FROM public.pause_step_events e
                WHERE e.pause_instance_id = pi.id AND e.step_type = 'note_updated'
                ORDER BY e.created_at DESC
                LIMIT 1),
              ''
            )
        ),
        ''
      ) AS title
    FROM public.pause_instances pi
  ),
  synth_body AS (
    SELECT
      pi.id AS pause_instance_id,
      NULLIF(
        trim(
          both
          FROM
            coalesce(
              (SELECT a.content->>'message'
                 FROM public.pause_ai_artifacts a
                WHERE a.pause_instance_id = pi.id AND a.kind = 'reflection_text'
                LIMIT 1),
              (SELECT e.payload->>'text'
                 FROM public.pause_step_events e
                WHERE e.pause_instance_id = pi.id AND e.step_type = 'note_updated'
                ORDER BY e.created_at DESC
                LIMIT 1),
              (SELECT e.payload->>'outcome'
                 FROM public.pause_step_events e
                WHERE e.pause_instance_id = pi.id AND e.step_type = 'outcome_logged'
                ORDER BY e.created_at DESC
                LIMIT 1),
              ''
            )
        ),
        ''
      ) AS body
    FROM public.pause_instances pi
  )
SELECT
  li.id,
  li.user_id,
  li.type,
  li.title,
  li.body,
  li.source_type,
  li.source_url,
  li.tags,
  li.pinned,
  li.created_at,
  li.status,
  li.is_favorite,
  li.pause_instance_id,
  li.id AS source_library_item_id
FROM public.library_items li
LEFT JOIN public.pause_instances pi ON pi.id = li.pause_instance_id
WHERE li.status NOT IN ('deleted', 'archived')
  AND (
    li.pause_instance_id IS NULL
    OR pi.id IS NULL
    OR (
      pi.state NOT IN ('active', 'engaged', 'pending')
      AND NOT (
        (
          pi.state = 'expired'
          AND pi.engaged_at IS NULL
          AND pi.expired_reason IS DISTINCT FROM 'superseded'::public.pause_expired_reason
        )
        OR (pi.state = 'dismissed' AND pi.engaged_at IS NULL)
      )
    )
  )
UNION ALL
SELECT
  (
    substr(md5(pi.id::text), 1, 8) || '-' ||
    substr(md5(pi.id::text), 9, 4) || '-' ||
    '4' || substr(md5(pi.id::text), 13, 3) || '-' ||
    'a' || substr(md5(pi.id::text), 17, 3) || '-' ||
    substr(md5(pi.id::text), 21, 12)
  )::uuid AS id,
  pi.user_id,
  'pause'::text AS type,
  st.title,
  sb.body,
  'pause'::text AS source_type,
  NULL::text AS source_url,
  ARRAY[]::text[] AS tags,
  false AS pinned,
  COALESCE(pi.terminal_at, pi.completed_at, pi.created_at) AS created_at,
  'read'::text AS status,
  false AS is_favorite,
  pi.id AS pause_instance_id,
  NULL::uuid AS source_library_item_id
FROM public.pause_instances pi
LEFT JOIN synth_title st ON st.pause_instance_id = pi.id
LEFT JOIN synth_body sb ON sb.pause_instance_id = pi.id
WHERE pi.state NOT IN ('active', 'engaged', 'pending')
  AND NOT EXISTS (
    SELECT 1
      FROM public.library_items li2
     WHERE li2.pause_instance_id = pi.id
       AND li2.status NOT IN ('deleted', 'archived')
  )
  AND NOT (
    (
      pi.state = 'expired'
      AND pi.engaged_at IS NULL
      AND pi.expired_reason IS DISTINCT FROM 'superseded'::public.pause_expired_reason
    )
    OR (pi.state = 'dismissed' AND pi.engaged_at IS NULL)
  );

COMMENT ON VIEW public.library_archive_pauses_tab_items IS
  'Archive Pauses tab: qualifying library_items rows plus synthetic main-pause rows for '
  'terminal pause_instances with no library rows. Excludes active/engaged/pending and '
  'echo-only instances. Keep in sync with src/lib/archive-segment.ts.';

ALTER VIEW public.library_archive_pauses_tab_items SET (security_invoker = true);
GRANT SELECT ON public.library_archive_pauses_tab_items TO authenticated;
GRANT SELECT ON public.library_archive_pauses_tab_items TO service_role;

CREATE VIEW public.library_archive_echo_items AS
WITH
  synth_title AS (
    SELECT
      pi.id AS pause_instance_id,
      NULLIF(
        trim(
          both
          FROM
            coalesce(
              (SELECT a.content->>'message'
                 FROM public.pause_ai_artifacts a
                WHERE a.pause_instance_id = pi.id AND a.kind = 'reflection_text'
                LIMIT 1),
              (SELECT a.content->>'haiku'
                 FROM public.pause_ai_artifacts a
                WHERE a.pause_instance_id = pi.id AND a.kind = 'haiku'
                LIMIT 1),
              (SELECT e.payload->>'text'
                 FROM public.pause_step_events e
                WHERE e.pause_instance_id = pi.id AND e.step_type = 'note_updated'
                ORDER BY e.created_at DESC
                LIMIT 1),
              ''
            )
        ),
        ''
      ) AS title
    FROM public.pause_instances pi
  ),
  synth_body AS (
    SELECT
      pi.id AS pause_instance_id,
      NULLIF(
        trim(
          both
          FROM
            coalesce(
              (SELECT a.content->>'message'
                 FROM public.pause_ai_artifacts a
                WHERE a.pause_instance_id = pi.id AND a.kind = 'reflection_text'
                LIMIT 1),
              (SELECT e.payload->>'text'
                 FROM public.pause_step_events e
                WHERE e.pause_instance_id = pi.id AND e.step_type = 'note_updated'
                ORDER BY e.created_at DESC
                LIMIT 1),
              (SELECT e.payload->>'outcome'
                 FROM public.pause_step_events e
                WHERE e.pause_instance_id = pi.id AND e.step_type = 'outcome_logged'
                ORDER BY e.created_at DESC
                LIMIT 1),
              ''
            )
        ),
        ''
      ) AS body
    FROM public.pause_instances pi
  )
SELECT
  li.id,
  li.user_id,
  li.type,
  li.title,
  li.body,
  li.source_type,
  li.source_url,
  li.tags,
  li.pinned,
  li.created_at,
  li.status,
  li.is_favorite,
  li.pause_instance_id,
  li.id AS source_library_item_id
FROM public.library_items li
INNER JOIN public.pause_instances pi ON pi.id = li.pause_instance_id
WHERE li.status NOT IN ('deleted', 'archived')
  AND li.source_type = 'pause'
  AND pi.state NOT IN ('active', 'engaged', 'pending')
  AND pi.engaged_at IS NULL
  AND (
    (pi.state = 'dismissed')
    OR (
      pi.state = 'expired'
      AND pi.expired_reason IS DISTINCT FROM 'superseded'::public.pause_expired_reason
    )
  )
UNION ALL
SELECT
  (
    substr(md5(pi.id::text), 1, 8) || '-' ||
    substr(md5(pi.id::text), 9, 4) || '-' ||
    '4' || substr(md5(pi.id::text), 13, 3) || '-' ||
    'a' || substr(md5(pi.id::text), 17, 3) || '-' ||
    substr(md5(pi.id::text), 21, 12)
  )::uuid AS id,
  pi.user_id,
  'pause'::text AS type,
  st.title,
  sb.body,
  'pause'::text AS source_type,
  NULL::text AS source_url,
  ARRAY[]::text[] AS tags,
  false AS pinned,
  COALESCE(pi.terminal_at, pi.completed_at, pi.created_at) AS created_at,
  'read'::text AS status,
  false AS is_favorite,
  pi.id AS pause_instance_id,
  NULL::uuid AS source_library_item_id
FROM public.pause_instances pi
LEFT JOIN synth_title st ON st.pause_instance_id = pi.id
LEFT JOIN synth_body sb ON sb.pause_instance_id = pi.id
WHERE pi.state NOT IN ('active', 'engaged', 'pending')
  AND pi.engaged_at IS NULL
  AND (
    (pi.state = 'dismissed')
    OR (
      pi.state = 'expired'
      AND pi.expired_reason IS DISTINCT FROM 'superseded'::public.pause_expired_reason
    )
  )
  AND NOT EXISTS (
    SELECT 1
      FROM public.library_items li2
     WHERE li2.pause_instance_id = pi.id
       AND li2.status NOT IN ('deleted', 'archived')
  );

COMMENT ON VIEW public.library_archive_echo_items IS
  'Echo archive: main pause library_items for unengaged dismissed/expired instances, plus '
  'synthetic rows when no library_items exist. Excludes active/engaged/pending and superseded.';

ALTER VIEW public.library_archive_echo_items SET (security_invoker = true);
GRANT SELECT ON public.library_archive_echo_items TO authenticated;
GRANT SELECT ON public.library_archive_echo_items TO service_role;

-- RPC returns `library_items` shape only (strip `source_library_item_id`).
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
    SELECT
      li.id,
      li.user_id,
      li.type,
      li.title,
      li.body,
      li.source_type,
      li.source_url,
      li.tags,
      li.pinned,
      li.created_at,
      li.status,
      li.is_favorite,
      li.pause_instance_id
    FROM public.library_items li
    WHERE li.user_id = auth.uid()
      AND p_segment = 'default'
      AND li.status NOT IN ('deleted', 'archived')
      AND (NOT p_favorites_only OR li.is_favorite = true)
      AND (
        NOT p_main_pause_only
        OR li.source_type = 'pause'
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
    UNION ALL
    SELECT
      v.id,
      v.user_id,
      v.type,
      v.title,
      v.body,
      v.source_type,
      v.source_url,
      v.tags,
      v.pinned,
      v.created_at,
      v.status,
      v.is_favorite,
      v.pause_instance_id
    FROM public.library_archive_echo_items v
    WHERE v.user_id = auth.uid()
      AND p_segment = 'echo'
      AND (NOT p_favorites_only OR v.is_favorite = true)
      AND (
        NOT p_main_pause_only
        OR v.source_type = 'pause'
      )
      AND (
        p_search IS NULL
        OR btrim(p_search) = ''
        OR v.title ILIKE '%' || btrim(p_search) || '%'
        OR v.body ILIKE '%' || btrim(p_search) || '%'
        OR EXISTS (
          SELECT 1
          FROM unnest(coalesce(v.tags, '{}'::text[])) AS t(tag)
          WHERE t.tag ILIKE '%' || btrim(p_search) || '%'
        )
      )
      AND (p_tag IS NULL OR btrim(p_tag) = '' OR p_tag = ANY (coalesce(v.tags, '{}'::text[])))
      AND (
        p_source_types IS NULL
        OR coalesce(cardinality(p_source_types), 0) = 0
        OR v.source_type = ANY (p_source_types)
      )
      AND (
        p_smart_ids IS NULL
        OR coalesce(cardinality(p_smart_ids), 0) = 0
        OR v.id = ANY (p_smart_ids)
      )
    UNION ALL
    SELECT
      v.id,
      v.user_id,
      v.type,
      v.title,
      v.body,
      v.source_type,
      v.source_url,
      v.tags,
      v.pinned,
      v.created_at,
      v.status,
      v.is_favorite,
      v.pause_instance_id
    FROM public.library_archive_pauses_tab_items v
    WHERE v.user_id = auth.uid()
      AND p_segment = 'pauses'
      AND (NOT p_favorites_only OR v.is_favorite = true)
      AND (
        NOT p_main_pause_only
        OR v.source_type = 'pause'
      )
      AND (
        p_search IS NULL
        OR btrim(p_search) = ''
        OR v.title ILIKE '%' || btrim(p_search) || '%'
        OR v.body ILIKE '%' || btrim(p_search) || '%'
        OR EXISTS (
          SELECT 1
          FROM unnest(coalesce(v.tags, '{}'::text[])) AS t(tag)
          WHERE t.tag ILIKE '%' || btrim(p_search) || '%'
        )
      )
      AND (p_tag IS NULL OR btrim(p_tag) = '' OR p_tag = ANY (coalesce(v.tags, '{}'::text[])))
      AND (
        p_source_types IS NULL
        OR coalesce(cardinality(p_source_types), 0) = 0
        OR v.source_type = ANY (p_source_types)
      )
      AND (
        p_smart_ids IS NULL
        OR coalesce(cardinality(p_smart_ids), 0) = 0
        OR v.id = ANY (p_smart_ids)
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
