CREATE OR REPLACE VIEW public.v_pause_archive_echoes AS
SELECT vf.*
  FROM public.v_pause_full vf
 WHERE vf.state NOT IN ('active', 'engaged', 'pending')
   AND vf.engaged_at IS NULL
   AND NOT (
     vf.state = 'expired'
     AND vf.expired_reason = 'system_cancelled'::public.pause_expired_reason
   )
   AND (
     vf.state = 'dismissed'
     OR (
       vf.state = 'expired'
       AND vf.expired_reason IS DISTINCT FROM 'superseded'::public.pause_expired_reason
     )
   );

ALTER VIEW public.v_pause_archive_echoes SET (security_invoker = true);

COMMENT ON VIEW public.v_pause_archive_echoes IS
  'Archive Echoes tab: terminal instances that never reached engaged, excluding superseded-by-adopt (see Pauses tab) and pending-queue churn (expired + system_cancelled).';

GRANT SELECT ON public.v_pause_archive_echoes TO authenticated;
GRANT SELECT ON public.v_pause_archive_echoes TO service_role;