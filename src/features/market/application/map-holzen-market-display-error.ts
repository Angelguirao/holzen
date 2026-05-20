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
    return 'Price data unavailable. CoinGecko may be down — retrying shortly.';
  }
  return 'Could not check market data. Will retry automatically.';
}
