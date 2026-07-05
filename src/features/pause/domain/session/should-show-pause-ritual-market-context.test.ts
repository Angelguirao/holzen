import { describe, expect, it } from 'vitest';
import type { MarketQuote } from '@/features/market/domain/market-quote';
import { shouldShowPauseRitualMarketContext } from './should-show-pause-ritual-market-context';

const quote = (changePercent: number): MarketQuote => ({
  coinId: 'bitcoin',
  currentPrice: 100,
  price24hAgo: 100,
  changePercent,
  direction: changePercent >= 0 ? 'up' : 'down',
  currency: 'USD',
  fearGreed: { value: 8, label: 'Extreme Fear' },
});

describe('shouldShowPauseRitualMarketContext', () => {
  it('hides when a pending cron offer exists', () => {
    expect(
      shouldShowPauseRitualMarketContext({
        hasPendingOffer: true,
        marketData: quote(3.2),
        threshold: 2,
        thresholdDown: 2,
      }),
    ).toBe(false);
  });

  it('hides when live quote is within daily thresholds (calm waters)', () => {
    expect(
      shouldShowPauseRitualMarketContext({
        hasPendingOffer: false,
        marketData: quote(1.1),
        threshold: 2,
        thresholdDown: 2,
      }),
    ).toBe(false);
  });

  it('shows when move is beyond thresholds and no pending offer', () => {
    expect(
      shouldShowPauseRitualMarketContext({
        hasPendingOffer: false,
        marketData: quote(3.2),
        threshold: 2,
        thresholdDown: 2,
      }),
    ).toBe(true);
  });

  it('hides until profile thresholds are loaded', () => {
    expect(
      shouldShowPauseRitualMarketContext({
        hasPendingOffer: false,
        marketData: quote(3.2),
        threshold: 2,
        thresholdDown: 2,
        profileLoaded: false,
      }),
    ).toBe(false);
  });
});
