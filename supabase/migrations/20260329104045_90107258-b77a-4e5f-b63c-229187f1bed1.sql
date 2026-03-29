DROP INDEX IF EXISTS idx_library_items_user_reflection_source;
CREATE UNIQUE INDEX idx_library_items_user_reflection_source ON public.library_items (user_id, reflection_id, source_type);