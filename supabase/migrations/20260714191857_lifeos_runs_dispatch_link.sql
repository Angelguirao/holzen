-- LEGACY MIRROR — do not add new LifeOS migrations in holzen/.
-- Canonical: personal-agent/deploy/supabase/migrations/
-- See holzen/supabase/LIFEOS-LEGACY.md and personal-agent/deploy/LIFEOS-SUPABASE.md
--
-- Link PersonalOS runs to dispatch execution (action + job ids).

alter table public.lifeos_runs
  add column if not exists action_id text,
  add column if not exists dispatch_job_id text;

comment on column public.lifeos_runs.action_id is 'Dispatch actionId — issue UUID for issue runs.';
comment on column public.lifeos_runs.dispatch_job_id is 'Dispatch job id once execution starts or settles.';

update public.lifeos_runs
set action_id = issue_id::text
where action_id is null and issue_id is not null;

create index if not exists lifeos_runs_dispatch_job_id_idx
  on public.lifeos_runs (venture_id, dispatch_job_id)
  where dispatch_job_id is not null;

create index if not exists lifeos_runs_action_id_idx
  on public.lifeos_runs (venture_id, action_id)
  where action_id is not null;
