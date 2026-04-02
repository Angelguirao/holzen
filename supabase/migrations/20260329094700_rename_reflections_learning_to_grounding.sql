-- Ground companion payload on reflections: align names with profiles.companion_grounding and orchestrator "grounding".
-- Runs before 20260329094842_view_v_reflection_with_companions.sql (that view selects grounding_*).
-- Idempotent: safe if columns were already renamed (e.g. from a DB that applied the historical 20260329150000 migration).

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reflections' AND column_name = 'learning_title'
  ) THEN
    ALTER TABLE public.reflections RENAME COLUMN learning_title TO grounding_title;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reflections' AND column_name = 'learning_body'
  ) THEN
    ALTER TABLE public.reflections RENAME COLUMN learning_body TO grounding_body;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reflections' AND column_name = 'learning_citation'
  ) THEN
    ALTER TABLE public.reflections RENAME COLUMN learning_citation TO grounding_citation;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reflections' AND column_name = 'learning_url'
  ) THEN
    ALTER TABLE public.reflections RENAME COLUMN learning_url TO grounding_url;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reflections' AND column_name = 'learning_read'
  ) THEN
    ALTER TABLE public.reflections RENAME COLUMN learning_read TO grounding_read;
  END IF;
END $$;
