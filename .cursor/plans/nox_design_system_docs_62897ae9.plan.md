---
name: Nox Migration Master Plan
overview: Migrate Holzen to the Nox design system end-to-end using a foundation-first strategy, explicit milestone commits, measurable validation gates, and a route-by-route rollout queue that avoids long-term mixed design language.
todos:
  - id: milestone-1-docs-contract
    content: Complete Nox docs + mapping contract under docs/design/nox and add canonical docs index entry
    status: pending
  - id: milestone-2-token-bridge
    content: Implement token bridge in src/index.css and tailwind.config.ts so existing semantic tokens resolve from Nox aliases
    status: pending
  - id: milestone-3-primitives-wave-1
    content: Migrate high-impact primitives (Button, Input, Tag, Dialog/Exit, State-card, Status-card, Header-main/modal)
    status: pending
  - id: milestone-4-primitives-wave-2
    content: Migrate remaining shared primitives by category (Feedback, Navigation, Layout, Type, Control)
    status: pending
  - id: milestone-5-routes-wave-1
    content: Roll out migrated primitives + tokens on first priority route batch with parity checks
    status: pending
  - id: milestone-6-routes-wave-2
    content: Roll out second route batch and reduce legacy token usage to near zero
    status: pending
  - id: milestone-7-cleanup
    content: Remove deprecated aliases/legacy-only styling paths and lock docs/components as stable or extension
    status: pending
isProject: false
---

# Nox Design System Documentation

## Context

Your team maintains **Nox design V 1.0.0** across two Figma files:

- **Foundations** (`c6vKLjDHRKfpluorJlT90n`) -- tokens (color, typography, radius)
- **Components** (`5CTApv6IlReBfdB0YS6zxq`) -- UI components (Button, Text-field, Tag, Dialog, State-card, etc.)

Holzen already ships a **CSS custom property** layer in [src/index.css](src/index.css) (shadcn/Tailwind HSL variables for light + dark themes) plus `--font-body` (Inter) and `--font-mono` (IBM Plex Mono). These were defined **before** Nox existed, so the docs need to bridge the two naming systems.

