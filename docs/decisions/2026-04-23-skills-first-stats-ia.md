# Skills-first Stats IA

**Date:** 2026-04-23
**Status:** accepted

## Context

Before this change, the Stats tab was organized around metric families
(Hero → Your Journey → Progress → Decision Making → Deep Patterns).
`docs/systems/stats-system.md` "Recommended target model (skills-first)"
section proposed reorganizing it around the five core skills
(Regulation / Tolerance / Alignment / Reappraisal / Awareness), with
supporting sections (streak / milestones / period comparison) clearly
de-emphasized and advanced charts collapsed by default.

## Decision

Ship the skills-first IA **together with** the Pause V2 cutover.
Specifically:

- Stats V2 lives in `src/components/stats/StatsContentV2.tsx` and
  renders four sections in order: Skill Overview → Skill Deep Dives →
  Journey & Consistency → Advanced (collapsed).
- Every card exposes formula, denominator, sample size, last-updated
  window, plus a confidence chip sourced from `sampleConfidence` in
  `src/lib/stats/confidence.ts`.
- Alignment falls back to a "Not configured" CTA row when the user has
  no hold goal — no synthetic score bar.
- The entire V2 path is gated on the `pause_v2_enabled` feature flag so
  we can flip the IA and the data source in the same cutover moment.

## Consequences

- One discontinuity at cutover instead of two (data-source swap + IA
  reorg happen together).
- Deep-dive cards land in follow-up commits during Phase G; their
  scaffolds ship today so the section order is already stable.
- Mood × Price scatter and other low-confidence surfaces move to
  Advanced (collapsed by default). Users who relied on those cards as
  defaults will need to expand once.

## Alternatives considered

- **Ship data-source swap first, reorg later.** Two visible
  discontinuities, more coordination cost, more risk of partial rollout.
- **Reorg only, keep legacy data.** Doesn't solve the pause invariants
  the V2 cutover addresses; would also need to be undone at Phase L.

## References

- `docs/systems/stats-system.md` "Recommended target model" section
- `docs/systems/pause-system.md`
- `/opt/cursor/artifacts/PLAN.md` §7
