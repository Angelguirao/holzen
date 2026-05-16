# `supabase/functions/legacy/` — undeployed edge handlers

HTTP handlers moved here are **removed from** `supabase/config.toml` and **not** invoked in production.

## Recovery

1. `git show full-ia-pre-strip:supabase/config.toml` — restore `[functions.<name>]` block.
2. `git mv` handler back to `supabase/functions/<name>/`.
3. Redeploy via GitHub → Supabase sync.

## Undeployed (Step 3)

See [`docs/ops/active-surface.md`](../../../docs/ops/active-surface.md) for the live edge list.

Typical contents of `legacy/full-shell/`: `badge-notify`, `reflection-insights`, `journal-prompt`, `deliver-letters`, `night-reflection`, `fetch-source-feeds`, `generate-wallpaper`, `suggest-grounding`, `suggest-ritual`, `grounding-enrich`, and related admin ingest handlers.
