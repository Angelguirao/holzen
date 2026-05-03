---
title: Nox Color Tokens
figma_file_key: c6vKLjDHRKfpluorJlT90n
nox_version: 1.0.0
status: draft
---

# Color

> **Implementation note (Holzen):** shipped link color is **calm blue `#7FA9D9`** (`--nox-color-text-link`), not the Figma table row below for `color/text/link` (`#22D3EE`). See **[DESIGN.md](../../../DESIGN.md)** for the agent-oriented summary. When Figma variables match production again, update this table and `src/index.css` together.

## Semantic tokens

- `color/text/{primary,secondary,muted,contrast,highlight,link}`
- `color/accent/{cyan,green,violet,magenta}`
- `color/state/{error,success,warning}`
- `color/border/{focus,default}`
- `color/background/{primary,secondary,accent,inverse,overlay}`

## Extracted values (Figma variables)

Dark mode values from variable collection `color semantic tokens`:

| Token | Value |
|---|---|
| `color/text/contrast` | `#FFFFFFFF` |
| `color/text/primary` | `#F0F3F7FF` |
| `color/text/secondary` | `#C1CBD7FF` |
| `color/text/muted` | `#7B8A9EFF` |
| `color/text/inverse-contrast` | `#0A0F1AFF` |
| `color/text/inverse-primary` | `#0F172AFF` |
| `color/text/inverse-secondary` | `#9DAAB8FF` |
| `color/text/highlight` | `#DBB366FF` |
| `color/text/link` | `#22D3EEFF` |
| `color/background/primary` | `#0F172AFF` |
| `color/background/secondary` | `#1A2333FF` |
| `color/background/accent` | `#2A3B54FF` |
| `color/background/inverse` | `#F0F3F7FF` |
| `color/background/overlay` | `#0F172AE5` |
| `color/border/default` | `#2A3B54FF` |
| `color/border/focus` | `#7B8A9EFF` |
| `color/state/success` | `#7EC7A8FF` |
| `color/state/error` | `#DC2626FF` |
| `color/state/warning` | `#D97706FF` |
| `color/accent/cyan` | `#06B6D4FF` |
| `color/accent/green` | `#34D399FF` |
| `color/accent/violet` | `#A78BFAFF` |
| `color/accent/magenta` | `#D946EFFF` |
| `color/accent/mustard` | `#FBBF24FF` |

## Specific tokens

- `button/{primary,secondary,tertiary}/{background,border}/{active,pressed,disabled}`

Button/link specific tokens from collection `color specific tokens`:

| Token | Value |
|---|---|
| `button/primary/background/active` | `#F0F3F7FF` |
| `button/primary/text/default` | `#0A0F1AFF` |
| `button/primary/background/pressed` | `#C1CBD7FF` |
| `button/primary/background/disabled` | `#2A3B54FF` |
| `button/primary/text/disabled` | `#7B8A9EFF` |
| `button/secondary/background/active` | `#0F172AFF` |
| `button/secondary/text/default` | `#F0F3F7FF` |
| `button/secondary/background/pressed` | `#0A0F1AFF` |
| `button/secondary/background/disabled` | `#C1CBD7FF` |
| `button/secondary/text/disabled` | `#FFFFFFFF` |
| `button/tertiary/border/active` | `#F0F3F7FF` |
| `button/tertiary/border/pressed` | `#C1CBD7FF` |
| `button/tertiary/border/disabled` | `#7B8A9EFF` |
| `link/text/active` | `#22D3EEFF` |
| `link/text/pressed` | `#0284C7FF` |
| `link/text/disabled` | `#0C4A6EFF` |

## Usage rules

- Prefer semantic tokens in app code.
- Use specific tokens only for component-internal states where semantic tokens are insufficient.
- Keep light/dark mode values in token definitions, not in component-local overrides.
