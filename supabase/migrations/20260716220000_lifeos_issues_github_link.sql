-- LEGACY MIRROR — do not add new LifeOS migrations in holzen/.
-- Canonical: personal-agent/deploy/supabase/migrations/
-- See holzen/supabase/LIFEOS-LEGACY.md and personal-agent/deploy/LIFEOS-SUPABASE.md
--
-- Pluggable GitHub execution adapter — Mesh stays ontology SoT.

alter table public.lifeos_issues
  add column if not exists github_issue_url text,
  add column if not exists github_issue_number integer;

comment on column public.lifeos_issues.github_issue_url is
  'Optional GitHub issue URL — execution adapter, not source of truth.';
comment on column public.lifeos_issues.github_issue_number is
  'Optional GitHub issue number — execution adapter, not source of truth.';
