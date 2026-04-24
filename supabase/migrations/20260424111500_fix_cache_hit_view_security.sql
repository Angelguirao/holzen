-- Restore secure access controls for v_companion_cache_hit_rate.
-- A prior migration recreated this view without security_invoker and granted
-- authenticated access, which can bypass RLS and expose global aggregates.

ALTER VIEW public.v_companion_cache_hit_rate SET (security_invoker = true);

REVOKE SELECT ON public.v_companion_cache_hit_rate FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.v_companion_cache_hit_rate TO service_role;
