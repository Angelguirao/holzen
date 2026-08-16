-- LEGACY MIRROR — do not add new LifeOS migrations in holzen/.
-- Canonical: personal-agent/deploy/supabase/migrations/
-- See holzen/supabase/LIFEOS-LEGACY.md and personal-agent/deploy/LIFEOS-SUPABASE.md
--
-- Mesh ontology bridge: Work Items parented under folio Initiative + Experiment.
-- Skip on holzen-prod after drop_legacy_lifeos_tables_from_holzen_prod.

do $$
begin
  if to_regclass('public.lifeos_issues') is null then
    return;
  end if;

  alter table public.lifeos_issues
    add column if not exists folio_project_id text,
    add column if not exists folio_experiment_id text;

  create index if not exists lifeos_issues_by_folio_experiment
    on public.lifeos_issues (venture_id, folio_experiment_id)
    where folio_experiment_id is not null;

  comment on column public.lifeos_issues.folio_project_id is
    'Folio PrivateProject.id (Initiative) this Work Item serves.';
  comment on column public.lifeos_issues.folio_experiment_id is
    'Folio PrivateExperiment.id this Work Item is parented under.';
end $$;
