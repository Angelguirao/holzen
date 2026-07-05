import { describe, expect, it } from 'vitest';
import { isPauseSessionWaitingForInstanceFetch } from './waiting-for-instance-fetch';

describe('isPauseSessionWaitingForInstanceFetch', () => {
  it('is true only in fetch hydration without failure and without instance', () => {
    expect(
      isPauseSessionWaitingForInstanceFetch({
        hydrationStatus: 'fetch',
        fetchFailed: false,
        fetchedInstance: null,
      }),
    ).toBe(true);
  });

  it('is false when not fetching', () => {
    expect(
      isPauseSessionWaitingForInstanceFetch({
        hydrationStatus: 'ready',
        fetchFailed: false,
        fetchedInstance: null,
      }),
    ).toBe(false);
  });

  it('is false when fetch failed', () => {
    expect(
      isPauseSessionWaitingForInstanceFetch({
        hydrationStatus: 'fetch',
        fetchFailed: true,
        fetchedInstance: null,
      }),
    ).toBe(false);
  });

  it('is false when instance arrived', () => {
    expect(
      isPauseSessionWaitingForInstanceFetch({
        hydrationStatus: 'fetch',
        fetchFailed: false,
        fetchedInstance: {
          id: 'x',
          reflection_message: 'm',
          context: null,
          haiku: null,
        },
      }),
    ).toBe(false);
  });
});
