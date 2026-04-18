-- Adds `prompt_version` to companion_cache so generators can hard-invalidate
-- the cache when the prompt/seed/quality-rule pool changes, without having to
-- TRUNCATE or manually DELETE rows.
--
-- Why this exists: zoom_out_deep_time was bumped from v2 -> v3 in code, but
-- nothing used that constant to filter cache reads. Old v2 rows kept scoring
-- ≥2 on quality and getting served ("same item from cache" complaint) even
-- when the current v3 prompt would never produce them. Signal, Grounding, and
-- History have the same latent drift risk.
--
-- Behaviour (cache.ts): when `serveFromCache` is called with
-- `promptVersion: "vN"`, it filters to rows where `prompt_version = 'vN'`.
-- Rows written before this migration (or without a passed `promptVersion`)
-- have NULL and are ignored by the strict filter — which is the whole point
-- (they were written under an older prompt). Callers that don't pass
-- `promptVersion` keep the existing behaviour (no filter), so opt-in per
-- generator.

ALTER TABLE public.companion_cache
  ADD COLUMN IF NOT EXISTS prompt_version text;

COMMENT ON COLUMN public.companion_cache.prompt_version IS
  'Generator PROMPT_VERSION at time of insert (e.g. "v4"). Filtered by serveFromCache when the generator passes `promptVersion` so stale rows from earlier prompt revisions stop being served.';

-- Supports the strict-filter read path without a full table scan.
CREATE INDEX IF NOT EXISTS idx_companion_cache_type_lang_prompt
  ON public.companion_cache (companion_type, language, prompt_version);
