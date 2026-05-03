import { describe, expect, it } from 'vitest';
import { parsePauseContextForHomePreview } from '@/lib/pause-context-home-preview';

describe('parsePauseContextForHomePreview', () => {
  it('extracts 24h BTC line and market sentiment', () => {
    const ctx =
      'BTC is down 1.1% in the last 24 hours. Over 7 days, it\'s down 3.0%. Market sentiment: Fear (33/100). Mempool: 12,000 unconfirmed txs.';
    const { btc24h, marketSentiment } = parsePauseContextForHomePreview(ctx);
    expect(btc24h).toBe('BTC is down 1.1% in the last 24 hours.');
    expect(marketSentiment).toBe('Market sentiment: Fear (33/100).');
  });

  it('handles missing sentiment', () => {
    const { btc24h, marketSentiment } = parsePauseContextForHomePreview(
      'BTC is up 0.2% in the last 24 hours.',
    );
    expect(btc24h).toBe('BTC is up 0.2% in the last 24 hours.');
    expect(marketSentiment).toBeNull();
  });

  it('handles null', () => {
    expect(parsePauseContextForHomePreview(null)).toEqual({ btc24h: null, marketSentiment: null });
  });
});
