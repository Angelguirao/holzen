/**
 * Client-side mirror of the edge-side context fingerprint helper.
 *
 * Kept in sync manually with `supabase/functions/_shared/pause.ts`:
 *   - `bucketChangePercent` truncates signed market percents to whole points.
 *   - `computeContextFingerprint` hashes the regime-relevant context parts.
 *
 * Two identical implementations exist (browser + Deno) because there's no
 * shared-source strategy set up between the two runtimes today. The TS
 * test suite covers both via this module; the edge has its own deno-side
 * smoke tests once we stand them up.
 */

/** Truncate to whole percentage points so 5.1% and 5.9% share one regime. */
export function bucketChangePercent(pct: number): number {
  if (!Number.isFinite(pct)) return 0;
  return Math.trunc(pct);
}

/**
 * Hex-encoded SHA-256 of a deterministic JSON serialization of the
 * regime-relevant context parts. Returns the first 32 hex chars (128 bits).
 *
 * Uses the browser WebCrypto API (available in both `window.crypto.subtle`
 * and Deno's `crypto.subtle`). No Node fallback — this file only runs in
 * the browser or in jsdom tests where WebCrypto is polyfilled.
 */
export async function computeContextFingerprint(parts: {
  templateSlug: string;
  directionBucket: string;
  severityBand: string;
  dailyBucketPct: number;
  /** CoinGecko coin id — keeps fingerprints distinct across assets. */
  trackedAssetId?: string;
  fearGreedBand?: string | null;
  onChainBand?: string | null;
}): Promise<string> {
  const payload = JSON.stringify({
    t: parts.templateSlug,
    d: parts.directionBucket,
    s: parts.severityBand,
    db: parts.dailyBucketPct,
    a: parts.trackedAssetId ?? 'bitcoin',
    fg: parts.fearGreedBand ?? null,
    oc: parts.onChainBand ?? null,
  });
  const bytes = new TextEncoder().encode(payload);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const view = new Uint8Array(digest);
  let hex = '';
  for (let i = 0; i < view.length; i++) {
    hex += view[i].toString(16).padStart(2, '0');
  }
  return hex.slice(0, 32);
}
