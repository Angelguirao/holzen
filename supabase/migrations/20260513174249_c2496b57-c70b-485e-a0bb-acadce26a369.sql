
-- Prevent privilege escalation via profiles UPDATE.
-- The existing RLS UPDATE policy lets a user update their own profile row,
-- which (without a column guard) means they could flip is_admin = true,
-- grant themselves lifetime_access, or fake a Pro subscription.
--
-- This trigger blocks any change to privileged columns unless the change
-- is performed by the service role (Edge Functions / Stripe webhooks) or
-- by an existing admin (caller already passes is_admin()).
CREATE OR REPLACE FUNCTION public.profiles_block_privileged_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_service_role boolean := (auth.role() = 'service_role');
  caller_is_admin boolean := false;
BEGIN
  -- Service role (Edge Functions, cron, webhooks) bypasses the guard.
  IF is_service_role THEN
    RETURN NEW;
  END IF;

  -- Existing admins may legitimately change these columns (e.g., grant
  -- lifetime_access to a partner). Look up admin status on the OLD row,
  -- not the NEW one, so a non-admin cannot self-promote in the same UPDATE.
  SELECT COALESCE(p.is_admin, false) INTO caller_is_admin
  FROM public.profiles p
  WHERE p.user_id = auth.uid()
  LIMIT 1;

  IF caller_is_admin THEN
    RETURN NEW;
  END IF;

  -- For ordinary authenticated users: forbid changes to privileged columns.
  IF NEW.is_admin IS DISTINCT FROM OLD.is_admin THEN
    RAISE EXCEPTION 'profiles.is_admin cannot be modified by the user';
  END IF;
  IF NEW.lifetime_access IS DISTINCT FROM OLD.lifetime_access THEN
    RAISE EXCEPTION 'profiles.lifetime_access cannot be modified by the user';
  END IF;
  IF NEW.subscription_status IS DISTINCT FROM OLD.subscription_status THEN
    RAISE EXCEPTION 'profiles.subscription_status cannot be modified by the user';
  END IF;
  IF NEW.subscription_tier IS DISTINCT FROM OLD.subscription_tier THEN
    RAISE EXCEPTION 'profiles.subscription_tier cannot be modified by the user';
  END IF;
  IF NEW.referral_code IS DISTINCT FROM OLD.referral_code THEN
    RAISE EXCEPTION 'profiles.referral_code cannot be modified by the user';
  END IF;
  IF NEW.referred_by IS DISTINCT FROM OLD.referred_by THEN
    RAISE EXCEPTION 'profiles.referred_by cannot be modified by the user';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_block_privileged_updates_trg ON public.profiles;
CREATE TRIGGER profiles_block_privileged_updates_trg
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.profiles_block_privileged_updates();
