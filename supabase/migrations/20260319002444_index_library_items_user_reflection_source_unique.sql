-- Delete duplicate library_items, keeping the earliest entry per (user_id, reflection_id, source_type)
DELETE FROM public.library_items
WHERE id IN (
  SELECT unnest(ids[2:]) FROM (
    SELECT array_agg(id ORDER BY created_at ASC) as ids
    FROM public.library_items
    WHERE reflection_id IS NOT NULL AND source_type IS NOT NULL
    GROUP BY user_id, reflection_id, source_type
    HAVING count(*) > 1
  ) dupes
);

-- Add unique index to prevent future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_library_items_user_reflection_source
ON public.library_items (user_id, reflection_id, source_type)
WHERE reflection_id IS NOT NULL AND source_type IS NOT NULL;