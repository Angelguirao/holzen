-- ============================================================================
-- Pause V2 — Phase C: pause_v2_enabled feature flag in app_config
--
-- Adds the `pause_v2_enabled` key to `app_config.feature_flags` (default
-- FALSE). While false, every Phase C-wired edge function and Phase D-wired
-- client hook continues to use the legacy `reflections` path. Phase J flips
-- the flag to true; Phase L removes the flag (and every branch that reads
-- it) once the legacy path is gone.
--
-- Idempotent: only adds the key if absent.
-- ============================================================================

UPDATE public.app_config
   SET value = (
     COALESCE(value, '{}'::jsonb)
     || jsonb_build_object('pause_v2_enabled', false)
   ),
       updated_at = now()
 WHERE key = 'feature_flags'
   AND NOT (value ? 'pause_v2_enabled');

-- Self-check: ensure the row exists (paranoia — the base migration seeds it).
INSERT INTO public.app_config (key, value, description)
VALUES (
  'feature_flags',
  jsonb_build_object('pause_v2_enabled', false),
  'Per-feature on/off switches. Panic mode overrides companion flags regardless of these.'
)
ON CONFLICT (key) DO NOTHING;
