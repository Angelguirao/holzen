import { describe, expect, it } from 'vitest';
import type { PersistedSession } from '@/features/pause/domain/session-model';
import { makeTestPersistedPauseSession } from '@/test/fixtures/make-test-persisted-pause-session';
import { initialBreathSegmentRpcLoggedFlagsFromRestored } from './initial-breath-segment-rpc-flags';

describe('initialBreathSegmentRpcLoggedFlagsFromRestored', () => {
  it('treats no restore as no segments logged', () => {
    expect(initialBreathSegmentRpcLoggedFlagsFromRestored(null)).toEqual({
      segment1Logged: false,
      segment2Logged: false,
    });
  });

  it('is false at feel; segment1 after breathe; both after breath2', () => {
    expect(initialBreathSegmentRpcLoggedFlagsFromRestored(makeTestPersistedPauseSession({ step: 'feel' }))).toEqual({
      segment1Logged: false,
      segment2Logged: false,
    });
    expect(initialBreathSegmentRpcLoggedFlagsFromRestored(makeTestPersistedPauseSession({ step: 'reflect' }))).toEqual({
      segment1Logged: true,
      segment2Logged: false,
    });
    expect(initialBreathSegmentRpcLoggedFlagsFromRestored(makeTestPersistedPauseSession({ step: 'decide' }))).toEqual({
      segment1Logged: true,
      segment2Logged: true,
    });
  });

  it('matches legacy persisted step mapping before comparing indices', () => {
    expect(
      initialBreathSegmentRpcLoggedFlagsFromRestored(makeTestPersistedPauseSession({ step: 'ground' as unknown as PersistedSession['step'] })),
    ).toEqual({
      segment1Logged: true,
      segment2Logged: false,
    });
  });
});
