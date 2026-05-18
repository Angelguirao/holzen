# Architecture decisions (lightweight)

Use this folder for **non-obvious or costly-to-reverse** choices: stack picks, security boundaries, how cron vs edge functions split work, etc. Day-to-day behavior belongs in [systems/](../systems/) or [fundamentals/](../fundamentals/); this folder is for **why we chose X** when a future reader might reasonably ask “why not Y?”.

## When to add a file

- The team debated alternatives, or someone new would likely propose a different approach.
- Reversing the decision would require migrations, contract changes, or significant rework.
- Do **not** add a record for every bugfix or small refactor.

## Filename

`YYYY-MM-DD-short-title.md` (e.g. `2026-04-01-edge-function-config-toml.md`).

## Template

Copy into a new file and fill in:

```markdown
# Title

**Date:** YYYY-MM-DD  
**Status:** proposed | accepted | superseded by [link]

## Context

What problem or constraint triggered this?

## Decision

What we chose (one or two short paragraphs).

## Consequences

- Positive: …
- Negative / tradeoffs: …
- Follow-ups (optional): …
```

## Index

| Date | Title | File |
|------|--------|------|
| 2026-05-17 | Modular monolith + hexagonal client (pre-launch) | [2026-05-17-modular-monolith-hexagonal-client.md](2026-05-17-modular-monolith-hexagonal-client.md) |
| 2026-05-16 | Pause-first shipped scope | [2026-05-16-pause-first-shipped-scope.md](2026-05-16-pause-first-shipped-scope.md) |
| 2026-04-23 | Pause V2 — no fallback | [2026-04-23-pause-v2-no-fallback.md](2026-04-23-pause-v2-no-fallback.md) |
| 2026-04-23 | Skills-first stats IA | [2026-04-23-skills-first-stats-ia.md](2026-04-23-skills-first-stats-ia.md) |
| 2026-04-23 | Four-family badge reorg | [2026-04-23-four-family-badge-reorg.md](2026-04-23-four-family-badge-reorg.md) |

Add a row when you accept a decision.
