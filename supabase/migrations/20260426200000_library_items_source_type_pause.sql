-- Pause V2 IA: rename library_items.source_type values away from legacy "reflection" wording.
SET search_path = public;

UPDATE public.library_items
SET source_type = 'pause'
WHERE source_type = 'reflection';

UPDATE public.library_items
SET source_type = 'pause_note'
WHERE source_type = 'reflection_note';
