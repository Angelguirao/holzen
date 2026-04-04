# Grounding: `reflection_companions` vs `reflections` (historical)

**Status:** superseded (2026-04) — **no denormalized grounding writes.**

## Current model

- **Source of truth:** `reflection_companions` row with `companion_type = ground_nudge` (title/body/citation/url + `read`).
- **`writeCompanionData`:** upserts that row only (no `reflections.grounding_*` updates).
- **Reads:** `v_reflection_with_companions` exposes `grounding_title`, `grounding_body`, `grounding_read` as `COALESCE(join, legacy columns)` so old rows still work.
- **Manual holzen-reflect:** client upserts `ground_nudge` after `reflections` insert; insert does not set `grounding_*` on `reflections`.
- **Mark read (UI):** `use-companion-data` updates `reflection_companions` for grounding; legacy `reflections.grounding_read` is fallback-only when no join row exists.

## Migrations

- `20260403140000_view_grounding_single_source.sql` — view prefers join over legacy columns.
- `20260403120000_reflection_companions_authenticated_insert.sql` — authenticated INSERT for client upserts (still required).

Optional later: backfill + drop `reflections.grounding_title` / `grounding_body` / `grounding_read` if you want a fully normalized schema.
