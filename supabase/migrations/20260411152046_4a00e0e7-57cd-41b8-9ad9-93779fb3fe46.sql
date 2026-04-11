-- 1. Update protect_subscription_fields to also protect is_admin
CREATE OR REPLACE FUNCTION public.protect_subscription_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF current_setting('role', true) IS DISTINCT FROM 'service_role' THEN
    NEW.subscription_status := OLD.subscription_status;
    NEW.lifetime_access := OLD.lifetime_access;
    NEW.subscription_end := OLD.subscription_end;
    NEW.subscription_checked_at := OLD.subscription_checked_at;
    NEW.is_admin := OLD.is_admin;
  END IF;
  RETURN NEW;
END;
$function$;

-- 2. Remove profiles from Realtime publication (safe: no-op if not present)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'profiles' AND schemaname = 'public'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.profiles;
  END IF;
END;
$$;