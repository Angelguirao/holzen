# Four-family badge reorganization

**Date:** 2026-04-23
**Status:** accepted

## Context

The legacy badge panel contained 32 badges across five mostly-volumetric
categories (Calendar, Volume, Composure, Companions, Engagement). It
over-weighted companion-usage ladders (e.g. breathe-5 / breathe-25 /
breathe-100, haiku-10 / haiku-50, signal-10 / signal-50, etc.) and
under-represented the core-skill outcome the pause flow is meant to
train.

`docs/systems/badges-system.md` "Recommended target model (skills-
aligned badges)" proposed a 4-family / 12–16 active model with ladder
collapsing: Foundation + Core skills + Mastery + Legacy, with only the
current ladder tier visible per skill. It also recommended Pro gating
only on Mastery extras, not on the core habit milestones.

## Decision

Ship the 4-family model at 14 active badges alongside the Pause V2
cutover:

- **Foundation (3, non-Pro):** `first-pause`, `first-week`, `first-ritual`.
- **Core skills (5 × 3 tiers):** `regulation-*`, `tolerance-*`,
  `alignment-*`, `reappraisal-*`, `awareness-*`. Only the current
  unearned tier renders as a ladder card; earned tiers collapse into a
  `X/3` badge on the ladder.
- **Mastery (3, Pro):** `iron-hands`, `thirty-strong`, `full-ritual-100`.
- **Legacy / Special (3, non-Pro):** `btc-genesis`, `btc-pizza`,
  `btc-halving`.

Companion badges (breathe / haiku / signal / zoom / history / learn /
all-six ladders) are dropped. Counted companion completions now
contribute to the `reappraisal-*` ladder under Core skills, which keeps
the intent but consolidates the surface.

Cutover truncates `user_badges` and recomputes from the new rules, per
the user-locked decision in `/opt/cursor/artifacts/PLAN.md` §15.

## Consequences

- Cleaner panel: 14 cards vs 32. Core skill progress is more legible.
- Pro gate feels earned, not punitive: all early and mid-level
  milestones stay non-Pro; Pro only unlocks the Mastery tier badges
  that require sustained behaviour.
- Companion-specific ladders disappear. Users who earned, say, `haiku-50`
  lose that specific badge visually; the earned `reappraisal-50` on the
  new model serves the same purpose (both measure depth of companion
  engagement, just aggregated).
- Alignment ladder stays visible even without a hold goal, but shows a
  0-progress state until the goal is configured. (Matches Stats' "Not
  configured" CTA on the Alignment bar.)

## Alternatives considered

- **Preserve companion ladders.** Too many badges; the panel was
  overwhelming. Target model explicitly calls for consolidation.
- **Skip Mastery.** Losing 3 aspirational targets for committed users.
  Ironically also removing the Pro gate would reduce the incentive to
  subscribe specifically for progression rewards.
- **Keep old earned_at timestamps.** User chose full reset
  (`/opt/cursor/artifacts/PLAN.md` §15).

## References

- `docs/systems/badges-system.md` "Recommended target model" section
- `docs/systems/pause-system.md` §10
- `/opt/cursor/artifacts/PLAN.md` §8
