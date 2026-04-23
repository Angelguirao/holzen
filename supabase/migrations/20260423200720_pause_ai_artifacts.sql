-- ============================================================================
-- Pause V2 — Phase A, part 3: AI artifacts tied to a pause instance
--
-- Replaces the role of `reflections.message / haiku / signal_* / …` and
-- `reflection_companions` for the live-runtime pipeline. One row per
-- (instance, kind). Kinds are open-ended text to avoid re-migrating when a
-- new companion type appears.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.pause_ai_artifacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pause_instance_id uuid NOT NULL REFERENCES public.pause_instances(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL,                     -- 'reflection_text' | 'haiku' | 'signal' | 'ground_nudge' | 'historical_insight' | 'zoom_out' | 'zoom_out_deep_time' | ...
  content jsonb NOT NULL,                 -- free-form per kind (title/body/source/url/etc.)
  model text,
  prompt_version text,
  cache_entry_id uuid REFERENCES public.companion_cache(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pause_ai_artifacts_kind_nonempty CHECK (length(trim(kind)) > 0),
  CONSTRAINT pause_ai_artifacts_unique_per_instance UNIQUE (pause_instance_id, kind)
);

COMMENT ON TABLE public.pause_ai_artifacts IS
  'AI-generated content attached to a pause instance. One row per (instance, '
  'kind). Kinds: reflection_text, haiku, signal, ground_nudge, historical_insight, '
  'zoom_out. See docs/systems/pause-system.md.';

CREATE INDEX IF NOT EXISTS idx_pause_ai_artifacts_instance
  ON public.pause_ai_artifacts (pause_instance_id);

CREATE INDEX IF NOT EXISTS idx_pause_ai_artifacts_user_kind_created
  ON public.pause_ai_artifacts (user_id, kind, created_at DESC);

ALTER TABLE public.pause_ai_artifacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pause_ai_artifacts_owner_select ON public.pause_ai_artifacts;
CREATE POLICY pause_ai_artifacts_owner_select
  ON public.pause_ai_artifacts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS pause_ai_artifacts_service_role_write ON public.pause_ai_artifacts;
CREATE POLICY pause_ai_artifacts_service_role_write
  ON public.pause_ai_artifacts
  FOR ALL
  USING (auth.role() = 'service_role');
