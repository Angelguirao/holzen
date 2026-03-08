
ALTER TABLE public.reflections
  ADD COLUMN IF NOT EXISTS zoom_out_data jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS history_insight_data jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS signal_read boolean NOT NULL DEFAULT false;
