# Four-family badge reorganization

**Date:** 2026-04-23
**Status:** accepted

## Context

The legacy badge panel held 32 badges across five mostly-volumetric
categories (Calendar, Volume, Composure, Companions, Engagement) and
over-weighted per-companion ladders. `docs/systems/badges-system.md`
"Recommended target model (skills-aligned badges)" proposed a
4-family / 12–16 active model with ladder collapsing.

## Decision

Ship the 4-family model at **14 active badges** alongside the Pause
V2 cutover:

- **Foundation (3, non-Pro):** `first-pause`, `first-week`,
  `first-ritual`.
- **Core skills (5 ladders × 3 tiers):** `regulation-*`,
  `tolerance-*`, `alignment-*`, `reappraisal-*`, `awareness-*`. Only
  the current unearned tier renders; earned tiers collapse into a
  `X/3` count on the ladder.
- **Mastery (3, Pro):** `iron-hands`, `thirty-strong`,
  `full-ritual-100`.
- **Legacy / Special (3, non-Pro):** `btc-genesis`, `btc-pizza`,
  `btc-halving`.

Companion badges (breathe / haiku / signal / zoom / history / learn /
all-six ladders) dropped — counted companion completions now
contribute to the `reappraisal-*` ladder under Core skills.

Cutover truncates `user_badges` and recomputes from the new rules;
`useBadgeSync`'s silent-seed path prevents a push flood on the first
render after the truncate.

## Consequences

- Cleaner panel: 14 cards vs 32. Core-skill progress is more
  legible.
- Pro gate feels earned, not punitive: Foundation + Core skills
  remain non-Pro; Pro unlocks only the Mastery tier.
- Companion-specific ladders disappear. Users who earned, say,
  `haiku-50` lose that specific badge; the earned `reappraisal-50`
  on the new model serves the same depth-signal role.

## References

- `docs/systems/badges-system.md` "Recommended target model"
- `docs/systems/pause-system.md` §10
