---
version: alpha
name: Holzen (Nox)
description: >-
  Bitcoin-aware mindfulness SPA. Visual system follows Google Stitch Nox;
  runtime tokens live in src/index.css and tailwind.config.ts.
colors:
  background-primary: "#151E30"
  background-secondary: "#1F2B40"
  background-accent: "#2E4060"
  background-deep: "#0E1524"
  background-inverse: "#DDE3EC"
  text-primary: "#DDE3EC"
  text-secondary: "#C5CED9"
  text-muted: "#7A8799"
  text-contrast: "#FFFFFF"
  text-link: "#7FA9D9"
  text-highlight: "#DBB366"
  text-inverse-contrast: "#0E1524"
  border-default: "#2E4060"
  border-focus: "#7FA9D9"
  state-success: "#4EB587"
  state-error: "#C95959"
  state-warning: "#E0B05A"
  accent-cyan: "#6BB8C7"
  accent-cyan-strong: "#2B93A8"
  accent-green: "#4EB587"
  accent-violet: "#9A8FC9"
  accent-magenta: "#BC6FCC"
  accent-mustard: "#E0B05A"
typography:
  h1-editorial:
    fontFamily: Newsreader
    fontSize: 2rem
    fontWeight: "400"
    lineHeight: "1.2"
    letterSpacing: "-0.02em"
  h2-editorial:
    fontFamily: Newsreader
    fontSize: 1.5rem
    fontWeight: "400"
    lineHeight: "1.25"
  body-md:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: "400"
    lineHeight: "1.5"
  body-sm:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: "400"
    lineHeight: "1.45"
  label-ui:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: "500"
    lineHeight: "1.3"
    letterSpacing: "0.02em"
  mono-caption:
    fontFamily: IBM Plex Mono
    fontSize: 0.625rem
    fontWeight: "500"
    lineHeight: "1.2"
    letterSpacing: "0.08em"
rounded:
  sm: 4px
  md: 8px
  lg: 12px
  full: 999px
spacing:
  category: 8px
  group: 16px
  header: 16px
  footer: 24px
  section: 32px
components:
  button-primary:
    backgroundColor: "{colors.background-inverse}"
    textColor: "{colors.text-inverse-contrast}"
    rounded: "{rounded.lg}"
    padding: 12px 16px
  button-primary-hover:
    backgroundColor: "{colors.text-secondary}"
    textColor: "{colors.text-inverse-contrast}"
  button-secondary:
    backgroundColor: "{colors.background-secondary}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.lg}"
  link-inline:
    typography: "{typography.body-sm}"
    textColor: "{colors.text-link}"
  link-inline-hover:
    textColor: "{colors.text-link}"
---

## Overview

Holzen is a **dark-first** app: one appearance (`class="dark"` on `html`), calm desaturated blues, warm mustard highlight, and **Inter** for UI with **Newsreader** for editorial moments. The product migrated to the **Nox** design system; Figma is canonical for future token tweaks, while **`src/index.css`** is the runtime source of truth.

> **Marked — implementation vs Figma extract:** Nox foundation docs under `docs/design/nox/foundations/color.md` still list Figma `color/text/link` as `#22D3EE` (bright cyan). **Shipped Holzen intentionally uses calm link blue `#7FA9D9`** (`--nox-color-text-link`) for readability and brand restraint. YAML colors above match **code**, not that stale Figma table row. When Figma and code agree again, update `color.md` and remove this callout.

> **Marked — inferred:** Elevation blur tokens and some micro-spacing are not fully specified in-repo; use subtle `bg-background/80` scrims, `border-nox-border-default`, and the spacing scale below unless design extends the spec.

## Colors

