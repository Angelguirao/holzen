
-- Track which referral rewards have been granted
CREATE TABLE public.referral_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  milestone integer NOT NULL,
  reward_type text NOT NULL,
  granted_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, milestone)
);

ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own rewards"
  ON public.referral_rewards
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Add lifetime_access flag to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS lifetime_access boolean NOT NULL DEFAULT false;
