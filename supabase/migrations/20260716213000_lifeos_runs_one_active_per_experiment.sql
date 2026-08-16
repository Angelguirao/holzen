-- LEGACY MIRROR — do not add new LifeOS migrations in holzen/.
-- Canonical: personal-agent/deploy/supabase/migrations/
-- See holzen/supabase/LIFEOS-LEGACY.md and personal-agent/deploy/LIFEOS-SUPABASE.md
--
-- Re-scope one-active mutex from venture → experiment (Mesh ontology P6).
-- Skip on holzen-prod after drop_legacy_lifeos_tables_from_holzen_prod.

do $$
begin
  if to_regclass('public.lifeos_runs') is null then
    return;
  end if;

  alter table public.lifeos_runs
    add column if not exists folio_experiment_id text;

  comment on column public.lifeos_runs.folio_experiment_id is
    'Folio PrivateExperiment.id this cycle serves; copied from lifeos_issues at enqueue.';

  drop index if exists public.lifeos_runs_one_active_per_venture;

  create unique index if not exists lifeos_runs_one_active_per_experiment
    on public.lifeos_runs (venture_id, folio_experiment_id)
    where status in ('queued', 'running', 'awaiting_approval')
      and folio_experiment_id is not null;

  create unique index if not exists lifeos_runs_one_active_unparented
    on public.lifeos_runs (venture_id)
    where status in ('queued', 'running', 'awaiting_approval')
      and folio_experiment_id is null;

  comment on index public.lifeos_runs_one_active_per_experiment is
    'Hard mutex: at most one active lifeos_run per venture+experiment.';
  comment on index public.lifeos_runs_one_active_unparented is
    'Hard mutex: at most one unparented active lifeos_run per venture.';
end $$;
