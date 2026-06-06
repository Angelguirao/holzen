import { describe, expect, it } from 'vitest';
import type { MarketQuote } from '@/features/market/public';
import { buildManualPauseOpenParams } from './build-manual-pause-open-params';

const baseMarket: MarketQuote = {
  coinId: 'bitcoin',
  currentPrice: 100000,
  price24hAgo: 106000,
  direction: 'down',
  currency: 'USD',
  changePercent: -6,
  cumulativeChangePercent: -8,
  fearGreed: { value: 25, label: 'Fear' },
  onChain: {
    mempoolSize: 100,
    fastestFee: 20,
    medianFee: 15,
  },
};

describe('buildManualPauseOpenParams', () => {
  it('maps to openManualPauseFromHome params', () => {
    const params = buildManualPauseOpenParams({
      userId: 'user-1',
      silentMode: false,
      mood: 'anxious',
      data: baseMarket,
      profileTrackedAssetId: 'bitcoin',
    });
    expect(params.userId).toBe('user-1');
    expect(params.contextText).toBe(params.ctx);
    expect(params.trackedAssetId).toBe('bitcoin');
    expect(params.mood).toBe('anxious');
    expect(params.fearGreedLabel).toBe('Fear');
    expect(params.silentMsg).toBe('BTC moved.');
  });
});
