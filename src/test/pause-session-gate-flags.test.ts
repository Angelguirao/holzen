import { describe, expect, it } from 'vitest';
import {
  isPauseSessionDepthPickerActive,
  isPauseSessionWaitingForInstanceFetch,
} from '@/features/pause/public';

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
          grounding_title: null,
          grounding_body: null,
        },
      }),
    ).toBe(false);
  });
});

describe('isPauseSessionDepthPickerActive', () => {
  it('is true in session on picker with coalesced shell (message or instance id)', () => {
    expect(
      isPauseSessionDepthPickerActive({
        phase: 'session',
        ritualEntry: 'picker',
        hasShellMessage: true,
      }),
    ).toBe(true);
  });

  it('is false without coalesced shell', () => {
    expect(
      isPauseSessionDepthPickerActive({
        phase: 'session',
        ritualEntry: 'picker',
        hasShellMessage: false,
      }),
    ).toBe(false);
  });

  it('is false when ritual already chosen', () => {
    expect(
      isPauseSessionDepthPickerActive({
        phase: 'session',
        ritualEntry: 'deep',
        hasShellMessage: true,
      }),
    ).toBe(false);
  });

  it('is false on done phase', () => {
    expect(
      isPauseSessionDepthPickerActive({
        phase: 'done',
        ritualEntry: 'picker',
        hasShellMessage: true,
      }),
    ).toBe(false);
  });
});
