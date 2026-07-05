-- One-trial enforcement: service-written trial_used_at + normalized email fingerprints.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS trial_used_at timestamptz;

COMMENT ON COLUMN public.profiles.trial_used_at IS
  'UTC timestamp when the user consumed their one Holzen Stripe trial. Service-written only.';

CREATE TABLE IF NOT EXISTS public.trial_email_fingerprints (
  email_fingerprint text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.trial_email_fingerprints IS
  'SHA-256 fingerprints of normalized signup emails — blocks Gmail +alias / dot tricks across accounts. Service writes only.';

CREATE INDEX IF NOT EXISTS idx_trial_email_fingerprints_user_id
  ON public.trial_email_fingerprints(user_id);

ALTER TABLE public.trial_email_fingerprints ENABLE ROW LEVEL SECURITY;

-- Backfill trial_used_at for users who already lapsed after a trial.
UPDATE public.profiles
SET trial_used_at = COALESCE(subscription_checked_at, updated_at, created_at, now())
WHERE subscription_status = 'lapsed'
  AND trial_used_at IS NULL;

-- Extend privileged-column guard (profiles_block_privileged_updates).
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
  IF is_service_role THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(p.is_admin, false) INTO caller_is_admin
  FROM public.profiles p
  WHERE p.user_id = auth.uid()
  LIMIT 1;

  IF caller_is_admin THEN
    RETURN NEW;
  END IF;

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
  IF NEW.trial_used_at IS DISTINCT FROM OLD.trial_used_at THEN
    RAISE EXCEPTION 'profiles.trial_used_at cannot be modified by the user';
  END IF;

  RETURN NEW;
END;
$$;
