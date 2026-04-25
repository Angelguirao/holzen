-- ============================================================================
-- companion_serves.pause_instance_id (additive) and dependency columns on
-- other legacy tables that edge code will stop populating before the
-- destructive cutover migration runs.
--
-- These columns are added now so the edge functions compiled in the same
-- branch can UPSERT pause_instance_id without the destructive migration
-- having landed yet. The destructive migration (commit 7) drops the paired
-- legacy reflection_id columns.
-- ============================================================================

-- companion_serves
ALTER TABLE public.companion_serves
  ADD COLUMN IF NOT EXISTS pause_instance_id uuid
    REFERENCES public.pause_instances(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_companion_serves_pause_instance
  ON public.companion_serves (pause_instance_id)
  WHERE pause_instance_id IS NOT NULL;

-- library_items: mirror of the existing reflection_id key for V2.
ALTER TABLE public.library_items
  ADD COLUMN IF NOT EXISTS pause_instance_id uuid
    REFERENCES public.pause_instances(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_library_items_pause_instance
  ON public.library_items (pause_instance_id)
  WHERE pause_instance_id IS NOT NULL;

-- Unique (user, pause_instance, source_type) mirror.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_library_items_user_pause_source
  ON public.library_items (user_id, pause_instance_id, source_type)
  WHERE pause_instance_id IS NOT NULL;

-- generation_attempts
ALTER TABLE public.generation_attempts
  ADD COLUMN IF NOT EXISTS pause_instance_id uuid;
