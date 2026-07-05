import type { WisdomQuote } from './session-wisdom-quotes';

export function formatReinforcementQuoteFromSession(quote: WisdomQuote): string {
  return `"${quote.text}" — ${quote.author}`;
}
