/** Formats a market quote amount in the user's display currency. */
export function formatBtcPrice(price: number, currency: string): string {
  const fractionDigits = currency === 'JPY' || currency === 'KRW' ? 0 : 0;
  return price.toLocaleString('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: fractionDigits,
  });
}
