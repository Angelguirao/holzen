-- ============================================================================
-- Pause V2 — Phase A, part 2: event-sourced step + companion tables
--
-- Append-only event logs driving the state machine. Every user action in a
-- pause flow (breath, mood, outcome, note, tag, favorite) lands here as a
-- `pause_step_events` row; every companion open/complete lands in
-- `pause_companion_events`. The transition engine in Phase A part 4 reads
-- these logs to decide state flips.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- pause_step_type
-- ---------------------------------------------------------------------------
-- Kept as an enum for integrity + index shape. Extending later is a safe
-- `ALTER TYPE … ADD VALUE …` migration (not in-use check required).

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pause_step_type') THEN
    CREATE TYPE public.pause_step_type AS ENUM (
      'breath_completed',
      'initial_emotion_logged',
      'reflection_step',
      'shift_emotion_logged',
      'outcome_logged',
      'note_updated',
      'tag_updated',
      'favorite_toggled'
    );
  END IF;
END$$;

-- ---------------------------------------------------------------------------
-- pause_step_events — append-only
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.pause_step_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pause_instance_id uuid NOT NULL REFERENCES public.pause_instances(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  step_type public.pause_step_type NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.pause_step_events IS
  'Append-only log of user step actions inside a pause. Transition engine '
  'reads this to decide engaged/completed flips. See docs/systems/pause-system.md.';

CREATE INDEX IF NOT EXISTS idx_pause_step_events_pause
  ON public.pause_step_events (pause_instance_id, step_type, created_at);

CREATE INDEX IF NOT EXISTS idx_pause_step_events_user_type_created
  ON public.pause_step_events (user_id, step_type, created_at DESC);

ALTER TABLE public.pause_step_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pause_step_events_owner_select ON public.pause_step_events;
CREATE POLICY pause_step_events_owner_select
  ON public.pause_step_events
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS pause_step_events_service_role_write ON public.pause_step_events;
CREATE POLICY pause_step_events_service_role_write
  ON public.pause_step_events
  FOR ALL
  USING (auth.role() = 'service_role');

-- ---------------------------------------------------------------------------
-- pause_companion_action
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pause_companion_action') THEN
    CREATE TYPE public.pause_companion_action AS ENUM ('open','complete');
  END IF;
END$$;

-- ---------------------------------------------------------------------------
-- pause_companion_events — append-only
-- ---------------------------------------------------------------------------
-- pause_instance_id is nullable because a companion can be opened outside an
-- active pause (e.g. browsing library). In that case counts_for_pause=false
-- with non_counting_reason='no_active_pause'.

CREATE TABLE IF NOT EXISTS public.pause_companion_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pause_instance_id uuid REFERENCES public.pause_instances(id) ON DELETE SET NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  companion_type text NOT NULL,
  action public.pause_companion_action NOT NULL,
  entry_point text NOT NULL,
  counts_for_pause boolean NOT NULL DEFAULT false,
  non_counting_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  -- counts_for_pause=true implies no non_counting_reason
  CONSTRAINT pause_companion_events_count_coherence CHECK (
    (counts_for_pause = true AND non_counting_reason IS NULL)
    OR counts_for_pause = false
  )
);

COMMENT ON TABLE public.pause_companion_events IS
  'Append-only log of companion open/complete events. counts_for_pause=true '
  'feeds the completion gate of the paired pause instance; global completions '
  '(counts_for_pause=false) power discovery/usage analytics.';

CREATE INDEX IF NOT EXISTS idx_pause_companion_events_pause
  ON public.pause_companion_events (pause_instance_id, companion_type, action, created_at);

CREATE INDEX IF NOT EXISTS idx_pause_companion_events_user_type_created
  ON public.pause_companion_events (user_id, companion_type, created_at DESC);

-- Fast "did this companion already count for this instance?" check.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_pause_companion_counted_per_instance
  ON public.pause_companion_events (pause_instance_id, companion_type)
  WHERE action = 'complete' AND counts_for_pause = true;

ALTER TABLE public.pause_companion_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pause_companion_events_owner_select ON public.pause_companion_events;
CREATE POLICY pause_companion_events_owner_select
  ON public.pause_companion_events
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS pause_companion_events_service_role_write ON public.pause_companion_events;
CREATE POLICY pause_companion_events_service_role_write
  ON public.pause_companion_events
  FOR ALL
  USING (auth.role() = 'service_role');
