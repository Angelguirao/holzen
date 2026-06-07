import { describe, expect, it } from 'vitest';
import {
  resolveHomeMarketRangeStatus,
  resolveMarketVolatilityRangeStatus,
} from '@/features/market/domain/market-volatility-range-status';
import type { MarketQuote } from '@/features/market/domain/market-quote';

const sampleQuote = (changePercent: number): MarketQuote => ({
  coinId: 'bitcoin',
  currentPrice: 100,
  price24hAgo: 100,
  changePercent,
  direction: changePercent >= 0 ? 'up' : 'down',
  currency: 'USD',
});

describe('resolveMarketVolatilityRangeStatus', () => {
  const profile = { threshold: 5, threshold_down: 5 };

  it('returns within when daily move is below thresholds', () => {
    expect(
      resolveMarketVolatilityRangeStatus(profile, {
        changePercent: 3,
        direction: 'up',
      }),
    ).toEqual({ kind: 'within' });
  });

  it('returns daily_down when down move breaches threshold', () => {
    expect(
      resolveMarketVolatilityRangeStatus(profile, {
        changePercent: -6,
        direction: 'down',
      }),
    ).toEqual({ kind: 'beyond', axis: 'daily_down' });
  });

  it('returns daily_up when up move breaches threshold', () => {
    expect(
      resolveMarketVolatilityRangeStatus(profile, {
        changePercent: 7,
        direction: 'up',
      }),
    ).toEqual({ kind: 'beyond', axis: 'daily_up' });
  });
});

describe('resolveHomeMarketRangeStatus', () => {
  it('uses live quote when no open cron pause', () => {
    expect(
      resolveHomeMarketRangeStatus({
        marketData: sampleQuote(3),
        threshold: 5,
        thresholdDown: 5,
        openPauseSource: null,
        openPauseState: null,
      }),
    ).toEqual({ kind: 'within' });
  });

  it('shows beyond when open cron pause exists even if live quote is stale-within', () => {
    expect(
      resolveHomeMarketRangeStatus({
        marketData: sampleQuote(0.4),
        threshold: 5,
        thresholdDown: 5,
        openPauseSource: 'cron_volatility',
        openPauseState: 'active',
        openPauseContextSnapshot: {
          change_24h_pct: 0.7,
          direction: 'up',
        },
      }),
    ).toEqual({ kind: 'beyond', axis: 'daily_up' });
  });

  it('uses live within when engaged cron pause and market has settled', () => {
    expect(
      resolveHomeMarketRangeStatus({
        marketData: sampleQuote(0.4),
        threshold: 5,
        thresholdDown: 5,
        openPauseSource: 'cron_volatility',
        openPauseState: 'engaged',
        openPauseContextSnapshot: {
          change_24h_pct: -7,
          direction: 'down',
        },
      }),
    ).toEqual({ kind: 'within' });
  });

  it('does not force beyond for manual open pauses', () => {
    expect(
      resolveHomeMarketRangeStatus({
        marketData: sampleQuote(2),
        threshold: 5,
        thresholdDown: 5,
        openPauseSource: 'manual',
        openPauseState: 'active',
        openPauseContextSnapshot: { change_24h_pct: 2, direction: 'up' },
      }),
    ).toEqual({ kind: 'within' });
  });
});
