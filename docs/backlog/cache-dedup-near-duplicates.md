# Cache and content dedup: near-duplicates (Done — 2026-04)

## What shipped

### `content_library` (`fetch-source-feeds`)

- Dedup checks **canonical URL variants** (`.in("url", …)` with raw + normalized host/path) and **`title_norm`** (trim + lowercase + collapsed whitespace), not only exact raw `title`.
- New rows store **`url`** as **`canonicalContentUrl(...)`** when parsing succeeds, so future runs align with the URL index.
- Migration **`20260403180000_content_library_title_norm_url_index.sql`**: generated **`title_norm`** column (matches JS `normalizeTitleKey`) + indexes on **`(type, title_norm)`** and **`url`**.

### `companion_cache` (`pregenerate-companions`)

- Shared module **`supabase/functions/_shared/content-dedup.ts`**: `normalizeTitleKey`, `canonicalContentUrl`, `contentSnippetFingerprint`, `isCompanionCacheDuplicate`.
- Inserts set **`title`**, **`title_norm`**, **`source_url`** (canonical), and **`fingerprint`** (SHA-256 prefix of normalized body snippet) so indexed columns are populated for new rows.
- **`isCompanionCacheDuplicate`** uses **indexed** lookups first (`title_norm`, `source_url`, `fingerprint`), then a **fuzzy** pass on the last 120 rows (legacy rows without norms / near-similar titles).

## Related code

- `supabase/functions/_shared/content-dedup.ts`
- `supabase/functions/fetch-source-feeds/index.ts`
- `supabase/functions/pregenerate-companions/index.ts`
- `supabase/migrations/20260403180000_content_library_title_norm_url_index.sql`

## How to verify

1. Apply migration; run **`fetch-source-feeds`** twice on the same source — second run should skip with URL or normalized title message, not insert a second row.
2. Run **`pregenerate-companions`** — logs may show **`SKIPPED duplicate`** when title, URL, or body fingerprint matches an indexed row.
