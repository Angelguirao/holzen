import { describe, it, expect } from 'vitest';
import { normalizePerplexityCitations } from './perplexity-client.ts';

describe('normalizePerplexityCitations', () => {
  it('merges search_results urls when citations is empty', () => {
    const data = {
      citations: [],
      search_results: [
        { url: 'https://bitcoinmagazine.com/a', title: 'x' },
        { url: 'https://bitcoinmagazine.com/b', title: 'y' },
      ],
    };
    expect(normalizePerplexityCitations(data, '')).toEqual([
      'https://bitcoinmagazine.com/a',
      'https://bitcoinmagazine.com/b',
    ]);
  });

  it('dedupes overlapping citations and search_results', () => {
    const data = {
      citations: ['https://x.com/1'],
      search_results: [{ url: 'https://x.com/1' }],
    };
    expect(normalizePerplexityCitations(data, '')).toEqual(['https://x.com/1']);
  });

  it('extracts https URLs from assistant message when metadata is empty', () => {
    const data = { citations: [], search_results: [] };
    const content = 'See https://nakamotoinstitute.org/mempool/foo/ for the essay.';
    expect(normalizePerplexityCitations(data, content)).toContain('https://nakamotoinstitute.org/mempool/foo/');
  });
});
