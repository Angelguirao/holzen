-- LEGACY MIRROR — do not add new LifeOS migrations in holzen/.
-- Canonical: personal-agent/deploy/supabase/migrations/
-- See holzen/supabase/LIFEOS-LEGACY.md and personal-agent/deploy/LIFEOS-SUPABASE.md
--
-- One active LifeOS run per venture (Paperclip-style mutex).
-- Skip on holzen-prod after drop_legacy_lifeos_tables_from_holzen_prod.

do $$
begin
  if to_regclass('public.lifeos_runs') is null then
    return;
  end if;

  CREATE UNIQUE INDEX IF NOT EXISTS lifeos_runs_one_active_per_venture
    ON public.lifeos_runs (venture_id)
    WHERE status IN ('queued', 'running');

  COMMENT ON INDEX public.lifeos_runs_one_active_per_venture IS
    'Hard mutex: at most one queued/running lifeos_run per venture.';
end $$;
