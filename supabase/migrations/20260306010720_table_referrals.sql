
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code text UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by text;

-- Generate referral codes for existing profiles
UPDATE public.profiles SET referral_code = substr(md5(random()::text), 1, 8) WHERE referral_code IS NULL;

-- Make referral_code not null with a default
ALTER TABLE public.profiles ALTER COLUMN referral_code SET DEFAULT substr(md5(random()::text), 1, 8);
ALTER TABLE public.profiles ALTER COLUMN referral_code SET NOT NULL;

-- Create referrals view for counting
CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL,
  referred_user_id uuid NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own referrals"
  ON public.referrals FOR SELECT
  TO authenticated
  USING (auth.uid() = referrer_id);
