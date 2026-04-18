ALTER TABLE public.companion_cache
  ADD COLUMN IF NOT EXISTS prompt_version text;

COMMENT ON COLUMN public.companion_cache.prompt_version IS
  'Generator PROMPT_VERSION at time of insert (e.g. "v4"). Filtered by serveFromCache when the generator passes `promptVersion` so stale rows from earlier prompt revisions stop being served.';

CREATE INDEX IF NOT EXISTS idx_companion_cache_type_lang_prompt
  ON public.companion_cache (companion_type, language, prompt_version);