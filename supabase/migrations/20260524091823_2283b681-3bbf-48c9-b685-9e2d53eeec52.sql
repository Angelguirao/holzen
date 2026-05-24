-- Collapse Pro Plus tier into Pro. Holzen now has a single subscription tier.
UPDATE public.profiles SET subscription_tier = 'pro' WHERE subscription_tier = 'pro_plus';

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_subscription_tier_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_subscription_tier_check
  CHECK (subscription_tier IN ('free', 'pro', 'lifetime'));

COMMENT ON COLUMN public.profiles.subscription_tier IS
  'Cached Stripe-derived tier: free | pro | lifetime. Pro+ was retired May 2026.';