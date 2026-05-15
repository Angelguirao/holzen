-- Archive Echo tab: server-side row set for pagination (matches client helpers in
-- src/lib/archive-segment.ts — isArchiveEchoPause + main pause bookmark).
CREATE OR REPLACE VIEW public.library_archive_echo_items AS
SELECT li.*
FROM public.library_items li
INNER JOIN public.pause_instances pi ON pi.id = li.pause_instance_id
WHERE li.pause_instance_id IS NOT NULL
  AND li.source_type = 'pause'
  AND pi.state IN ('expired', 'dismissed')
  AND pi.engaged_at IS NULL
  AND li.status NOT IN ('deleted', 'archived');

COMMENT ON VIEW public.library_archive_echo_items IS
  'Echo archive rows: main pause library_items for terminal pause_instances without Reflect. Keep in sync with src/lib/archive-segment.ts.';

ALTER VIEW public.library_archive_echo_items SET (security_invoker = true);

GRANT SELECT ON public.library_archive_echo_items TO authenticated;
GRANT SELECT ON public.library_archive_echo_items TO service_role;
