import { describe, expect, it } from 'vitest';
import type { MarketQuote } from '@/features/market/domain/market-quote';
import { resolveEngagedPauseMarketSettled } from './resolve-engaged-pause-market-settled';

const quote = (changePercent: number): MarketQuote => ({
  coinId: 'bitcoin',
  currentPrice: 100,
  price24hAgo: 100,
  changePercent,
  direction: changePercent >= 0 ? 'up' : 'down',
  currency: 'USD',
});

describe('resolveEngagedPauseMarketSettled', () => {
  it('is false for active open pause', () => {
    expect(
      resolveEngagedPauseMarketSettled({
        openPauseState: 'active',
        marketData: quote(1),
        threshold: 5,
        thresholdDown: 5,
      }),
    ).toBe(false);
  });

  it('is true when engaged and live move is within thresholds', () => {
    expect(
      resolveEngagedPauseMarketSettled({
        openPauseState: 'engaged',
        marketData: quote(2),
        threshold: 5,
        thresholdDown: 5,
      }),
    ).toBe(true);
  });

  it('is false when engaged but move still breaches thresholds', () => {
    expect(
      resolveEngagedPauseMarketSettled({
        openPauseState: 'engaged',
        marketData: quote(-8),
        threshold: 5,
        thresholdDown: 5,
      }),
    ).toBe(false);
  });
});
