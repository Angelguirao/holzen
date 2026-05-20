import { describe, expect, it } from 'vitest';
import {
  buildManualPauseMarketContext,
  buildManualPauseOpenParams,
} from './build-manual-pause-open-params';

const baseMarket = {
  changePercent: -6,
  cumulativeChangePercent: -8,
  fearGreed: { label: 'Fear' as const },
  onChain: {
    mempoolSize: 100,
    fastestFee: 20,
    medianFee: 15,
  },
};

describe('buildManualPauseMarketContext', () => {
  it('normalizes asset and builds context for bitcoin', () => {
    const ctx = buildManualPauseMarketContext(baseMarket, 5, 'bitcoin');
    expect(ctx.assetId).toBe('bitcoin');
    expect(ctx.silentMsg).toBe('BTC moved.');
    expect(ctx.severityBand).toBe('moderate');
    expect(ctx.onChainBand).toBe('100:20:15');
    expect(ctx.ctx).toContain('BTC');
  });

  it('omits onChain band for non-bitcoin assets', () => {
    const ctx = buildManualPauseMarketContext(
      { ...baseMarket, changePercent: 1 },
      5,
      'ethereum',
    );
    expect(ctx.assetId).toBe('ethereum');
    expect(ctx.onChainBand).toBeNull();
  });
});

describe('buildManualPauseOpenParams', () => {
  it('maps to openManualPauseFromHome params', () => {
    const params = buildManualPauseOpenParams({
      userId: 'user-1',
      silentMode: false,
      mood: 'anxious',
      data: baseMarket,
      cumulativeThreshold: 5,
      profileTrackedAssetId: 'bitcoin',
    });
    expect(params.userId).toBe('user-1');
    expect(params.contextText).toBe(params.ctx);
    expect(params.trackedAssetId).toBe('bitcoin');
    expect(params.mood).toBe('anxious');
    expect(params.fearGreedLabel).toBe('Fear');
  });
});
