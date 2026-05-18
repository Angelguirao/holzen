/**
 * Shared window for "don't repeat this serve" logic (library + cache).
 *
 * Applies to both `searchCompanionCatalog` (companion_catalog dedup) and `serveFromCache`
 * (companion_cache dedup) so the two tiers stay aligned.
 *
 * Chosen to work for the three usage cadences we actually see:
 *   - Daily pausers: last 30 items excluded → feels fresh against current catalogs.
 *   - Weekly pausers: last ~4 items excluded → rotation stays varied.
 *   - Monthly / sporadic pausers: at least one guaranteed fresh item each time
 *     (instead of the 7-day window landing exactly on their previous serve).
 *
 * Bumped from 7 → 30 on 2026-04-18 together with the strict cache fix
 * (`serveFromCache` no longer pre-empts live with a pass-3 relaxation in
 * main-flow), which makes a wider window safe: if the strict pool is empty,
 * live generation runs and refills the cache instead of recycling seen rows.
 */
export const COMPANION_SERVE_FRESHNESS_DAYS = 30;
