-- Pauses archive tab: server-side row set (excludes anything tied to an echo-only pause instance).
-- Matches src/lib/archive-segment.ts itemBelongsToPausesTab (echo = expired|dismissed + engaged_at IS NULL).
-- Membership uses pause_instances; card UI still hydrates from v_pause_full.
CREATE VIEW public.library_archive_pauses_tab_items AS
SELECT li.*
FROM public.library_items li
LEFT JOIN public.pause_instances pi ON pi.id = li.pause_instance_id
WHERE li.status NOT IN ('deleted', 'archived')
  AND (
    li.pause_instance_id IS NULL
    OR pi.id IS NULL
    OR NOT (
      pi.state IN ('expired', 'dismissed')
      AND pi.engaged_at IS NULL
    )
  );

COMMENT ON VIEW public.library_archive_pauses_tab_items IS
  'Archive Pauses tab: library_items excluding rows for echo-only pause_instances (terminal without Reflect). Keep in sync with src/lib/archive-segment.ts itemBelongsToPausesTab.';

ALTER VIEW public.library_archive_pauses_tab_items SET (security_invoker = true);

GRANT SELECT ON public.library_archive_pauses_tab_items TO authenticated;
GRANT SELECT ON public.library_archive_pauses_tab_items TO service_role;

COMMENT ON VIEW public.library_archive_echo_items IS
  'Echo archive: main pause rows where pause_instances ended expired/dismissed without Reflect (engaged_at IS NULL). Echo membership is keyed on pause_instances (same as client isArchiveEchoPause); hydrate still reads v_pause_full for card fields.';
