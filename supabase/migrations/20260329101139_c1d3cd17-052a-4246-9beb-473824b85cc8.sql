-- Fix security linter: set view to SECURITY INVOKER (default, safe)
ALTER VIEW public.v_reflection_with_companions SET (security_invoker = true);