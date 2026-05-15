-- Pause archive lists are driven by `v_pause_full`. Drop legacy library-item archive views and RPC.

DROP FUNCTION IF EXISTS public.library_archive_list_page(
  text, boolean, text, text, text[], uuid[], text, boolean, int, bigint
);

DROP VIEW IF EXISTS public.library_archive_echo_items CASCADE;
DROP VIEW IF EXISTS public.library_archive_pauses_tab_items CASCADE;

CREATE OR REPLACE VIEW public.v_pause_archive_pauses AS
SELECT vf.*
FROM public.v_pause_full vf
WHERE vf.state NOT IN ('active', 'engaged', 'pending')
  AND NOT (
    (
      vf.state = 'expired'
      AND vf.engaged_at IS NULL
      AND vf.expired_reason IS DISTINCT FROM 'superseded'::public.pause_expired_reason
    )
    OR (vf.state = 'dismissed' AND vf.engaged_at IS NULL)
  );

ALTER VIEW public.v_pause_archive_pauses SET (security_invoker = true);
COMMENT ON VIEW public.v_pause_archive_pauses IS
  'Archive Pauses tab: v_pause_full rows excluding open states and echo-only instances.';
GRANT SELECT ON public.v_pause_archive_pauses TO authenticated;
GRANT SELECT ON public.v_pause_archive_pauses TO service_role;

CREATE OR REPLACE VIEW public.v_pause_archive_echoes AS
SELECT vf.*
FROM public.v_pause_full vf
WHERE vf.state NOT IN ('active', 'engaged', 'pending')
  AND vf.engaged_at IS NULL
  AND (
    vf.state = 'dismissed'
    OR (
      vf.state = 'expired'
      AND vf.expired_reason IS DISTINCT FROM 'superseded'::public.pause_expired_reason
    )
  );

ALTER VIEW public.v_pause_archive_echoes SET (security_invoker = true);
COMMENT ON VIEW public.v_pause_archive_echoes IS
  'Archive Echoes tab: v_pause_full echo-eligible instances (terminal, never engaged).';
GRANT SELECT ON public.v_pause_archive_echoes TO authenticated;
GRANT SELECT ON public.v_pause_archive_echoes TO service_role;

-- Collections reference pause instances directly.
SET search_path = public;

ALTER TABLE public.collection_items
  ADD COLUMN IF NOT EXISTS pause_instance_id uuid REFERENCES public.pause_instances(id) ON DELETE CASCADE;

UPDATE public.collection_items ci
SET pause_instance_id = li.pause_instance_id
FROM public.library_items li
WHERE li.id = ci.library_item_id
  AND li.pause_instance_id IS NOT NULL;

DELETE FROM public.collection_items WHERE pause_instance_id IS NULL;

ALTER TABLE public.collection_items DROP CONSTRAINT IF EXISTS collection_items_library_item_id_fkey;
DROP INDEX IF EXISTS idx_collection_items_library;
ALTER TABLE public.collection_items DROP COLUMN IF EXISTS library_item_id;
ALTER TABLE public.collection_items ALTER COLUMN pause_instance_id SET NOT NULL;
ALTER TABLE public.collection_items DROP CONSTRAINT IF EXISTS collection_items_collection_id_library_item_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS collection_items_collection_pause_uniq
  ON public.collection_items (collection_id, pause_instance_id);
CREATE INDEX IF NOT EXISTS idx_collection_items_pause_instance ON public.collection_items (pause_instance_id);

-- `library_items` is dropped in 20260509140000_collection_items_pause_instance_drop_library_items.sql
-- after archive RPCs/views are migrated off the table.