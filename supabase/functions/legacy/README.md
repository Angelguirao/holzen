# `supabase/functions/legacy/` — undeployed edge handlers

HTTP handlers moved here are **removed from** `supabase/config.toml` and **not** invoked in production.

## Recovery

1. `git show full-ia-pre-strip:supabase/config.toml` — restore `[functions.<name>]` block.
2. `git mv` handler back to `supabase/functions/<name>/`.
3. Redeploy via GitHub → Supabase sync.

## Undeployed (Step 3)

See [`docs/ops/active-surface.md`](../../../docs/ops/active-surface.md) for the live edge list.

Contents of `legacy/full-shell/` (Step 3): `badge-notify`, `reflection-insights`, `journal-prompt`, `deliver-letters`, `night-reflection`, `weekly-digest`, `monthly-report`, `personalized-nudge`, `generate-wallpaper`, `suggest-grounding`, `suggest-ritual`, `fetch-source-feeds`, `admin-library-preview`.

**Still deployed:** `grounding-enrich` remains at `supabase/functions/grounding-enrich/` (companion grounding).
