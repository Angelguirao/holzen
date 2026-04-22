-- Extend monthly feature quota enum/check to include user-triggered insights generation.

ALTER TABLE public.monthly_feature_usage
  DROP CONSTRAINT IF EXISTS monthly_feature_usage_feature_check;

ALTER TABLE public.monthly_feature_usage
  ADD CONSTRAINT monthly_feature_usage_feature_check
  CHECK (feature IN ('premium_companion', 'wallpaper', 'reflection_insights'));
