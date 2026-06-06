import { describe, expect, it } from 'vitest';
import type { MarketQuote } from '@/features/market/public';
import { buildManualPauseMarketContext } from './build-manual-pause-market-context';

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

describe('buildManualPauseMarketContext', () => {
  it('normalizes asset and builds context for bitcoin', () => {
    const ctx = buildManualPauseMarketContext(baseMarket, 5, 'bitcoin');
    expect(ctx.assetId).toBe('bitcoin');
    expect(ctx.silentMsg).toBe('BTC moved.');
    expect(ctx.severityBand).toBe('moderate');
    expect(ctx.onChainBand).toBe('100:20:15');
    expect(ctx.ctx).toContain('BTC');
  });

  it('normalizes legacy profile asset ids to bitcoin', () => {
    const ctx = buildManualPauseMarketContext(
      { ...baseMarket, changePercent: 1 },
      5,
      'ethereum',
    );
    expect(ctx.assetId).toBe('bitcoin');
    expect(ctx.onChainBand).toBe('100:20:15');
  });
});
