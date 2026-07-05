# Grounding citation enrichment (legacy)

**Undeployed** with pause-first simplification: one `companion-orchestrate` generation per grounding slot, then read-only full view (nudge + citation link only).

## Recovery

1. Restore `[functions.grounding-enrich]` in `supabase/config.toml` from git history.
2. `git mv supabase/functions/legacy/grounding-enrich supabase/functions/grounding-enrich` (or copy handler back).
3. Re-export hooks from `src/features/pause/public-ritual-frame.ts` and wire `CompanionGroundingPage` + `GroundingFullView.enrichmentSlot`.
4. Redeploy edges; add back to `EdgeCoverageScreen.tsx`, `scripts/check-invoke-edge-allowlist.mjs`, and `bruno/active/functions-catalog.md`.

**DB:** `grounding_enrichment_cache` was dropped in `20260604120000_pause_first_zombie_schema_cleanup.sql`. Recovery: re-run `20260418140000_grounding_enrichment_cache.sql` (or restore from git) before redeploying the edge.
