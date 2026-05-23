# Nox Design System

This folder is the implementation contract for migrating Holzen to Nox.

## AI / agent quick path

- **[DESIGN.md](../../DESIGN.md)** (repo root) — portable [Google DESIGN.md](https://github.com/google-labs-code/design.md) summary: YAML tokens + prose, Holzen-specific rules (links, dark-first), and **marked** gaps where implementation diverges from Figma extracts. Use alongside this folder; tokens in **`src/index.css`** win at runtime.

## Canonical sources

- Figma Foundations: `c6vKLjDHRKfpluorJlT90n`
- Figma Components: `5CTApv6IlReBfdB0YS6zxq`

## Version

- Nox target version: `1.0.0`

## How to use these docs

- Read `foundations/` first to map tokens and theme behavior.
- Read `components/` to align UI primitives and states.
- Read `patterns/` for Holzen-specific compositions that are Nox-styled extensions.
- Track route rollout in `parity-board.md` — **live shipped routes** → [active-surface.md](../../ops/active-surface.md); parity board includes full-IA legacy URLs for recovery audits.
- Use `visual-parity-qa.md` for strict screenshot-based sign-off.
- Read `extraction/` for raw ingestion snapshots from Figma MCP runs.

## Migration policy

- If covered by Nox: implement directly.
- If partially covered: use Nox primitives and adapt missing parts to Nox behavior.
- If not covered: create a Nox-styled Holzen extension and document it under `patterns/`.

## Status model

- `draft`: not yet migrated in code
- `partial`: migrated in some routes/components
- `stable`: migration complete and verified
- `extension`: Holzen-specific component/pattern aligned to Nox style
