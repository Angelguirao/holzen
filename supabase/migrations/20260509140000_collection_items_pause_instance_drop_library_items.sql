-- Drop `library_items` after collections use `pause_instance_id` only.
-- The `collection_items` cutover (add column, backfill from `library_items`, drop
-- `library_item_id`, indexes, NOT NULL) runs in
-- 20260502185309_45534479-fa98-4192-913e-b2f180481c53.sql — do not duplicate it here
-- or a fresh reset fails on missing `ci.library_item_id`.

SET search_path = public;

DROP TABLE IF EXISTS public.library_items CASCADE;
