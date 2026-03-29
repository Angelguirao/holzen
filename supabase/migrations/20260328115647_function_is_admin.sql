
-- Fix 1: Add SET search_path TO 'public' to is_admin() function
CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE user_id = auth.uid()),
    false
  );
$function$;

-- Fix 2: Ensure analytics views are only accessible via service_role
-- Revoke access from non-admin roles on all analytics views
REVOKE SELECT ON public.v_companion_avg_latency FROM public, authenticated, anon;
REVOKE SELECT ON public.v_companion_cache_hit_rate FROM public, authenticated, anon;
REVOKE SELECT ON public.v_companion_cost_per_day FROM public, authenticated, anon;
REVOKE SELECT ON public.v_companion_feedback_per_day FROM public, authenticated, anon;
REVOKE SELECT ON public.v_companion_feedback_ratio FROM public, authenticated, anon;
REVOKE SELECT ON public.v_companion_serves_per_day FROM public, authenticated, anon;
REVOKE SELECT ON public.v_generation_failure_rate FROM public, authenticated, anon;
REVOKE SELECT ON public.v_generation_failures_per_day FROM public, authenticated, anon;

-- Grant only to service_role (used by get_admin_stats() SECURITY DEFINER RPC)
GRANT SELECT ON public.v_companion_avg_latency TO service_role;
GRANT SELECT ON public.v_companion_cache_hit_rate TO service_role;
GRANT SELECT ON public.v_companion_cost_per_day TO service_role;
GRANT SELECT ON public.v_companion_feedback_per_day TO service_role;
GRANT SELECT ON public.v_companion_feedback_ratio TO service_role;
GRANT SELECT ON public.v_companion_serves_per_day TO service_role;
GRANT SELECT ON public.v_generation_failure_rate TO service_role;
GRANT SELECT ON public.v_generation_failures_per_day TO service_role;
