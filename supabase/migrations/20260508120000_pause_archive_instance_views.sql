-- Pause archive lists are driven by `v_pause_full` (pause_instances + artifacts + step
-- summaries). Drop legacy library-item archive views and RPC.

DROP FUNCTION IF EXISTS public.library_archive_list_page(
  text, boolean, text, text, text[], uuid[], text, boolean, int, bigint
);

DROP VIEW IF EXISTS public.library_archive_echo_items CASCADE;
DROP VIEW IF EXISTS public.library_archive_pauses_tab_items CASCADE;

-- Pauses tab: terminal / historical instances excluding “echo-only” rows (same rules as
-- prior `library_archive_pauses_tab_items` membership, without `library_items`).
CREATE OR REPLACE VIEW public.v_pause_archive_pauses AS
SELECT vf.*
FROM public.v_pause_full vf
WHERE vf.state NOT IN ('active', 'engaged', 'pending')
  AND NOT (
    (
      vf.state = 'expired'
      AND vf.engaged_at IS NULL
      AND vf.expired_reason IS DISTINCT FROM 'superseded'::public.pause_expired_reason
    )
    OR (vf.state = 'dismissed' AND vf.engaged_at IS NULL)
  );

ALTER VIEW public.v_pause_archive_pauses SET (security_invoker = true);

COMMENT ON VIEW public.v_pause_archive_pauses IS
  'Archive Pauses tab: `v_pause_full` rows excluding open states and echo-only instances.';

GRANT SELECT ON public.v_pause_archive_pauses TO authenticated;
GRANT SELECT ON public.v_pause_archive_pauses TO service_role;

-- Echoes tab: unengaged dismissed / expired (excluding superseded), no open states.
CREATE OR REPLACE VIEW public.v_pause_archive_echoes AS
SELECT vf.*
FROM public.v_pause_full vf
WHERE vf.state NOT IN ('active', 'engaged', 'pending')
  AND vf.engaged_at IS NULL
  AND (
    vf.state = 'dismissed'
    OR (
      vf.state = 'expired'
      AND vf.expired_reason IS DISTINCT FROM 'superseded'::public.pause_expired_reason
    )
  );

ALTER VIEW public.v_pause_archive_echoes SET (security_invoker = true);

COMMENT ON VIEW public.v_pause_archive_echoes IS
  'Archive Echoes tab: `v_pause_full` echo-eligible instances (terminal, never engaged).';

GRANT SELECT ON public.v_pause_archive_echoes TO authenticated;
GRANT SELECT ON public.v_pause_archive_echoes TO service_role;
