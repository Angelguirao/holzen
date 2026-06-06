import { describe, expect, it } from 'vitest';
import type { MarketQuote } from '@/features/market/public';
import { formatPauseDepthPickerMarketLines } from '@/features/pause/domain/feel/format-pause-depth-picker-market-lines';

const sampleQuote = (overrides: Partial<MarketQuote> = {}): MarketQuote => ({
  coinId: 'bitcoin',
  currentPrice: 100,
  price24hAgo: 100,
  changePercent: 1.1,
  direction: 'up',
  currency: 'USD',
  fearGreed: { value: 32, label: 'Fear' },
  ...overrides,
});

describe('formatPauseDepthPickerMarketLines', () => {
  it('returns null when market data is missing', () => {
    expect(formatPauseDepthPickerMarketLines(null, 'bitcoin')).toBeNull();
  });

  it('formats move arrow, pct, and fear/greed for depth picker', () => {
    expect(formatPauseDepthPickerMarketLines(sampleQuote(), 'bitcoin')).toEqual({
      sym: 'BTC',
      arrow: '▲',
      direction: 'up',
      pct: '1.1',
      sentimentLine: 'Fear · 32',
    });
  });

  it('uses down arrow for negative moves', () => {
    expect(
      formatPauseDepthPickerMarketLines(
        sampleQuote({ changePercent: -2.5, direction: 'down' }),
        'bitcoin',
      )?.arrow,
    ).toBe('▼');
  });
});
