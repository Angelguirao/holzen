/**
 * Allowlisted tracked assets (CoinGecko coin ids). Kept in sync with
 * `public.update_profile_safe` and `supabase/functions/_shared/tracked-assets.ts`.
 */
export const TRACKED_ASSETS = [
  { id: 'bitcoin', symbol: 'BTC' },
  { id: 'ethereum', symbol: 'ETH' },
  { id: 'solana', symbol: 'SOL' },
  { id: 'monero', symbol: 'XMR' },
] as const;

export type TrackedAssetId = (typeof TRACKED_ASSETS)[number]['id'];

const ALLOWED = new Set<string>(TRACKED_ASSETS.map((a) => a.id));

export function isTrackedAssetId(id: string): id is TrackedAssetId {
  return ALLOWED.has(id);
}

/** Normalize DB / API input to a supported CoinGecko id; unknown → bitcoin. */
export function normalizeTrackedAssetId(raw: string | null | undefined): TrackedAssetId {
  const s = (raw ?? 'bitcoin').trim().toLowerCase();
  return isTrackedAssetId(s) ? s : 'bitcoin';
}

export function trackedAssetSymbol(id: string): string {
  const row = TRACKED_ASSETS.find((a) => a.id === id);
  return row?.symbol ?? id.slice(0, 6).toUpperCase();
}
