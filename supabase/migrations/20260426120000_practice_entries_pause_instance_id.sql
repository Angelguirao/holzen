-- Pause V2: tie practice replay rows to pause_instances (replaces removed source_reflection_id).
SET search_path = public;

ALTER TABLE public.practice_entries
  ADD COLUMN IF NOT EXISTS pause_instance_id uuid REFERENCES public.pause_instances (id) ON DELETE CASCADE;

COMMENT ON COLUMN public.practice_entries.pause_instance_id IS
  'Optional link to a pause instance (required for type=replay thread; null for standalone check-in/journal/bodyscan).';

CREATE INDEX IF NOT EXISTS idx_practice_entries_user_pause_replay
  ON public.practice_entries (user_id, pause_instance_id)
  WHERE type = 'replay' AND pause_instance_id IS NOT NULL;

DROP POLICY IF EXISTS "Users can insert own practice entries" ON public.practice_entries;

CREATE POLICY "Users can insert own practice entries"
  ON public.practice_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (
      pause_instance_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.pause_instances pi
        WHERE pi.id = pause_instance_id
          AND pi.user_id = auth.uid()
      )
    )
  );
