/**
 * Client-side mirror of the edge-side context fingerprint helper.
 *
 * Kept in sync manually with `supabase/functions/_shared/pause.ts`:
 *   - `bucketChangePercent` rounds signed BTC percents into stable buckets.
 *   - `computeContextFingerprint` hashes the regime-relevant context parts.
 *
 * Two identical implementations exist (browser + Deno) because there's no
 * shared-source strategy set up between the two runtimes today. The TS
 * test suite covers both via this module; the edge has its own deno-side
 * smoke tests once we stand them up.
 */

export function bucketChangePercent(pct: number): number {
  if (!Number.isFinite(pct)) return 0;
  const abs = Math.abs(pct);
  const sign = pct < 0 ? -1 : 1;
  let bucket: number;
  if (abs < 1) bucket = 0;
  else if (abs < 3) bucket = 2;
  else if (abs < 5) bucket = 4;
  else if (abs < 7) bucket = 6;
  else if (abs < 10) bucket = 8;
  else bucket = Math.floor(abs / 2) * 2;
  return sign * bucket;
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
  cumulativeBucketPct: number;
  fearGreedBand?: string | null;
  onChainBand?: string | null;
}): Promise<string> {
  const payload = JSON.stringify({
    t: parts.templateSlug,
    d: parts.directionBucket,
    s: parts.severityBand,
    db: parts.dailyBucketPct,
    cb: parts.cumulativeBucketPct,
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
