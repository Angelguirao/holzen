/**
 * Same rules as `normalizeSourceUrl` in edge feed-ingest (https default, trim, trailing-dot fix).
 * Keeps admin library URL entry consistent with fetch-source-feeds dedup.
 */
export { normalizeSourceUrl as normalizeLibraryItemUrl } from '../../../../supabase/functions/_shared/feed-ingest.ts';
