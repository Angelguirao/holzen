import { describe, expect, it } from 'vitest';
import { mapHolzenMarketDisplayError } from './map-holzen-market-display-error';

describe('mapHolzenMarketDisplayError', () => {
  it('returns null when profile is not loaded', () => {
    expect(
      mapHolzenMarketDisplayError({
        profileLoaded: false,
        isError: true,
        error: new Error('fetch'),
      }),
    ).toBeNull();
  });

  it('maps fetch failures to CoinGecko copy', () => {
    expect(
      mapHolzenMarketDisplayError({
        profileLoaded: true,
        isError: true,
        error: new Error('Failed to fetch'),
      }),
    ).toBe('Price data unavailable. CoinGecko may be down — retrying shortly.');
  });

  it('maps other errors to generic market copy', () => {
    expect(
      mapHolzenMarketDisplayError({
        profileLoaded: true,
        isError: true,
        error: 'rate limited',
      }),
    ).toBe('Could not check market data. Will retry automatically.');
  });
});
