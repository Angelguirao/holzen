import { describe, expect, it } from 'vitest';

import { nextExpandedWithLazyFetch as nextExpandedDirect } from './next-expanded-with-lazy-fetch';

import { nextExpandedWithLazyFetch } from './pause-companion-section-expansion-flow';

describe('pause-companion-section-expansion-flow', () => {
  it('re-exports lazy-fetch expansion from next-expanded-with-lazy-fetch', () => {
    expect(typeof nextExpandedWithLazyFetch).toBe('function');
    expect(nextExpandedWithLazyFetch).toBe(nextExpandedDirect);
  });
});
