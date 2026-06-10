import { describe, expect, it, vi } from 'vitest';
import { nextExpandedWithLazyFetch } from './next-expanded-with-lazy-fetch';

describe('nextExpandedWithLazyFetch', () => {
  it('collapses when currently expanded', () => {
    const fetch = vi.fn();
    expect(
      nextExpandedWithLazyFetch(true, {
        data: null,
        loading: false,
        error: null,
        canAccess: () => true,
        fetch,
        slot: 'signal',
      }),
    ).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('fetches when expanding with no data, not loading, no error, and access allowed', () => {
    const fetch = vi.fn();
    expect(
      nextExpandedWithLazyFetch(false, {
        data: null,
        loading: false,
        error: null,
        canAccess: () => true,
        fetch,
        slot: 'grounding',
      }),
    ).toBe(true);
    expect(fetch).toHaveBeenCalledWith('grounding');
  });

  it('does not fetch when access denied — leaves collapsed', () => {
    const fetch = vi.fn();
    expect(
      nextExpandedWithLazyFetch(false, {
        data: null,
        loading: false,
        error: null,
        canAccess: () => false,
        fetch,
        slot: 'signal',
      }),
    ).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('does not fetch when displayable data already present', () => {
    const fetch = vi.fn();
    expect(
      nextExpandedWithLazyFetch(false, {
        data: {
          onThisDay: [],
          currentPrice: null,
          echo: null,
          deepTime: { title: 'T', body: 'B' },
        },
        loading: false,
        error: null,
        canAccess: () => true,
        fetch,
        slot: 'zoomOut',
      }),
    ).toBe(true);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('fetches when data object exists but is not displayable', () => {
    const fetch = vi.fn();
    expect(
      nextExpandedWithLazyFetch(false, {
        data: { title: '', body: '', citation: '', url: '' },
        loading: false,
        error: null,
        canAccess: () => true,
        fetch,
        slot: 'grounding',
      }),
    ).toBe(true);
    expect(fetch).toHaveBeenCalledWith('grounding');
  });

  it('still fetches while loading when payload is not displayable', () => {
    const fetch = vi.fn();
    expect(
      nextExpandedWithLazyFetch(false, {
        data: null,
        loading: true,
        error: null,
        canAccess: () => true,
        fetch,
        slot: 'history',
      }),
    ).toBe(true);
    expect(fetch).toHaveBeenCalledWith('history');
  });

  it('retries fetch when expanding after error', () => {
    const fetch = vi.fn();
    expect(
      nextExpandedWithLazyFetch(false, {
        data: null,
        loading: false,
        error: new Error('fail'),
        canAccess: () => true,
        fetch,
        slot: 'history',
      }),
    ).toBe(true);
    expect(fetch).toHaveBeenCalledWith('history');
  });
});
