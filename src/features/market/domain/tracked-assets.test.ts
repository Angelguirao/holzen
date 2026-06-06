import { describe, expect, it } from 'vitest';
import {
  BITCOIN_TRACKED_ASSET,
  TRACKED_ASSETS,
  isBitcoinTrackedAsset,
  isTrackedAssetId,
  normalizeTrackedAssetId,
  trackedAssetDefinition,
  trackedAssetSymbol,
} from './tracked-assets';

describe('tracked-assets', () => {
  it('ships bitcoin only', () => {
    expect(TRACKED_ASSETS).toEqual([BITCOIN_TRACKED_ASSET]);
    expect(isTrackedAssetId('bitcoin')).toBe(true);
    expect(isTrackedAssetId('ethereum')).toBe(false);
  });

  it('normalizes unknown ids to bitcoin', () => {
    expect(normalizeTrackedAssetId('ethereum')).toBe('bitcoin');
    expect(normalizeTrackedAssetId(null)).toBe('bitcoin');
    expect(normalizeTrackedAssetId('  BITCOIN ')).toBe('bitcoin');
  });

  it('resolves symbol and definition for shipped assets', () => {
    expect(trackedAssetSymbol('bitcoin')).toBe('BTC');
    expect(trackedAssetSymbol('ethereum')).toBe('BTC');
    expect(trackedAssetDefinition('bitcoin')).toEqual(BITCOIN_TRACKED_ASSET);
  });

  it('flags bitcoin-specific product features', () => {
    expect(isBitcoinTrackedAsset('bitcoin')).toBe(true);
    expect(isBitcoinTrackedAsset('ethereum')).toBe(true);
    expect(isBitcoinTrackedAsset(undefined)).toBe(true);
  });
});
