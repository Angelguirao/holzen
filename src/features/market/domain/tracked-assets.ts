/**
 * Shipped tracked-asset catalog. Keep in sync with `public.update_profile_safe` and
 * `supabase/functions/_shared/tracked-assets.ts`.
 *
 * Pause-first ships bitcoin only. `profiles.tracked_asset_id` stores a provider-native id
 * (CoinGecko coin id today). Future asset classes (equities, etc.) extend this catalog and
 * quote adapters — see docs/backlog/tracked-asset-class-evolution.md.
 */
export type AssetQuoteProvider = 'coingecko';

/** Asset class for gating BTC-specific product features (on-chain, unit basis, etc.). */
export type TrackedAssetKind = 'crypto';

export interface TrackedAssetDefinition {
  /** Provider-native id (CoinGecko coin id today). */
  id: string;
  symbol: string;
  kind: TrackedAssetKind;
  provider: AssetQuoteProvider;
}

export const BITCOIN_TRACKED_ASSET = {
  id: 'bitcoin',
  symbol: 'BTC',
  kind: 'crypto',
  provider: 'coingecko',
} as const satisfies TrackedAssetDefinition;

/** Active choices in Settings / onboarding (subset of future catalog). */
export const TRACKED_ASSETS = [BITCOIN_TRACKED_ASSET] as const;

export type TrackedAssetId = (typeof TRACKED_ASSETS)[number]['id'];

const SHIPPED_IDS = new Set<string>(TRACKED_ASSETS.map((a) => a.id));

export function isTrackedAssetId(id: string): id is TrackedAssetId {
  return SHIPPED_IDS.has(id);
}

/** Normalize DB / API input to a shipped id; unknown → bitcoin. */
export function normalizeTrackedAssetId(raw: string | null | undefined): TrackedAssetId {
  const s = (raw ?? 'bitcoin').trim().toLowerCase();
  return isTrackedAssetId(s) ? s : 'bitcoin';
}

export function trackedAssetDefinition(id: string): TrackedAssetDefinition | undefined {
  return TRACKED_ASSETS.find((a) => a.id === normalizeTrackedAssetId(id));
}

export function trackedAssetSymbol(id: string): string {
  const row = trackedAssetDefinition(id);
  return row?.symbol ?? id.slice(0, 6).toUpperCase();
}

/** True when the normalized asset is bitcoin (on-chain, unit basis, zoom-out anniversary, etc.). */
export function isBitcoinTrackedAsset(id: string | null | undefined): boolean {
  return normalizeTrackedAssetId(id) === 'bitcoin';
}
