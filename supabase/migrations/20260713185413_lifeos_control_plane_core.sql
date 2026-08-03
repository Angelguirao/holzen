-- LEGACY MIRROR — do not add new LifeOS migrations in holzen/.
-- Canonical: personal-agent/deploy/supabase/migrations/
-- See holzen/supabase/LIFEOS-LEGACY.md and personal-agent/deploy/LIFEOS-SUPABASE.md
--
-- LifeOS venture control plane (PersonalOS /os/venture ledger).
-- Service role only — no anon/authenticated policies.

create extension if not exists "pgcrypto";

create table if not exists public.lifeos_ventures (
  id text primary key,
  name text not null,
  phase text,
  site_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lifeos_issues (
  id uuid primary key default gen_random_uuid(),
  venture_id text not null references public.lifeos_ventures (id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'todo',
  priority text,
  assignee_kind text,
  assignee_id text,
  assignee_label text,
  checkout_locked_at timestamptz,
  checkout_run_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists lifeos_issues_by_venture_status
  on public.lifeos_issues (venture_id, status);

create index if not exists lifeos_issues_by_assignee
  on public.lifeos_issues (venture_id, assignee_kind, assignee_id, status);

create table if not exists public.lifeos_runs (
  id uuid primary key default gen_random_uuid(),
  venture_id text not null references public.lifeos_ventures (id) on delete cascade,
  issue_id uuid references public.lifeos_issues (id) on delete set null,
  actor_kind text not null,
  actor_id text not null,
  actor_label text not null,
  status text not null default 'queued',
  started_at timestamptz,
  finished_at timestamptz,
  error text,
  cost_usd numeric,
  created_at timestamptz not null default now()
);

create index if not exists lifeos_runs_by_venture_created
  on public.lifeos_runs (venture_id, created_at desc);

create table if not exists public.lifeos_approvals (
  id uuid primary key default gen_random_uuid(),
  venture_id text not null references public.lifeos_ventures (id) on delete cascade,
  type text not null,
  status text not null default 'pending',
  requested_by_kind text not null,
  requested_by_id text not null,
  requested_by_label text not null,
  requested_at timestamptz not null default now(),
  decided_at timestamptz,
  note text,
  payload jsonb
);

create index if not exists lifeos_approvals_by_venture_status
  on public.lifeos_approvals (venture_id, status, type);

create table if not exists public.lifeos_cost_events (
  id uuid primary key default gen_random_uuid(),
  venture_id text not null references public.lifeos_ventures (id) on delete cascade,
  issue_id uuid references public.lifeos_issues (id) on delete set null,
  provider text,
  model text,
  input_tokens integer,
  output_tokens integer,
  cost_usd numeric not null,
  occurred_at timestamptz not null default now()
);

create index if not exists lifeos_cost_events_by_venture_time
  on public.lifeos_cost_events (venture_id, occurred_at desc);

create table if not exists public.lifeos_activity_log (
  id uuid primary key default gen_random_uuid(),
  venture_id text not null references public.lifeos_ventures (id) on delete cascade,
  actor_kind text not null,
  actor_id text not null,
  actor_label text not null,
  action text not null,
  entity_type text,
  entity_id text,
  details jsonb,
  created_at timestamptz not null default now()
);

create index if not exists lifeos_activity_by_venture_time
  on public.lifeos_activity_log (venture_id, created_at desc);

alter table public.lifeos_ventures enable row level security;
alter table public.lifeos_issues enable row level security;
alter table public.lifeos_runs enable row level security;
alter table public.lifeos_approvals enable row level security;
alter table public.lifeos_cost_events enable row level security;
alter table public.lifeos_activity_log enable row level security;

comment on table public.lifeos_ventures is 'Venture registry for PersonalOS entrepreneurship desk.';
comment on table public.lifeos_issues is 'Venture issues — checkout, assignee, lifecycle.';
comment on table public.lifeos_runs is 'Agent/human runs linked to issues and dispatch.';
comment on table public.lifeos_approvals is 'Human-in-the-loop approvals for venture work.';
comment on table public.lifeos_cost_events is 'Append-only AI/API cost ledger per venture.';
comment on table public.lifeos_activity_log is 'Audit timeline for venture desk events.';
