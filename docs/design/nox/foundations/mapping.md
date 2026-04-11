---
title: Nox to Holzen Token Mapping
nox_version: 1.0.0
status: draft
---

# Token Mapping Contract

This mapping defines how Nox tokens feed existing Holzen semantic variables.

## Color

| Nox token | Holzen semantic var | Notes |
|---|---|---|
| `color/background/primary` | `--background` | app surface background |
| `color/text/primary` | `--foreground` | primary text |
| `color/background/secondary` | `--secondary` | secondary surface |
| `color/text/secondary` | `--secondary-foreground` | secondary text |
| `color/background/accent` | `--accent` | hover/accent surfaces |
| `color/text/contrast` | `--accent-foreground` / `--primary-foreground` | choose by context |
| `color/border/default` | `--border`, `--input` | default borders |
| `color/border/focus` | `--ring` | focus ring |
| `color/state/error` | `--destructive` | destructive color |

## Typography

| Nox token | Holzen semantic var |
|---|---|
| `font-family-ui` | `--font-body` |
| `font-family-editorial` | `--font-editorial` (new) |

## Radius

| Nox token | Holzen semantic var |
|---|---|
| `radius-m` | `--radius` |

## Gaps policy

- If a Nox token has no direct Holzen equivalent, add a `--nox-*` alias first.
- Promote repeated custom usage into a documented extension token.