- **Surfaces:** `background-primary` (#151E30) page, `background-secondary` cards/side regions, `background-accent` hovers and muted fills.
- **Text:** `text-primary` body, `text-secondary` supporting, `text-muted` de-emphasized. Reserve **text-contrast** for on-destructive and high-contrast chip text, not body.
- **Links and tappable text affordances:** use **`text-nox-text-link`** with **`hover:text-nox-text-link/80`**. Do not use `text-primary` for links (in Holzen, `primary` maps to the **inverse button surface**, not hyperlink color).
- **Highlight / warmth:** `text-highlight` and `accent-mustard` for celebratory accents (e.g. wax seal metaphors).
- **Semantic states:** success / error / warning from YAML; destructive actions pair `state-error` with `text-contrast` foreground where needed.
- **Accents:** cyan family is **desaturated**; Tailwind `cyan` utility is **disabled** — use `nox.accent.cyan` only for intentional brand accents, not body links.

## Typography

- **UI:** Inter (`font-sans` / `font-body`). Controls, labels, and in-app navigation use sans.
- **Editorial:** Newsreader (`font-editorial`) for display headings and long-form hero titles when the screen already follows that pattern.
- **Mono:** IBM Plex Mono for code, hashes, and **narrow technical** labels — not for general section titles (prefer sans + tracking for “module” labels).
- **Scale:** align with Nox size tokens (10–64px ladder in `docs/design/nox/foundations/typography.md`); avoid arbitrary `text-[13px]` unless promoting a token.

## Layout

- **Semantic spacing (Nox):** category 8px, group 16px, header offset 16px, section gaps 32px, footer breathing 24px — see `docs/design/nox/foundations/spacing.md`.
- **Container:** Tailwind container centered, `2rem` horizontal padding, max content `1400px` at `2xl`.
- **Chrome:** bottom nav and headers follow parity rules in `docs/design/nox/parity-board.md`.

## Elevation & Depth

- Prefer **flat** hierarchy: borders (`border-nox-border-default`) and **surface step** (primary → secondary → accent) over heavy shadows.
- Overlays: `background-overlay` / scrim gradients from `background` with alpha stops.
- Focus: `border-focus` / `ring` aligned to `--nox-color-border-focus`.

## Shapes

- Default control radius: **12px** (`--radius` / `rounded-lg` in extended theme).
- Pills/chips/tags: `rounded-full`.
- Stroke: 1px default borders; 2px for emphasis / focus rings per `docs/design/nox/foundations/stroke.md`.

## Components

- **Buttons:** use shadcn `Button` variants — `default`/`primary` are inverse-filled; `secondary` is secondary surface; `outline` / `tertiary` per existing patterns; **`link`** variant must read as **hyperlink** (nox link token), not `text-primary`.
- **Cards:** `bg-card` / `border-border` (mapped to Nox secondary + border default).
- **Inputs:** shadcn input primitives; focus ring uses `ring`.
- **Holzen extensions:** pause flows, stats, and journal surfaces documented as Nox-styled extensions under `docs/design/nox/patterns/` when added.

## Do's and Don'ts

**Do**

- Use **`text-nox-text-link`** (+ optional `underline-offset-4` / `hover:underline`) for inline links and link-styled buttons.
- Map new UI to **`nox.*`** or semantic shadcn tokens (`background`, `foreground`, `muted`) wired in `src/index.css`.
- Track route-level design status in **`docs/design/nox/parity-board.md`**.

**Don't**

- Hardcode hex colors for links (e.g. legacy cyan `#24B2C8`) — use tokens.
- Use **`text-cyan`** / removed Tailwind cyan for Holzen UI.
- Use **`text-primary`** for hyperlink styling — it is the **light inverse fill** token path, not the link hue.

---

## Repo map (for agents)

| Artifact | Role |
|----------|------|
| `src/index.css` | CSS variables: Nox palette, semantic shadcn bridge, fonts |
| `tailwind.config.ts` | `nox.*` color map, `cyan: undefined`, fonts, radius |
| `docs/design/nox/` | Migration contract, components, foundations, parity |
| `docs/design/information-architecture.md` | Routes, nav, analytics names |

**Optional validation:** [`@google/design.md`](https://www.npmjs.com/package/@google/design.md) — `npx @google/design.md lint DESIGN.md` (tokens + WCAG hints). Format aligns with [Google DESIGN.md spec](https://github.com/google-labs-code/design.md).
