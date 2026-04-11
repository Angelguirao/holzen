# Nox Design System

This folder is the implementation contract for migrating Holzen to Nox.

## Canonical sources

- Figma Foundations: `c6vKLjDHRKfpluorJlT90n`
- Figma Components: `5CTApv6IlReBfdB0YS6zxq`

## Version

- Nox target version: `1.0.0`

## How to use these docs

- Read `foundations/` first to map tokens and theme behavior.
- Read `components/` to align UI primitives and states.
- Read `patterns/` for Holzen-specific compositions that are Nox-styled extensions.
- Track route rollout in `parity-board.md`.
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
