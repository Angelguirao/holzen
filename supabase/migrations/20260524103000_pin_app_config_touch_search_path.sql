-- Pin search_path on trigger helpers missing CREATE-time paths (migration-security-conventions).
ALTER FUNCTION public.app_config_touch_updated_at() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
