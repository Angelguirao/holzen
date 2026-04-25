-- ============================================================================
-- Pause V2 — Phase A, part 1: types, templates, instances, unique-active index
--
-- This migration is PURELY ADDITIVE. It introduces the new canonical model
-- (`pause_templates`, `pause_instances`) alongside the legacy `reflections`
-- table. Nothing reads or writes from these tables yet; Phases B–F wire
-- them in, Phase J cuts over, Phase L removes the legacy path.
--
-- See docs/systems/pause-system.md (added in this phase) for the full
-- contract; see /opt/cursor/artifacts/PLAN.md §2 for rationale.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Enum types
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pause_state') THEN
    CREATE TYPE public.pause_state AS ENUM (
      'active',    -- created and actionable
      'engaged',   -- meaningful start gates met
      'completed', -- strict full completion gates + counted companion(s) met
      'dismissed', -- user intentionally ended
      'expired'    -- invalidated by context/time/system (terminal)
    );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pause_expired_reason') THEN
    CREATE TYPE public.pause_expired_reason AS ENUM (
      'context_lost',          -- market context that justified the pause is gone
      'window_elapsed',        -- window_ms rolled over before completion
      'superseded',            -- a newer instance took over (reserved; see context_lost+superseded_by)
      'ineligible_user_state', -- user became ineligible (snoozed, deleted, etc.)
      'system_cancelled'       -- admin or subsystem cancelled
    );
  END IF;
END$$;

-- ---------------------------------------------------------------------------
-- 2. pause_templates — per-template completion contract + window
-- ---------------------------------------------------------------------------
-- One row per kind of pause. Completion rules live in data, not code, so the
-- server transition engine and the client optimistic-UI helper read the same
-- source of truth. See PLAN.md §2.1.

CREATE TABLE IF NOT EXISTS public.pause_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  version int NOT NULL DEFAULT 1,
  window_ms bigint NOT NULL,
  required_for_engaged text[] NOT NULL,
  required_for_completed text[] NOT NULL,
  allowed_companion_types text[] NOT NULL,
  required_companion_count int NOT NULL DEFAULT 1,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pause_templates_window_positive CHECK (window_ms > 0),
  CONSTRAINT pause_templates_companion_count_nonneg CHECK (required_companion_count >= 0)
);

COMMENT ON TABLE public.pause_templates IS
  'Per-template pause contract. Rows are configuration: the transition engine '
  'reads required_for_engaged / required_for_completed / required_companion_count '
  'to decide state flips. See docs/systems/pause-system.md.';

-- Read-only for all authenticated users (templates are public config); only
-- service_role writes.
ALTER TABLE public.pause_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pause_templates_read ON public.pause_templates;
CREATE POLICY pause_templates_read
  ON public.pause_templates
  FOR SELECT
  TO authenticated
  USING (active = true);

DROP POLICY IF EXISTS pause_templates_service_role_write ON public.pause_templates;
CREATE POLICY pause_templates_service_role_write
  ON public.pause_templates
  FOR ALL
  USING (auth.role() = 'service_role');

-- ---------------------------------------------------------------------------
-- 3. pause_instances — state machine row
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.pause_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id uuid NOT NULL REFERENCES public.pause_templates(id) ON DELETE RESTRICT,
  state public.pause_state NOT NULL DEFAULT 'active',
  source text NOT NULL,                  -- 'manual' | 'cron_volatility' | 'admin_seed' | …
  context_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  context_rule_result jsonb NOT NULL DEFAULT '{}'::jsonb,
  context_fingerprint text NOT NULL,     -- hash of regime-relevant context; dedupes cron fires
  window_starts_at timestamptz NOT NULL DEFAULT now(),
  window_ends_at  timestamptz NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  engaged_at   timestamptz,
  completed_at timestamptz,
  terminal_at  timestamptz,
  expired_reason public.pause_expired_reason,
  superseded_by uuid REFERENCES public.pause_instances(id) ON DELETE SET NULL,
  dismissed_by_user boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- Temporal invariants:
  -- * window_ends_at must be strictly after window_starts_at;
  -- * state='active' must have engaged_at IS NULL; state='engaged' must
  --   have engaged_at set; state='completed' must have both engaged_at
  --   and completed_at set; dismissed/expired may have either depending
  --   on whether the instance was engaged before ending;
  -- * terminal_at is set iff state is terminal (completed|dismissed|expired);
  -- * expired_reason is set iff state='expired'.
  CONSTRAINT pause_instances_window_bounds CHECK (window_ends_at > window_starts_at),
  CONSTRAINT pause_instances_active_no_engaged CHECK (
    state <> 'active' OR engaged_at IS NULL
  ),
  CONSTRAINT pause_instances_engaged_has_engaged_at CHECK (
    state <> 'engaged' OR engaged_at IS NOT NULL
  ),
  CONSTRAINT pause_instances_completed_ts CHECK (
    (state = 'completed' AND completed_at IS NOT NULL AND engaged_at IS NOT NULL)
    OR (state <> 'completed' AND completed_at IS NULL)
  ),
  CONSTRAINT pause_instances_terminal_ts CHECK (
    (state IN ('completed','dismissed','expired') AND terminal_at IS NOT NULL)
    OR (state IN ('active','engaged') AND terminal_at IS NULL)
  ),
  CONSTRAINT pause_instances_expired_reason_shape CHECK (
    (state = 'expired' AND expired_reason IS NOT NULL)
    OR (state <> 'expired' AND expired_reason IS NULL)
  )
);

COMMENT ON TABLE public.pause_instances IS
  'Canonical pause row. One per "moment that warranted a pause". The unique '
  'partial index on (user_id) WHERE state IN (active, engaged) enforces '
  '"exactly one open pause per user". See docs/systems/pause-system.md.';

-- The core invariant: exactly one open pause per user.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_pause_per_user
  ON public.pause_instances (user_id)
  WHERE state IN ('active','engaged');

-- Common query shapes
CREATE INDEX IF NOT EXISTS idx_pause_instances_user_state_created
  ON public.pause_instances (user_id, state, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pause_instances_user_completed_at
  ON public.pause_instances (user_id, completed_at DESC)
  WHERE state = 'completed';

-- Sweeper support: find open instances whose window has elapsed.
CREATE INDEX IF NOT EXISTS idx_pause_instances_window_open
  ON public.pause_instances (window_ends_at)
  WHERE state IN ('active','engaged');

-- Fingerprint lookup for cron dedupe (latest per user).
CREATE INDEX IF NOT EXISTS idx_pause_instances_user_fingerprint_recent
  ON public.pause_instances (user_id, context_fingerprint, created_at DESC);

-- RLS
ALTER TABLE public.pause_instances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pause_instances_owner_select ON public.pause_instances;
CREATE POLICY pause_instances_owner_select
  ON public.pause_instances
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Client INSERT/UPDATE/DELETE go through RPCs (pause_create_manual, etc.) in
-- Phase B. We intentionally do not add an authenticated write policy.
DROP POLICY IF EXISTS pause_instances_service_role_write ON public.pause_instances;
CREATE POLICY pause_instances_service_role_write
  ON public.pause_instances
  FOR ALL
  USING (auth.role() = 'service_role');
