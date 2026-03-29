
-- Fix security definer views by setting security_invoker = true
ALTER VIEW public.v_companion_cache_hit_rate SET (security_invoker = true);
ALTER VIEW public.v_generation_failure_rate SET (security_invoker = true);
ALTER VIEW public.v_companion_avg_latency SET (security_invoker = true);
ALTER VIEW public.v_companion_cost_per_day SET (security_invoker = true);
ALTER VIEW public.v_companion_feedback_ratio SET (security_invoker = true);
