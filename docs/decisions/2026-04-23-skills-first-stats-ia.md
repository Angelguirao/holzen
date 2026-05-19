# Skills-first Stats IA

**Date:** 2026-04-23
**Status:** accepted

## Context

Before the Pause V2 cutover, the Stats tab was organized around metric
families (Hero → Your Journey → Progress → Decision Making → Deep
Patterns). `docs/systems/stats-system.md` "Recommended target model
(skills-first)" proposed reorganizing around the five core skills
(Regulation / Tolerance / Alignment / Reappraisal / Awareness) with
supporting sections (streak / milestones / period comparison) clearly
de-emphasized and advanced charts collapsed by default.

## Decision

Ship the skills-first IA together with the Pause V2 cutover:

- Stats V2 lives in `src/legacy/full-shell/src/components/stats/StatsContentV2.tsx` (not pause-first bundle) and
  renders four sections in order: Skill Overview → Skill Deep Dives
  → Journey & Consistency → Advanced (collapsed).
- Every card exposes formula, denominator, sample size, last-updated
  window, plus a confidence chip sourced from `sampleConfidence` in
  `src/lib/stats/confidence.ts`.
- Alignment falls back to a "Not configured" CTA row when the user
  has no hold goal — no synthetic score bar.

## Consequences

- Users flipping into V2 see a reorganised Stats tab in the same
  merge as the data-source swap. One discontinuity, not two.
- Mood × Price scatter and other low-confidence surfaces move to
  Advanced (collapsed by default). Users who relied on those cards
  as defaults will need to expand once.

## References

- `docs/systems/stats-system.md` "Recommended target model" section
- `docs/systems/pause-system.md` §9
