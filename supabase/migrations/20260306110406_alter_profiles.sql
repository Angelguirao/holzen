-- Companion preferences on profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS companion_breathing boolean NOT NULL DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS companion_haiku boolean NOT NULL DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS companion_learning boolean NOT NULL DEFAULT true;

-- Companion content on reflections
ALTER TABLE public.reflections ADD COLUMN IF NOT EXISTS haiku text;
ALTER TABLE public.reflections ADD COLUMN IF NOT EXISTS learning_title text;
ALTER TABLE public.reflections ADD COLUMN IF NOT EXISTS learning_body text;