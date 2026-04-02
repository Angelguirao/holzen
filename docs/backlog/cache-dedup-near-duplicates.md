# Cache and content dedup: near-duplicates (Pending)

## Context (from Phase 4)

- **`fetch-source-feeds`** dedups `content_library` inserts by **exact `title` match**.
- **`pregenerate-companions`** dedups against `companion_cache` using **title similarity** checks.

If prompts, models, or formatting change slightly, **near-duplicate** rows can accumulate (same URL, trivial title edits, whitespace).

## Current problem

Dedup keys may be **too weak** for "meaningful duplicate" detection: caches grow, quality mix degrades, and users may see repetitive Signal/Grounding or companion cache entries.

## Implications if we leave it as-is

- Storage and query cost creep.
- Harder to maintain quality tiers in `companion_cache` and `content_library`.

## Proposed improvement

- **Stronger keys**: normalize title (trim, lowercase, collapse whitespace), add **URL** or **content hash** where available before insert.
- **Per-table policy**: `content_library` may favor URL+source; `companion_cache` may favor type + normalized title + hash of body snippet.
- **Measure**: sample duplicate-ish rows in production (or staging) before changing logic.

## Related code pointers

- `supabase/functions/fetch-source-feeds/index.ts`
- `supabase/functions/pregenerate-companions/index.ts`

## Acceptance criteria / how to verify

1. Insert path rejects or updates existing rows when URL or normalized title matches, not only exact raw title.
2. Duplicate rate drops in metrics or manual spot checks after deploy.
