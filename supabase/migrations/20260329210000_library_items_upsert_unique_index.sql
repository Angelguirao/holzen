-- PostgREST / supabase-js upsert sends ON CONFLICT (user_id, reflection_id, source_type)
-- with no predicate. PostgreSQL cannot infer a PARTIAL unique index for that (42P10:
-- "there is no unique or exclusion constraint matching the ON CONFLICT specification").
-- Replace with a full unique index on the same columns. Under default NULL behavior,
-- multiple rows with the same (user_id, NULL, source_type) remain allowed.

DROP INDEX IF EXISTS idx_library_items_user_reflection_source;

DELETE FROM public.library_items
WHERE id IN (
  SELECT unnest(ids[2:]) FROM (
    SELECT array_agg(id ORDER BY created_at ASC) AS ids
    FROM public.library_items
    WHERE reflection_id IS NOT NULL AND source_type IS NOT NULL
    GROUP BY user_id, reflection_id, source_type
    HAVING count(*) > 1
  ) dupes
);

CREATE UNIQUE INDEX idx_library_items_user_reflection_source
  ON public.library_items (user_id, reflection_id, source_type);
