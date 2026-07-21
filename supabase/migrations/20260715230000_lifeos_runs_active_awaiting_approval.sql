-- LEGACY MIRROR — do not add new LifeOS migrations in holzen/.
-- Canonical: personal-agent/deploy/supabase/migrations/
-- See holzen/supabase/LIFEOS-LEGACY.md and personal-agent/deploy/LIFEOS-SUPABASE.md
--
-- Expand one-active mutex to include awaiting_approval (Paperclip gate).

DROP INDEX IF EXISTS public.lifeos_runs_one_active_per_venture;

CREATE UNIQUE INDEX lifeos_runs_one_active_per_venture
  ON public.lifeos_runs (venture_id)
  WHERE status IN ('queued', 'running', 'awaiting_approval');

COMMENT ON INDEX public.lifeos_runs_one_active_per_venture IS
  'Hard mutex: at most one queued/running/awaiting_approval lifeos_run per venture.';
