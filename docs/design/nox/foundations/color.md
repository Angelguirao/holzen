---
title: Nox Color Tokens
figma_file_key: c6vKLjDHRKfpluorJlT90n
nox_version: 1.0.0
status: draft
---

# Color

## Semantic tokens

- `color/text/{primary,secondary,muted,contrast,highlight,link}`
- `color/accent/{cyan,green,violet,magenta}`
- `color/state/{error,success,warning}`
- `color/border/{focus,default}`
- `color/background/{primary,secondary,accent,inverse,overlay}`

## Specific tokens

- `button/{primary,secondary,tertiary}/{background,border}/{active,pressed,disabled}`

## Usage rules

- Prefer semantic tokens in app code.
- Use specific tokens only for component-internal states where semantic tokens are insufficient.
- Keep light/dark mode values in token definitions, not in component-local overrides.