Inspiration: [Google Stitch Design MD](https://stitch.withgoogle.com/docs/design-md/overview/) -- structured markdown that describes a design system in a way tools and humans can consume, complementing (not replacing) Figma.

## What Nox Figma contains (discovered via MCP)

### Foundations file (`c6vKLjDHRKfpluorJlT90n`)

Five pages, each a token category:

**Color** (documented from Foundations variable collections + token search):
- **`color semantic tokens`** -- `color/text/{primary, secondary, muted, contrast, highlight, link}`, `color/accent/{cyan, green, violet, magenta}`, `color/state/{error, success, warning}`, `color/border/{focus, default}`, `color/background/{primary, secondary, accent, inverse, overlay}`
- **`color specific tokens`** -- `button/{primary, secondary, tertiary}/{background, border}/{active, pressed, disabled}`

**Typography** (`4:4832`):
- **Font families:** `font-family-editorial` = Newsreader, `font-family-ui` = Inter
- **Font styles:** `font-style-normal`, `font-style-italic`
- **Font weights:** `font-weight-light` (300), `font-weight-regular` (400), `font-weight-medium` (500)
- **Font sizes:** `font/size/{S, M, L, XL}`
- **Line heights:** `line/height/{18, 20, 24, 26, 28, 30, 34, 38, 42, 74}`
- **Letter spacing:** `font/spacing/{tight, normal, loose}`

**Spacing** (`87:2`):
- **Header** -- 16px (between header and first element)
- **Group** -- 16px (between related elements in the same group)
- **Section** -- 32px (between independent thematic sections)
- **Category** -- 8px (below category header)
- **Footer** -- 24px (padding bottom to fixed footer)

**Radius** (`4:4834`):
- `radius-none`, `radius-s`, `radius-m`, `radius-full`

**Stroke** (`100:5`):
- `stroke-width-1`, `stroke-width-2`

### Components file (`5CTApv6IlReBfdB0YS6zxq`)

Single page `20:1425` ("Components") containing **7 categories, 20+ components**:

**Action:**
- `Button` -- 3 types (Primary, Secondary, Tertiary) x 3 states (Active, Pressed, Disabled) = 9 variants
- `Link` -- 3 states (Active, Pressed, Disabled)
- `Button-panel`

**Card:**
- `Selection` -- 3 states (Default, Pressed, Disabled)

**Form:**
- `Text-field` -- 4 states (Unfilled, On tap, Typing, Filled)
- `Password-field` -- 4 states x Show True/False = 7 variants
- `Tag` -- 2 states (Default, Selected)
- `Tag-input` -- 5 states (Default, On tap, Typing, Filled label, Pressed)

**Feedback:**
- `Loading-spinner` -- 24-frame animation sequence
- `Value-equivalence`
- `State-card`
- `Status-card`

**Navigation:**
- `Header-main`
- `Header-modal`
- `Process-stepper` -- 5 steps (One, Two, Three, Four, Full/Resume)

**Layout:**
- `Spacing` component -- XS 8px, S 16px, M 24px, L 32px
- `Divider`

**Type:**
- `Text-H2`
- `Text-Body-default`

**Control:**
- Percentage selector (25%, 50%, 75%)
- `Slider-value` (Idle)
- `Threshold-slider`

**Other:**
- `Dialog/Exit`
- `simulation-card`

### "Holdzen Design System" demo frames (composed patterns)

Inside the Components file, two frames titled "Holdzen Design System" show **application-specific compositions** organized by tabs (Componentes, Especializados, Ejemplos):

- **Botones** -- Default, Secondary, Outline, Ghost, Link + Small/Default/Large sizes
- **Cards** -- stat cards (BTC balance, ROI, risk level)
- **Formularios** -- email, password, amount, strategy selector
- **Progress & Badges** -- Default, Secondary, Outline, Success, Warning badges + progress bars
- **Alertas** -- Information, Success, Warning alerts with icons
- **Controles** -- Switch, Checkbox, Slider
- **Interacciones** -- Tooltip, Modal, Accordion
- **Paneles de Inversion** -- expandable investment panels with stat cards and progress
- **Escalas de Evaluacion** -- SimpleLikertScale, LikertScale (emotional response evaluation)

## Proposed file structure

```
docs/design/nox/
  README.md                -- overview, V1.0.0, Figma links, full inventory, reading guide

  foundations/
    color.md               -- semantic + specific (button-state) color tokens
    typography.md          -- families, styles, weights, sizes, line heights, spacing
    spacing.md             -- Header/Group/Section/Category/Footer scale
    radius.md              -- none/s/m/full
    stroke.md              -- stroke-width-1, stroke-width-2
    mapping.md             -- Nox token <-> Holzen CSS variable mapping table

  components/
    README.md              -- full inventory (7 categories, 20+ components), status table
    # Action
    button.md              -- 3 types x 3 states, a11y, usage
    link.md                -- Active/Pressed/Disabled
    button-panel.md        -- panel variant
    # Card
    card-selection.md      -- Default/Pressed/Disabled
    # Form
    text-field.md          -- 4 states, anatomy, validation
    password-field.md      -- 4 states x show/hide
    tag.md                 -- Default/Selected
    tag-input.md           -- 5 states
    # Feedback
    loading-spinner.md     -- 24-frame animation
    value-equivalence.md   -- value display
    state-card.md          -- state feedback
    status-card.md         -- status feedback
    # Navigation
    header-main.md         -- main header
    header-modal.md        -- modal header
    process-stepper.md     -- 5 steps
    # Layout
    layout-spacing.md      -- XS/S/M/L component
    divider.md             -- horizontal rule
    # Type
    text-h2.md             -- heading style
    text-body-default.md   -- body style
    # Control
    control.md             -- percentage selector
    slider-value.md        -- idle state
    threshold-slider.md    -- threshold control
    # Other
    dialog-exit.md         -- exit dialog anatomy
    simulation-card.md     -- simulation display

  patterns/
    README.md              -- composed "Holdzen Design System" patterns index
                           -- badges, alerts, progress, controls (switch/checkbox/slider),
                              interactions (tooltip/modal/accordion),
                              investment panels, evaluation scales (Likert)
```

## Per-file format (Design MD-inspired)

Each markdown file follows a consistent structure:

- **Frontmatter** -- `title`, `figma_file_key`, `figma_node_id` (optional), `nox_version`, `status` (draft / stable / deprecated)
- **Description** -- 1-2 sentences: what this token set or component is for
- **Tokens table** (foundations) or **Anatomy** section (components)
- **Variants / States** -- what changes (e.g. button: primary, secondary, tertiary x active, pressed, disabled)
- **Usage guidelines** -- when to use, when not to, a11y notes
- **Code mapping** (foundations) or **Code reference** (components) -- which Holzen CSS var or shadcn component maps to this; or "not yet mapped" as a clear gap

## Ownership and drift rules

- **Figma stays canonical** for visual specs and values; the markdown docs describe *rules, intent, and code mapping*
- Token names in markdown reference **Figma variable names** (e.g. `color/text/primary`)
- When a token is updated in Figma, the markdown doc's frontmatter `nox_version` bumps alongside
- [docs/README.md](docs/README.md) gets a new entry in the "Canonical sources" table pointing to `docs/design/nox/`

## Integration with existing docs

Add one row to the canonical-sources table in [docs/README.md](docs/README.md):

```
| Design system (Nox) | docs/design/nox/ | Figma is canonical for visual values; markdown owns rules, intent, code mapping. |
```

No changes to `AGENTS.md` unless you want agents to know about Nox tokens when generating UI code (possible follow-up).

## Phase 2 - Whole-app migration strategy

### Current stack constraints (why this matters)

- React + TypeScript + Vite
- Tailwind + shadcn/Radix primitives (`src/components/ui/*` has ~49 base UI primitives)
- Design tokens currently flow through CSS custom properties in [src/index.css](src/index.css) and [tailwind.config.ts](tailwind.config.ts)
- Current token model is semantic (`--background`, `--primary`, `--muted`, etc.) and already wired deeply into component variants (`Button`, `Input`, etc.)

This means migration risk is mostly in **token semantics + component API compatibility**, not framework migration.

### Migration options (beginner-friendly)

Think of the UI as a house:
- **Tokens** are the materials/colors (paint, spacing, radius).
- **Components** are the furniture pieces (Button, Input, Card).
- **Pages/routes** are full rooms built from those pieces.

#### Option 1 - Big-bang rewrite ("replace the whole house at once")

**What it means**
- We redesign and update many components/pages in parallel and switch quickly.

**Good for**
- Teams that can pause feature work and do heavy QA for a short period.

**Pros**
- Fastest path to "everything looks Nox."

**Cons**
- Highest chance of regressions.
- Hard to debug because many things change at the same time.
- Stressful for a team still learning the UI layer.

#### Option 2 - Component-first without token bridge ("new furniture, old materials")

**What it means**
- We restyle Button/Input/etc. first, but we do not first map Nox tokens into current CSS vars.

**Good for**
- Small demos or prototypes.

**Pros**
- You see visible component changes early.

**Cons**
- Inconsistent visuals across pages.
- Duplicate styling logic (old token names + new Nox logic mixed together).
- Rework likely later when token mapping is finally added.

#### Option 3 - Token-bridge first, then components, then pages ("foundation-first")

**What it means**
- Step 1: map Nox tokens into current theme variables.
- Step 2: migrate shared primitives (`src/components/ui/*`).
- Step 3: migrate pages/flows in batches.

**Good for**
- Real product migrations where stability matters.

**Pros**
- Lowest risk.
- Easier rollbacks.
- Cleaner architecture (single source of truth for colors/spacing/radius).

**Cons**
- Less visually exciting in week 1 (some setup before big visual change).

### Recommendation (what we should implement)

We should use **Option 3 (foundation-first)**, with your chosen style of execution:

- **Speed goal:** fast visual parity (bigger batches per sprint)
- **Gap policy:** if Nox does not cover a needed pattern, build a **Nox-styled Holzen extension** and document it

Why this is best for your context:
- You are still learning frontend details, so safer sequencing helps a lot.
- The app already has a strong semantic token setup; we can leverage it instead of fighting it.
- Nox coverage is partial, so we need a controlled extension path anyway.

### Recommended approach (strangler pattern)

#### Stage A - Documentation + mapping contract

- Finalize Nox docs (Phase 1) as the source of migration truth
- Add explicit mapping matrix: `Nox token -> Holzen token -> fallback` in `foundations/mapping.md`
- Mark gaps where Nox has no equivalent and where Holzen has app-specific tokens

#### Stage B - Token bridge in code (no visual rewrite yet)

- Introduce Nox-named CSS variables in `src/index.css` alongside current variables
- Map existing semantic vars from Nox aliases where possible
- Keep old variable names intact so existing components do not break

Example direction:
- `--nox-color-text-primary` -> drives `--foreground`
- `--nox-color-background-primary` -> drives `--background`
- `--nox-radius-m` -> drives `--radius`

#### Stage C - Base primitive alignment

- Update only `src/components/ui/*` primitives first (Button, Input, Badge, Alert, etc.) to match Nox states/variants
- Preserve component public APIs when possible; add temporary variant aliases if needed
- Build side-by-side visual checks for each primitive state matrix

#### Stage D - Feature-by-feature rollout

- Migrate routes by user impact and design coverage, not by folder order
- Use feature flags where needed for high-risk screens
- Keep a migration checklist per route: tokens, primitives, interaction states, dark mode, i18n spacing

#### Stage E - Hardening + cleanup

- Remove deprecated old tokens only after all routes are migrated
- Remove temporary aliases in primitives
- Lock docs + component status to `stable`

### Coverage-aware scope

Because Nox does not fully cover all app patterns yet, define three buckets:

- **Covered by Nox** -- migrate directly
- **Partially covered** -- use Nox as the base and adapt missing parts to Nox visual/interaction rules
- **Not covered** -- build a new Nox-styled Holzen implementation (do not keep old styling), and document it under `docs/design/nox/patterns/` as "Holzen extension"

Important clarification:
- We are **not** keeping "old design + Nox design" long term.
- Temporary coexistence is only a migration safety mechanism while routes are being converted.
- End state is one coherent design language: Nox (plus explicitly documented Nox-styled extensions where Nox has no official component yet).

### Definition of done (project migration)

- All routes consume Nox-mapped tokens
- Core primitives match Nox variant/state behavior
- No screen uses deprecated legacy-only token names
- Dark mode parity verified
- Accessibility checks pass for updated controls
- Docs reflect final token/component status (stable vs extension)

### Suggested execution order

1. Foundations token bridge (color, typography, radius, spacing, stroke)
2. Action + Form primitives (highest surface area)
3. Feedback + Navigation + Layout + Type + Control
4. Route-by-route migration
5. Cleanup and deprecation pass

### Strategy decisions captured

- **Priority chosen:** fast visual parity with Nox
- **Gap policy chosen:** when Nox lacks a needed pattern, create a Nox-styled Holzen extension and document it

### Execution implication of chosen strategy

- We keep the same staged architecture (token bridge -> primitives -> routes), but run in larger batches per sprint.
- First parity wave should target: `Button`, `Input`, `Tag`, `Dialog/Exit`, `State-card`, `Status-card`, `Header-main`, `Header-modal`, plus global color/typography/spacing/radius/stroke tokens.
- We add a temporary "Nox parity board" in docs with three statuses per route: `ready`, `partial`, `blocked`.

### Delivery model (implementation style)

- This project is a strong fit for a **long-running agent** execution.
- Work should be delivered in vertical milestones with explicit commits (for example: token bridge -> primitive wave 1 -> primitive wave 2 -> route batches).
- The agent should continue until the migration scope is complete, with checkpoints and validation at each milestone.

## Milestone commit gates (explicit)

Each milestone ends with one commit after validation passes. If validation fails, do not advance.

1. **M1 - Docs + mapping contract**
   - Scope: `docs/design/nox/**`, `docs/README.md`
   - Commit gate: inventory complete, token/component mapping documented, extension policy documented

2. **M2 - Token bridge**
   - Scope: `src/index.css`, `tailwind.config.ts` (and minimal supporting files if needed)
   - Commit gate: existing UI still renders; semantic tokens now resolve from Nox aliases

3. **M3 - Primitive wave 1**
   - Scope: high-impact primitives (`button`, `input`, `tag`, `dialog`, key feedback/navigation primitives)
   - Commit gate: variant/state parity for target primitives

4. **M4 - Primitive wave 2**
   - Scope: remaining shared primitives by category
   - Commit gate: all shared primitives either Nox-aligned or explicitly marked extension

5. **M5 - Route wave 1**
   - Scope: first route batch (see queue below)
   - Commit gate: parity board statuses updated; no critical visual regressions

6. **M6 - Route wave 2**
   - Scope: second route batch
   - Commit gate: legacy token usage near zero on migrated routes

7. **M7 - Cleanup + lock**
   - Scope: remove deprecated aliases, finalize docs statuses
   - Commit gate: stable end state and cleanup checklist complete

## Route rollout queue (concrete)

Prioritize by user impact and design concentration:

### Batch 1 (highest product surface)
- `/`
- `/library`
- `/profile`
- `/settings`
- `/pause`
- `/ground`
- `/ambient`
- `/practice/checkin`
- `/practice/journal`

### Batch 2 (remaining product + public surface)
- `/practice/bodyscan`
- `/practice/replay`
- `/admin`
- `/welcome`
- `/auth`
- `/reset-password`
- `/terms`
- `/privacy`
- `/about`
- `/blog`
- `/blog/:slug`
- `/roadmap`
- `/reserve`

## Validation matrix (measurable)

Run these checks at every milestone where code changes:

- **Quality gates**
  - `npm run test`
  - `npm run build`
  - `npm run lint` (focus on touched files)
- **Visual parity**
  - Compare before/after screenshots on migrated primitives/routes
  - Confirm dark mode parity on each migrated route
- **Accessibility**
  - Keyboard navigation for migrated controls
  - Focus ring visibility and contrast checks on primary flows
- **Migration tracking**
  - Update Nox parity board (`ready`, `partial`, `blocked`) for each migrated route

## Rollback policy

- If a milestone introduces severe regressions, revert to previous milestone commit.
- Avoid partial rollback inside a milestone; keep rollback boundaries aligned to milestone commits.
- After rollback, narrow scope and re-run the same milestone with smaller change slices.

## Timeline sanity pass (effort + confidence)

These are practical estimates for one long-running agent flow with human review at milestone boundaries.

### Estimated effort by milestone

- **M1 - Docs + mapping contract:** `0.5-1 day` (high confidence)
- **M2 - Token bridge:** `1-2 days` (medium confidence)
- **M3 - Primitive wave 1:** `2-4 days` (medium confidence)
- **M4 - Primitive wave 2:** `3-5 days` (medium/low confidence; depends on edge variants)
- **M5 - Route wave 1:** `2-4 days` (medium confidence)
- **M6 - Route wave 2:** `2-4 days` (medium confidence)
- **M7 - Cleanup + lock:** `1-2 days` (high confidence)

### Total expected range

- **Best realistic case:** `~11 working days`
- **Most likely:** `~15-18 working days`
- **Conservative (with rework):** `~20-24 working days`

### Main schedule risks

- Hidden variant mismatches in shared primitives (`Button`, `Input`, `Dialog`, form states)
- Dark mode parity issues discovered late in route rollout
- Public route styling conflicts (marketing/blog pages often use bespoke styles)
- Accessibility regressions requiring additional passes
- Scope growth from new Nox extension requests mid-migration

### Risk controls (to keep timeline stable)

- Keep milestone scopes strict; do not mix route migration into primitive milestones
- Freeze new visual scope while each milestone is in progress
- Treat each extension as a tracked item with explicit acceptance criteria
- Require pass/fail validation at each milestone before merging next batch

### Recommended cadence

- **2-3 milestones per week** when changes are mostly docs/tokens/primitives
- **1-2 milestones per week** during route migration waves
- Explicit checkpoint after each milestone commit (quick demo + parity board update)
