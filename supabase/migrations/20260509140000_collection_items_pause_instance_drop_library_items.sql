-- Collections reference pause instances directly. Drop `library_items` (no bookmark table).

SET search_path = public;

ALTER TABLE public.collection_items
  ADD COLUMN IF NOT EXISTS pause_instance_id uuid REFERENCES public.pause_instances(id) ON DELETE CASCADE;

UPDATE public.collection_items ci
SET pause_instance_id = li.pause_instance_id
FROM public.library_items li
WHERE li.id = ci.library_item_id
  AND li.pause_instance_id IS NOT NULL;

-- Non-pause rows (no instance) are dropped — not supported anymore.
DELETE FROM public.collection_items WHERE pause_instance_id IS NULL;

ALTER TABLE public.collection_items DROP CONSTRAINT IF EXISTS collection_items_library_item_id_fkey;

DROP INDEX IF EXISTS idx_collection_items_library;

ALTER TABLE public.collection_items DROP COLUMN IF EXISTS library_item_id;

ALTER TABLE public.collection_items ALTER COLUMN pause_instance_id SET NOT NULL;

ALTER TABLE public.collection_items DROP CONSTRAINT IF EXISTS collection_items_collection_id_library_item_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS collection_items_collection_pause_uniq
  ON public.collection_items (collection_id, pause_instance_id);

CREATE INDEX IF NOT EXISTS idx_collection_items_pause_instance ON public.collection_items (pause_instance_id);

DROP TABLE IF EXISTS public.library_items CASCADE;
