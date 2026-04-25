-- ============================================================================
-- Pause V2 — Phase A, part 6: seed the default `volatility_v1` template
--
-- Completion contract (from PLAN.md §4):
--   engaged   = breath_completed + initial_emotion_logged
--   completed = engaged gates + shift_emotion_logged + outcome_logged
--               + required_companion_count >= 1
--               (allowed companions: signal, ground_nudge, historical_insight,
--                zoom_out, zoom_out_deep_time, haiku)
--   window_ms = 6 hours (21_600_000 ms) — user-confirmed default.
-- ============================================================================

INSERT INTO public.pause_templates (
  slug,
  version,
  window_ms,
  required_for_engaged,
  required_for_completed,
  allowed_companion_types,
  required_companion_count,
  config,
  active
)
VALUES (
  'volatility_v1',
  1,
  21600000, -- 6 hours
  ARRAY['breath_completed','initial_emotion_logged']::text[],
  ARRAY['breath_completed','initial_emotion_logged','shift_emotion_logged','outcome_logged']::text[],
  ARRAY['signal','ground_nudge','historical_insight','zoom_out','zoom_out_deep_time','haiku']::text[],
  1,
  jsonb_build_object(
    'description', 'Volatility-driven pause. Default template for manual and cron pauses.',
    'surface', 'bell + home + library'
  ),
  true
)
ON CONFLICT (slug) DO NOTHING;
