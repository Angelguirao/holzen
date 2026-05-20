import {
  HOLZEN_MARKET_DISPLAY_COINGECKO_ERROR,
  HOLZEN_MARKET_DISPLAY_RETRY_ERROR,
} from './holzen-market-display-errors';

export {
  HOLZEN_MARKET_DISPLAY_COINGECKO_ERROR,
  HOLZEN_MARKET_DISPLAY_RETRY_ERROR,
  isHolzenMarketDisplayUserError,
} from './holzen-market-display-errors';

/** User-facing copy when Holzen market display query fails (Home `useHolzen` error slot). */
export function mapHolzenMarketDisplayError(input: {
  profileLoaded: boolean;
  isError: boolean;
  error: unknown;
}): string | null {
  const { profileLoaded, isError, error } = input;
  if (!profileLoaded || !isError || !error) return null;
  const raw = error instanceof Error ? error.message : String(error);
  if (raw.includes('fetch') || raw.includes('Failed to fetch')) {
    return HOLZEN_MARKET_DISPLAY_COINGECKO_ERROR;
  }
  return HOLZEN_MARKET_DISPLAY_RETRY_ERROR;
}
