import { describe, expect, it } from 'vitest';
import type { MarketQuote } from '@/features/market/public';
import { resolvePauseDepthContextLineParams } from './resolve-pause-depth-context-line-params';

const sampleBtc = (changePercent: number): MarketQuote => ({
  coinId: 'bitcoin',
  currentPrice: 100,
  price24hAgo: 100,
  changePercent,
  direction: 'down',
  currency: 'USD',
});

describe('resolvePauseDepthContextLineParams', () => {
  it('returns null when marketData is missing', () => {
    expect(resolvePauseDepthContextLineParams(null, 'btc')).toBeNull();
  });

  it('uses absolute change percent and tracked symbol', () => {
    expect(resolvePauseDepthContextLineParams(sampleBtc(-2.5), 'btc')).toEqual({
      sym: 'BTC',
      pct: '2.5',
    });
  });
});
