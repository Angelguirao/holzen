import { describe, expect, it } from 'vitest';
import { resolveHomeMarketDisplayQuote } from '@/features/market/domain/home-market-display-quote';
import type { MarketQuote } from '@/features/market/domain/market-quote';

const sampleQuote = (changePercent: number, extras: Partial<MarketQuote> = {}): MarketQuote => ({
  coinId: 'bitcoin',
  currentPrice: 100_000,
  price24hAgo: 100_000,
  changePercent,
  direction: changePercent >= 0 ? 'up' : 'down',
  currency: 'USD',
  fearGreed: { value: 50, label: 'Neutral' },
  _stale: true,
  ...extras,
});

describe('resolveHomeMarketDisplayQuote', () => {
  it('returns live quote when no open cron pause', () => {
    const quote = sampleQuote(2);
    expect(
      resolveHomeMarketDisplayQuote({
        marketData: quote,
        openPauseSource: null,
        openPauseState: null,
      }),
    ).toBe(quote);
  });

  it('overlays snapshot move and fear/greed for open cron pause', () => {
    const quote = sampleQuote(0.2);
    const result = resolveHomeMarketDisplayQuote({
      marketData: quote,
      openPauseSource: 'cron_volatility',
      openPauseState: 'active',
      openPauseContextSnapshot: {
        change_24h_pct: -0.39,
        direction: 'down',
        fear_greed: { value: 12, label: 'Extreme Fear' },
      },
    });

    expect(result).toMatchObject({
      currentPrice: 100_000,
      changePercent: -0.39,
      direction: 'down',
      fearGreed: { value: 12, label: 'Extreme Fear' },
    });
    expect(result?._stale).toBeUndefined();
    expect(result?.price24hAgo).toBeCloseTo(100_000 / (1 - 0.0039), 5);
  });

  it('does not overlay manual open pauses', () => {
    const quote = sampleQuote(1);
    expect(
      resolveHomeMarketDisplayQuote({
        marketData: quote,
        openPauseSource: 'manual',
        openPauseState: 'active',
        openPauseContextSnapshot: { change_24h_pct: -6, direction: 'down' },
      }),
    ).toBe(quote);
  });

  it('returns null when market data is missing', () => {
    expect(
      resolveHomeMarketDisplayQuote({
        marketData: null,
        openPauseSource: 'cron_volatility',
        openPauseState: 'active',
        openPauseContextSnapshot: { change_24h_pct: -1 },
      }),
    ).toBeNull();
  });
});
