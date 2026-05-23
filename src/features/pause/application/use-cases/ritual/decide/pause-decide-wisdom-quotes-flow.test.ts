import { describe, expect, it } from 'vitest';

import { getSessionQuote as getSessionQuoteDirect } from './wisdom-quotes';

import { getSessionQuote } from './pause-decide-wisdom-quotes-flow';

describe('pause-decide-wisdom-quotes-flow', () => {
  it('re-exports session wisdom quote helper from wisdom-quotes', () => {
    expect(typeof getSessionQuote).toBe('function');
    expect(getSessionQuote).toBe(getSessionQuoteDirect);
  });
});
