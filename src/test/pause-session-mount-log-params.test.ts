import { describe, it, expect } from 'vitest';
import { buildPauseSessionMountLogParams } from '@/lib/pause-session-mount-log-params';
import { makeTestPersistedPauseSession } from '@/test/make-test-persisted-pause-session';
import { type PersistedSession } from '@/features/pause/domain/session-model';

function restoredBrief(overrides: Partial<PersistedSession> = {}): PersistedSession {
  return makeTestPersistedPauseSession({
    ritualDepth: 'brief',
    briefStep: 'integrate',
    ...overrides,
  });
}

describe('buildPauseSessionMountLogParams', () => {
  it('uses fetch pause id prefix when present, else nav', () => {
    expect(
      buildPauseSessionMountLogParams({
        restored: null,
        fetchPauseInstanceId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        navPauseInstanceId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        navReflectionMessage: '',
        hydrationStatus: 'ready',
      }).pauseInstanceIdPrefix,
    ).toBe('aaaaaaaa');

    expect(
      buildPauseSessionMountLogParams({
        restored: null,
        fetchPauseInstanceId: null,
        navPauseInstanceId: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
        navReflectionMessage: '',
        hydrationStatus: 'fetch',
      }).pauseInstanceIdPrefix,
    ).toBe('cccccccc');
  });

  it('reflects nav message presence and restore flag', () => {
    expect(
      buildPauseSessionMountLogParams({
        restored: null,
        fetchPauseInstanceId: null,
        navPauseInstanceId: null,
        navReflectionMessage: 'x',
        hydrationStatus: 'empty',
      }),
    ).toEqual(
      expect.objectContaining({
        hasNavMessage: true,
        restoredFromStorage: false,
        hydrationStatus: 'empty',
      }),
    );

    expect(
      buildPauseSessionMountLogParams({
        restored: restoredBrief(),
        fetchPauseInstanceId: null,
        navPauseInstanceId: null,
        navReflectionMessage: '',
        hydrationStatus: 'ready',
      }),
    ).toEqual(
      expect.objectContaining({
        restoredFromStorage: true,
        ritualEntryInitial: 'brief',
        briefStepInitial: 'integrate',
      }),
    );
  });
});
