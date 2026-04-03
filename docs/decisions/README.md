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
| — | *(none yet)* | — |

Add a row when you accept a decision.
