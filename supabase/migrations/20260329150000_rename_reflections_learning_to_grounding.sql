-- Ground companion payload on reflections: align names with profiles.companion_grounding and orchestrator "grounding".

ALTER TABLE public.reflections RENAME COLUMN learning_title TO grounding_title;
ALTER TABLE public.reflections RENAME COLUMN learning_body TO grounding_body;
ALTER TABLE public.reflections RENAME COLUMN learning_citation TO grounding_citation;
ALTER TABLE public.reflections RENAME COLUMN learning_url TO grounding_url;
ALTER TABLE public.reflections RENAME COLUMN learning_read TO grounding_read;
