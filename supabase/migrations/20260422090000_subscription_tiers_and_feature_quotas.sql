-- Pricing v1 packaging:
-- - profiles.subscription_tier caches Stripe-derived plan tier.
-- - monthly_feature_usage stores metered package usage (companions, wallpapers).
-- - consume_monthly_feature_quota() provides an atomic increment with a hard cap.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_tier text NOT NULL DEFAULT 'free';

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_subscription_tier_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_subscription_tier_check
  CHECK (subscription_tier IN ('free', 'pro', 'pro_plus', 'lifetime'));

COMMENT ON COLUMN public.profiles.subscription_tier IS
'Cached Stripe-derived tier for package limits: free | pro | pro_plus | lifetime.';

CREATE TABLE IF NOT EXISTS public.monthly_feature_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature text NOT NULL,
  month_start date NOT NULL,
  used integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT monthly_feature_usage_feature_check CHECK (feature IN ('premium_companion', 'wallpaper')),
  CONSTRAINT monthly_feature_usage_used_nonnegative CHECK (used >= 0),
  CONSTRAINT monthly_feature_usage_unique UNIQUE (user_id, feature, month_start)
);

COMMENT ON TABLE public.monthly_feature_usage IS
'Per-user monthly package usage for metered premium features.';

CREATE INDEX IF NOT EXISTS idx_monthly_feature_usage_user_month
  ON public.monthly_feature_usage(user_id, month_start);

ALTER TABLE public.monthly_feature_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS monthly_feature_usage_owner_select ON public.monthly_feature_usage;
CREATE POLICY monthly_feature_usage_owner_select
  ON public.monthly_feature_usage
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_monthly_feature_usage_touch_updated_at ON public.monthly_feature_usage;
CREATE TRIGGER trg_monthly_feature_usage_touch_updated_at
  BEFORE UPDATE ON public.monthly_feature_usage
  FOR EACH ROW
  EXECUTE FUNCTION public.app_config_touch_updated_at();

CREATE OR REPLACE FUNCTION public.consume_monthly_feature_quota(
  p_user_id uuid,
  p_feature text,
  p_limit integer,
  p_amount integer DEFAULT 1
)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_month date := date_trunc('month', timezone('utc', now()))::date;
  v_limit integer := GREATEST(COALESCE(p_limit, 0), 0);
  v_amount integer := GREATEST(COALESCE(p_amount, 1), 1);
  v_used integer;
BEGIN
  IF v_limit <= 0 THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'used', 0,
      'remaining', 0,
      'limit', v_limit
    );
  END IF;

  INSERT INTO public.monthly_feature_usage (user_id, feature, month_start, used)
  VALUES (p_user_id, p_feature, v_month, v_amount)
  ON CONFLICT (user_id, feature, month_start)
  DO UPDATE
    SET used = public.monthly_feature_usage.used + v_amount
  WHERE public.monthly_feature_usage.used + v_amount <= v_limit
  RETURNING used INTO v_used;

  IF v_used IS NOT NULL THEN
    RETURN jsonb_build_object(
      'allowed', true,
      'used', v_used,
      'remaining', GREATEST(v_limit - v_used, 0),
      'limit', v_limit
    );
  END IF;

  SELECT used INTO v_used
  FROM public.monthly_feature_usage
  WHERE user_id = p_user_id
    AND feature = p_feature
    AND month_start = v_month;

  RETURN jsonb_build_object(
    'allowed', false,
    'used', COALESCE(v_used, 0),
    'remaining', GREATEST(v_limit - COALESCE(v_used, 0), 0),
    'limit', v_limit
  );
END;
$$;
