-- `recordLibraryServe` stores content_library.id in cache_entry_id (same column as
-- companion_cache hits). The FK to companion_cache only rejected those rows, so
-- per-user library freshness never persisted. Drop the FK; values are still UUIDs.

ALTER TABLE public.user_companion_serves
  DROP CONSTRAINT IF EXISTS user_companion_serves_cache_entry_id_fkey;

COMMENT ON COLUMN public.user_companion_serves.cache_entry_id IS
  'Served artifact id: companion_cache.id for cache, or content_library.id for catalog (dedupe / freshness; no FK).';
