# Archive retrospective outcome (quarantined)

Per-card **Log decision** in Archive (expired/dismissed rows without `outcome_logged`) was removed from the pause-first shipped surface (May 2026).

Same rationale as bulk hold: retrospective trade labels outside the ritual are portfolio/stats hygiene, not pause practice.

**Server (May 2026):** `pause_log_step` **rejects** `outcome_logged` when `pause_instances.state` is `expired` or `dismissed` (migration `20260524120000_pause_log_step_close_retrospective_outcome.sql`). Historical retrospective rows remain in `pause_step_events`.

**Recovery:** git history; search `ArchivePauseRetrospectiveOutcomeSheet`, `use-archive-pause-retrospective-outcome`, `log-retrospective-outcome`, `pause-archive-io`, `pause_outcome_retrospective` PostHog event.

The in-ritual **Decide** step on `/pause` remains the supported path to record a choice when completing a pause.
