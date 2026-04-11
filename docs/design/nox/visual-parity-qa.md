---
title: Nox Visual Parity QA Playbook
nox_version: 1.0.0
status: draft
---

# Visual Parity QA

This playbook is the single checklist for strict Nox visual sign-off in Holzen.

Use it when you need pixel-level parity confidence (not only semantic-token parity).

## Goal

- Confirm Holzen screens match Nox component/foundation intent visually.
- Catch mismatches in color, spacing, typography, radius, stroke, and state behavior.
- Produce repeatable evidence (screenshots + notes) before marking routes as `ready`.

## Canonical inputs

- Figma Foundations: `c6vKLjDHRKfpluorJlT90n`
- Figma Components: `5CTApv6IlReBfdB0YS6zxq`
- Route rollout board: `parity-board.md`
- Token extraction snapshots: `extraction/`

## Prerequisites

- App builds and runs cleanly (`npm run test`, `npm run build`).
- Latest Nox token ingestion applied in code (`src/index.css` + docs under `foundations/`).
- Figma desktop session authenticated for the target team/workspace.
- For MCP `get_design_context`: keep the target node selected in Figma when needed.

## QA workflow

1. Pick one scope unit (component or route).
2. Capture Figma reference:
   - Prefer node-level references for exact state/variant.
   - If MCP `get_design_context` is unavailable due selection constraints, use existing extracted tokens + metadata and perform visual comparison with manual frame references.
3. Capture app screenshots for the same state(s):
   - default
   - pressed/active
   - disabled
   - error/success/warning where relevant
4. Compare against the checklist below.
5. Log findings and classify:
   - `pass`: visually aligned
   - `minor`: acceptable drift, does not break hierarchy/legibility
   - `fail`: must fix before `ready`
6. Update `parity-board.md` status:
   - `ready` only when all critical checks pass
   - `partial` when any `fail` remains
   - `blocked` when missing design decision/input

## Visual checks (strict)

- **Color**
  - Background, text, border, and state colors map to extracted Nox values.
  - Contrast hierarchy matches the design intent (primary vs secondary vs muted).
- **Typography**
  - Font family (`Inter` vs `Newsreader`) matches intended usage.
  - Size, line-height, and letter spacing use documented scales.
- **Spacing and layout**
  - Section/group/category spacing follows Nox spacing semantics.
  - Padding and vertical rhythm are consistent across repeated blocks.
- **Shape and stroke**
  - Radius and border width align to `radius-*` and `stroke-*` primitives.
- **States and interactions**
  - Pressed/disabled/focus visuals are distinct and match Nox direction.
  - Focus ring treatment is present and consistent.
- **Dark mode**
  - Same semantic hierarchy and legibility as baseline mode.
  - No accidental token regressions between modes.

## Route-level sign-off checklist

For each route:

- Screenshot set captured for key viewport(s).
- Header, primary CTA, form controls, cards, and feedback components checked.
- Empty/error/loading states checked if route has them.
- Dark mode checked.
- Result logged and `parity-board.md` updated.

## Evidence template (copy/paste)

```md
### Route: /example
- Date:
- Reviewer:
- Figma refs:
- App refs:
- Result: pass | minor | fail
- Notes:
  - Color:
  - Typography:
  - Spacing:
  - Radius/stroke:
  - States:
  - Dark mode:
- Follow-up actions:
```

## Exit criteria

A route/component is visually signed off when:

- No open `fail` findings remain.
- Any `minor` deviations are documented and accepted.
- `parity-board.md` is updated to `ready`.

## Known tooling caveat

If MCP `get_design_context` returns a selection-related error, keep using this fallback order:

1. `use_figma` extracted values/inventory as canonical token/component source.
2. Manual frame/node visual comparison in Figma.
3. App screenshot evidence + checklist classification in this document.

