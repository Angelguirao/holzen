-- Runtime tuning for pregenerate-companions need-based top-up (no redeploy).
-- Edge: `loadAppConfig` → `pregenerate_cache_topup`; Admin → Tools.

INSERT INTO public.app_config (key, value, description) VALUES
  (
    'pregenerate_cache_topup',
    jsonb_build_object(
      'ground_nudge', jsonb_build_object('minHealthyRows', 18, 'maxGeneratePerRun', 2),
      'signal', jsonb_build_object('minHealthyRows', 12, 'maxGeneratePerRun', 1),
      'historical_insight', jsonb_build_object('minHealthyRows', 12, 'maxGeneratePerRun', 1),
      'zoom_out_deep_time', jsonb_build_object('minHealthyRows', 10, 'maxGeneratePerRun', 1)
    ),
    'Pregenerate companions: min count of healthy (quality≥2, non-expired) en rows per type before skipping; max new rows per cron per type.'
  )
ON CONFLICT (key) DO NOTHING;
