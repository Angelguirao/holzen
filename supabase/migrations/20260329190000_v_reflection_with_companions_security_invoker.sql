-- PostgREST exposes this view to the Data API. Without security_invoker, the view can
-- behave like SECURITY DEFINER (owner privileges) and bypass row checks — Supabase flags that.
-- Invoker mode applies RLS on underlying public.reflections and public.reflection_companions.

ALTER VIEW public.v_reflection_with_companions SET (security_invoker = true);
