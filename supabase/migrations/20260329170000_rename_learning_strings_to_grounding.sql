-- Align library and signal catalog with product language: "grounding" (not "learning") for the Ground companion / behavioral sources.

UPDATE public.library_items SET source_type = 'grounding' WHERE source_type = 'learning';

UPDATE public.signal_sources SET category = 'grounding' WHERE category = 'learning';

UPDATE public.user_signal_preferences SET category = 'grounding' WHERE category = 'learning';
