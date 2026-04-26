ALTER TABLE public.practice_entries
  ADD COLUMN IF NOT EXISTS pause_instance_id uuid REFERENCES public.pause_instances(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_practice_entries_pause_instance_id
  ON public.practice_entries(pause_instance_id)
  WHERE pause_instance_id IS NOT NULL;