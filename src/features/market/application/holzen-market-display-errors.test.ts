import { describe, expect, it } from 'vitest';
import {
  HOLZEN_MARKET_DISPLAY_COINGECKO_ERROR,
  HOLZEN_MARKET_DISPLAY_RETRY_ERROR,
  isHolzenMarketDisplayUserError,
} from './holzen-market-display-errors';

describe('isHolzenMarketDisplayUserError', () => {
  it('matches canonical Holzen market display messages', () => {
    expect(isHolzenMarketDisplayUserError(HOLZEN_MARKET_DISPLAY_COINGECKO_ERROR)).toBe(true);
    expect(isHolzenMarketDisplayUserError(HOLZEN_MARKET_DISPLAY_RETRY_ERROR)).toBe(true);
  });

  it('rejects manual trigger and persist-style errors', () => {
    expect(isHolzenMarketDisplayUserError('Could not connect. Check your internet and try again.')).toBe(
      false,
    );
    expect(isHolzenMarketDisplayUserError('coingecko down')).toBe(false);
  });
});
