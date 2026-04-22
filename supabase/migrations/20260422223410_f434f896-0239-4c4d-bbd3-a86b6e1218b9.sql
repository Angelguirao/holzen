-- Set security_invoker=true on views that don't have it (fixes Security Definer View lints)
ALTER VIEW public.v_ai_spend_month_global SET (security_invoker = true);
ALTER VIEW public.v_ai_spend_today_global SET (security_invoker = true);
ALTER VIEW public.v_ai_spend_today_per_user SET (security_invoker = true);
ALTER VIEW public.v_companion_cache_hit_rate SET (security_invoker = true);
ALTER VIEW public.v_companion_cost_per_day SET (security_invoker = true);
ALTER VIEW public.v_generation_failure_rate SET (security_invoker = true);

-- Set search_path on functions missing it (fixes Function Search Path Mutable lints)
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public;
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public;
ALTER FUNCTION public.set_reflection_engaged_at() SET search_path = public;