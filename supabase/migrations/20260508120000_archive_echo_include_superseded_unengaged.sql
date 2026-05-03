-- Treat `expired` + `expired_reason = superseded` + `engaged_at IS NULL` as archive
-- echoes (same UX bucket as other “never opened Reflect” terminals). Keep in sync
-- with `src/lib/archive-segment.ts` (`isArchiveEchoPause`).

CREATE OR REPLACE VIEW public.library_archive_pauses_tab_items AS
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
  li.pause_instance_id,
  li.tags,
  li.pinned,
  li.is_favorite,
  li.status,
  li.created_at,
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
        (pi.state = 'expired' AND pi.engaged_at IS NULL)
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
  pi.id AS pause_instance_id,
  ARRAY[]::text[] AS tags,
  false AS pinned,
  false AS is_favorite,
  'read'::text AS status,
  COALESCE(pi.terminal_at, pi.completed_at, pi.created_at) AS created_at,
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
    (pi.state = 'expired' AND pi.engaged_at IS NULL)
    OR (pi.state = 'dismissed' AND pi.engaged_at IS NULL)
  );

COMMENT ON VIEW public.library_archive_pauses_tab_items IS
  'Archive Pauses tab: qualifying library_items rows plus synthetic main-pause rows for '
  'terminal pause_instances with no library rows. Excludes active/engaged/pending and '
  'echo-only instances (terminal without Reflect, including superseded-when-unengaged). '
  'Keep in sync with src/lib/archive-segment.ts.';

ALTER VIEW public.library_archive_pauses_tab_items SET (security_invoker = true);
GRANT SELECT ON public.library_archive_pauses_tab_items TO authenticated;
GRANT SELECT ON public.library_archive_pauses_tab_items TO service_role;

CREATE OR REPLACE VIEW public.library_archive_echo_items AS
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
  li.pause_instance_id,
  li.tags,
  li.pinned,
  li.is_favorite,
  li.status,
  li.created_at,
  li.id AS source_library_item_id
FROM public.library_items li
INNER JOIN public.pause_instances pi ON pi.id = li.pause_instance_id
WHERE li.status NOT IN ('deleted', 'archived')
  AND li.source_type = 'pause'
  AND pi.state NOT IN ('active', 'engaged', 'pending')
  AND pi.engaged_at IS NULL
  AND (pi.state = 'dismissed' OR pi.state = 'expired')
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
  pi.id AS pause_instance_id,
  ARRAY[]::text[] AS tags,
  false AS pinned,
  false AS is_favorite,
  'read'::text AS status,
  COALESCE(pi.terminal_at, pi.completed_at, pi.created_at) AS created_at,
  NULL::uuid AS source_library_item_id
FROM public.pause_instances pi
LEFT JOIN synth_title st ON st.pause_instance_id = pi.id
LEFT JOIN synth_body sb ON sb.pause_instance_id = pi.id
WHERE pi.state NOT IN ('active', 'engaged', 'pending')
  AND pi.engaged_at IS NULL
  AND (pi.state = 'dismissed' OR pi.state = 'expired')
  AND NOT EXISTS (
    SELECT 1
      FROM public.library_items li2
     WHERE li2.pause_instance_id = pi.id
       AND li2.status NOT IN ('deleted', 'archived')
  );

COMMENT ON VIEW public.library_archive_echo_items IS
  'Echo archive: main pause library_items for unengaged dismissed/expired instances '
  '(including superseded-by-adopt when Reflect was never opened), plus synthetic rows '
  'when no library_items exist. Keep in sync with src/lib/archive-segment.ts.';

ALTER VIEW public.library_archive_echo_items SET (security_invoker = true);
GRANT SELECT ON public.library_archive_echo_items TO authenticated;
GRANT SELECT ON public.library_archive_echo_items TO service_role;
