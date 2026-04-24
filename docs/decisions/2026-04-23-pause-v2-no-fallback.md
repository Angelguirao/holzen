# Pause V2 — no-fallback cutover

**Date:** 2026-04-23
**Status:** accepted

## Context

The pause subsystem needed a strict lifecycle (active / engaged /
completed / dismissed / expired), a single-active-per-user invariant,
and a completion contract that includes at least one counted
companion — none of which the legacy `reflections`-row-as-pause
pattern could express cleanly. Rebuilding it on top of the new
`pause_instances` + events + artifacts schema was the goal.

An earlier plan (see retired branch `cursor/pause-logic-migration-dbb6`
and closed PR #11) staged the rollout over 13 phases behind an
`app_config.feature_flags.pause_v2_enabled` flag, with dual-writes to
`reflections` and `pause_instances` during cutover, a 7-day
post-cutover monitoring window, and a 14-day-green hold before
destructive deletes.

## Decision

Collapse the staged rollout into a single merge on
`cursor/pause-v2-final`:

- No feature flag. No dual-writes.
- Every write path — manual hook, cron edge, pause session UI,
  companion orchestrator — uses the V2 tables exclusively.
- Every read path — Stats, Badges, Library, History, edge reports —
  reads from `v_pause_full` / `pause_step_events` /
  `pause_companion_events` / `pause_ai_artifacts`.
- One destructive migration drops `reflections`,
  `reflection_companions`, `pause_notifications`, `follow_ups`, the
  reflection_id columns on dependent tables, and the legacy views.
- User history on reflections is discarded; `user_badges` is
  truncated so the silent-seed path in `useBadgeSync` rehydrates on
  first render.
- All stats + badge cards ship in the same merge — no scaffolds.

Rollback post-merge requires a DB restore.

## Consequences

- One visible discontinuity at merge instead of a long flag-gated
  cohabitation. Faster time-to-clean-model.
- Every existing user's pre-merge pause history is lost. Acceptable
  given the product direction (the legacy pauses were implicit
  event sequences on a single row; recovering them as explicit
  instances would require synthetic state-machine reconstruction).
- No soft rollback. The pre-merge validation burden falls on
  `supabase db reset` against a clean project + the
  [cutover_verification docs](#).
- Docs are simpler: no flag-flip instructions, no monitoring window
  gating destructive deletes, no "during cutover" qualifiers.

## Alternatives considered

- **Keep the staged rollout** (original PR #11). Faster rollback but
  longer cohabitation, larger diff surface over time, more places
  for drift between V1 and V2 to accumulate.
- **Historical data backfill**. Writing synthetic `pause_instances`
  rows from legacy `reflections` outcomes to preserve continuity.
  Cost: moderate migration complexity; reconstructed state-machine
  timestamps would all stamp at `created_at`, which loses fidelity.
  Rejected in favour of a clean break.

## References

- `docs/systems/pause-system.md`
- `docs/systems/stats-system.md`, `docs/systems/badges-system.md`
- `docs/decisions/2026-04-23-skills-first-stats-ia.md`
- `docs/decisions/2026-04-23-four-family-badge-reorg.md`
- `cursor/pause-v2-final` branch history
