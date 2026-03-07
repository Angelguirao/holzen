ALTER TABLE public.reflections 
  ADD COLUMN breathing_completed boolean NOT NULL DEFAULT false,
  ADD COLUMN haiku_read boolean NOT NULL DEFAULT false,
  ADD COLUMN learning_read boolean NOT NULL DEFAULT false;