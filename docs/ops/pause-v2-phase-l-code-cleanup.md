# Pause V2 — Phase L: code cleanup manifest

!! Do not apply before Phase L unblock (see
[post-cutover monitoring](pause-v2-post-cutover-monitoring.md) §7). !!

Paired with `docs/ops/pause-v2-phase-l-legacy-delete.sql`. After the SQL
runs, every `reflections` / `reflection_companions` / `pause_notifications`
reference in the code is dead. This manifest enumerates them.

## Files to delete outright

Stats (replaced by `src/components/stats/*` + `StatsContentV2`):

- `src/components/HolzenScoreCard.tsx`
- `src/components/SkillBalanceCard.tsx`
- `src/components/StatsTrends.tsx`
- `src/components/PeriodComparison.tsx` (replaced by `stats/journey/PeriodComparisonCard.tsx` once migrated; if the new card never lands before Phase L, keep the legacy as a shim temporarily)
- `src/components/ReflectionStats.tsx`
- `src/components/MoodShiftChart.tsx` → move to `stats/regulation/`
- `src/components/MoodTrendChart.tsx` → move to `stats/regulation/`
- `src/components/MoodPriceChart.tsx` → move to `stats/advanced/`
- `src/components/MoodPriceScatter.tsx` → move to `stats/advanced/`
- `src/components/DecisionQualityCard.tsx` → reframe to `stats/reappraisal/PerspectiveToolsImpactCard.tsx`
- `src/components/DecisionAccuracyCard.tsx` → reframe to `stats/tolerance/OutcomeStabilityCard.tsx`
- `src/components/VolatilityToleranceCard.tsx` → move to `stats/tolerance/`
- `src/components/JourneyWidget.tsx` (keep; Home-only)
- `src/components/MilestoneTimeline.tsx` → move to `stats/journey/`
- `src/components/StreakTimeline.tsx` → move to `stats/journey/`
- `src/components/HistoryCalendar.tsx` (keep; History-only)
- `src/components/VolatilityTimeline.tsx` (keep; History page)

Badges:

- `src/components/BadgesPanel.tsx` (replaced by `BadgesPanelV2`)

Hooks / libs that read `reflections` / `reflection_companions`:

- `src/lib/engaged-pause.ts` — all call sites already migrated to
  `pause-state.ts`. Delete at Phase L.
- `src/hooks/use-holzen-score.ts` — replaced by `src/lib/stats/pause-score.ts`.
- `src/hooks/use-past-reflection.ts` — migrate to a `use-past-pauses.ts`
  equivalent that reads `v_pause_full` (follow-up to Phase L).
- `src/lib/companion-completion-sync.ts` + `src/lib/companion-completion-maps.ts`
  — after Phase L, these still run legacy column updates that no
  longer exist. Rewrite so they exclusively log `pause_step_events` /
  `pause_companion_events`.
- `src/lib/companion-reflection-cache.ts` — rework around
  `pause_ai_artifacts`.
- `src/lib/duplicate-detection.ts` — if it reads `reflections`, move to
  `pause_instances`.
- `src/lib/reflection-persist-error.ts` — survives (generic error
  message helper), but rename & move to `lib/pause-persist-error.ts`.

Pages:

- `src/pages/History.tsx` — rewrite the reflection queries to
  `v_pause_full`. Drops the legacy `FIELDS` constant.

Edge functions:

- `supabase/functions/check-volatility/index.ts` — delete the legacy
  `INSERT INTO reflections` block and the `pause_v2` if-branch wrapper;
  keep only the V2 path (now unconditional).
- `supabase/functions/companion-orchestrate/index.ts` — delete the
  `reflections.user_id` ownership check; replace with `pause_instances`
  equivalent.
- `supabase/functions/_shared/companion-data.ts` — delete the
  `reflection_companions` upsert; keep only the `pause_ai_artifacts`
  path.
- `supabase/functions/_shared/companion-orchestrate-skip-cached.ts` —
  read `pause_ai_artifacts` instead of `reflection_companions`.
- `supabase/functions/_shared/companion-orchestrate-assemble.ts` —
  drop the now-unused `reflectionId` param; rename + simplify.
- `supabase/functions/_shared/recent-signal-urls.ts` — query
  `pause_ai_artifacts`.
- `supabase/functions/_shared/past-reflection-util.ts` + related —
  repoint to `v_pause_full`.
- `supabase/functions/holzen-reflect/index.ts` — payload contract
  unchanged; no action required.

Feature-flag reads:

- Every call to `isPauseV2Enabled()` becomes unconditional-V2. Delete
  the branches in:
  - `src/lib/pause-dual-write.ts` (whole file becomes unconditional;
    rename to `pause-manual-create.ts` or similar)
  - `src/lib/pause-step-logger.ts` (`logPauseStepIfV2` becomes
    `logPauseStep`)
  - `src/hooks/use-current-pause.ts` (remove `v2Disabled`)
  - `src/hooks/use-pause-stats-data.ts` (remove `v2Enabled`)
  - `src/pages/Profile.tsx` (remove the `pauseV2Enabled` branch)
- Delete `src/lib/pause-v2-flag.ts` entirely.
- Delete the two `supabase/functions/_shared/pause.ts#isPauseV2Enabled`
  branches in `check-volatility`.

Docs:

- `docs/systems/stats-system.md` — remove legacy sections after the
  Phase-M sweep repoints them; mark "Recommended target model" as
  shipped.
- `docs/systems/badges-system.md` — same.
- `docs/ops/feature-flags.md` — delete the
  `pause_v2_enabled` row from the
  `app_config.feature_flags` table.
- `docs/ops/cron-setup.md` — delete the `purge-orphan-notification-reflections`
  section.

## Dry-run verification

After applying the SQL and editing the code, run:

```bash
rg -l 'reflections\b' src/ supabase/functions/ docs/ | grep -v -E 'archive|retrospective|postmortem|backlog|pause-v2-phase-l'
rg -l 'reflection_companions|v_reflection_with_companions|pause_notifications' src/ supabase/functions/ docs/
rg -l 'isFullRitualPause|isCompletedPause|filterFullRitual|engaged-pause' src/
rg -l 'pause_v2_enabled' src/ supabase/
```

All four should return no files (aside from archival / retrospective
docs that describe the removal). Each hit is a leftover to clean up.

## Test sweep

After code deletions:

- `npm run test` — every existing test should still pass. Fixtures
  that shaped legacy reflection rows need rewriting to the new model;
  each such failure is a test to migrate, not a code regression.
- `npm run build` — the build is the canonical check that no legacy
  import survives.
- `npm run lint` on touched files — lint parity preserved.

## Commit pattern

One commit per category so review is manageable:

1. `Phase L (1/6): apply docs/ops/pause-v2-phase-l-legacy-delete.sql`
2. `Phase L (2/6): delete legacy Stats components + repoint Profile`
3. `Phase L (3/6): delete legacy Badges path + use-holzen-score`
4. `Phase L (4/6): delete legacy reflections writes from edge functions`
5. `Phase L (5/6): remove pause_v2_enabled branches everywhere`
6. `Phase L (6/6): docs sweep + AGENTS.md updates`
