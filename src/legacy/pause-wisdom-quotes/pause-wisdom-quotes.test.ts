import { describe, expect, it } from 'vitest';
import { formatReinforcementQuoteFromSession } from './format-reinforcement-quote';
import { getSessionQuote } from './session-wisdom-quotes';

describe('pause-wisdom-quotes (legacy)', () => {
  it('formats reinforcement quote', () => {
    expect(formatReinforcementQuoteFromSession({ text: 'Wait', author: 'Buffett' })).toBe(
      '"Wait" — Buffett',
    );
  });

  it('returns a session quote from catalog', () => {
    const quote = getSessionQuote();
    expect(quote.text.length).toBeGreaterThan(0);
    expect(quote.author.length).toBeGreaterThan(0);
  });
});
