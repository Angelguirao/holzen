import { describe, expect, it } from 'vitest';
import type { MarketQuote } from '@/features/market/domain/market-quote';
import { formatHomePauseMarketBlock } from '@/features/pause/domain/home/format-home-pause-market-block';

const liveQuote: MarketQuote = {
  coinId: 'bitcoin',
  currentPrice: 100_000,
  price24hAgo: 98_000,
  changePercent: 2.1,
  direction: 'up',
  currency: 'USD',
};

describe('formatHomePauseMarketBlock', () => {
  it('includes Fear · N from context_text when present', () => {
    const block = formatHomePauseMarketBlock({
      contextText: 'BTC is up 2.1% in the last 24 hours. Market sentiment: Fear (33/100).',
      marketData: liveQuote,
      trackedAssetId: 'bitcoin',
      instanceCreatedAt: '2026-06-03T12:00:00.000Z',
    });

    expect(block.moveLine).toBe('BTC ▲ 2.1% · 24h');
    expect(block.sentimentLine).toBe('Fear · 33');
  });

  it('falls back to context_snapshot.fear_greed when context_text lacks sentiment', () => {
    const block = formatHomePauseMarketBlock({
      contextText: 'BTC is up 2.1% in the last 24 hours.',
      contextSnapshot: { fear_greed: { label: 'Fear', value: 33 } },
      marketData: { ...liveQuote, fearGreed: undefined },
      trackedAssetId: 'bitcoin',
      instanceCreatedAt: '2026-06-03T12:00:00.000Z',
    });

    expect(block.moveLine).toBe('BTC ▲ 2.1% · 24h');
    expect(block.sentimentLine).toBe('Fear · 33');
  });

  it('uses live quote F&G when context and snapshot omit sentiment', () => {
    const block = formatHomePauseMarketBlock({
      contextText: null,
      marketData: { ...liveQuote, fearGreed: { label: 'Greed', value: 72 } },
      trackedAssetId: 'bitcoin',
      instanceCreatedAt: null,
    });

    expect(block.moveLine).toBe('BTC ▲ 2.1% · 24h');
    expect(block.sentimentLine).toBe('Greed · 72');
  });
});
