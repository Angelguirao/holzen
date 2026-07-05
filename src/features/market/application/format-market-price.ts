/** Formats a market quote amount in the user's display currency. */
export function formatMarketPrice(price: number, currency: string): string {
  const fractionDigits = currency === 'JPY' || currency === 'KRW' ? 0 : 0;
  return price.toLocaleString('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: fractionDigits,
  });
}

/** @deprecated Prefer formatMarketPrice */
export const formatBtcPrice = formatMarketPrice;
