-- Revoke UPDATE on sensitive columns from authenticated and public roles
-- This prevents users from self-escalating admin privileges or granting themselves premium access
REVOKE UPDATE (is_admin, subscription_status, lifetime_access, subscription_end, subscription_checked_at) ON public.profiles FROM authenticated;
REVOKE UPDATE (is_admin, subscription_status, lifetime_access, subscription_end, subscription_checked_at) ON public.profiles FROM anon;
REVOKE UPDATE (is_admin, subscription_status, lifetime_access, subscription_end, subscription_checked_at) ON public.profiles FROM public;