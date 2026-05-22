import { describe, expect, it, vi } from 'vitest';
import { makeTestPersistedPauseSession } from '@/test/fixtures/make-test-persisted-pause-session';

const runEnsureBreathSegment1LoggedMock = vi.hoisted(() => vi.fn());
const runEnsureBreathSegment2LoggedMock = vi.hoisted(() => vi.fn());

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'breathIoRepository' },
}));

vi.mock('@/features/pause/application/use-cases/ritual/breathe/run-breath-segment-log', () => ({
  runEnsureBreathSegment1Logged: runEnsureBreathSegment1LoggedMock,
  runEnsureBreathSegment2Logged: runEnsureBreathSegment2LoggedMock,
  runLogBreathSegment1Skipped: vi.fn(),
  runLogBreathSegment2Skipped: vi.fn(),
}));

import {
  applyBreathSegmentLogOutcome,
  computeBreathingPhaseAdvance,
  initialBreathingFirstCompletedFromRestored,
  initialBreathingSecondCompletedFromRestored,
  initialBreathSegmentRpcLoggedFlagsFromRestored,
  pauseEnsureBreathSegment1Logged,
  playPauseBreathPhaseCue,
  resolveBreathingPhaseAdvanceOutcome,
  resumePauseAudioContext,
} from './pause-session-breath-io';

describe('pause-session-breath-io', () => {
  it('re-exports restored breath completion flags for ritual hydration', () => {
    const restored = makeTestPersistedPauseSession({
      breathingFirstCompleted: true,
      breathingSecondCompleted: false,
    });

    expect(initialBreathingFirstCompletedFromRestored(restored)).toBe(true);
    expect(initialBreathingSecondCompletedFromRestored(restored)).toBe(false);
    expect(initialBreathingFirstCompletedFromRestored(null)).toBe(false);
  });

  it('re-exports breath segment RPC outcome + restored dedupe flags', () => {
    const restored = makeTestPersistedPauseSession({ step: 'reflect' });
    const ref = { current: false };

    expect(initialBreathSegmentRpcLoggedFlagsFromRestored(restored)).toEqual({
      segment1Logged: true,
      segment2Logged: false,
    });
    expect(initialBreathSegmentRpcLoggedFlagsFromRestored(null)).toEqual({
      segment1Logged: false,
      segment2Logged: false,
    });
    expect(
      applyBreathSegmentLogOutcome({ status: 'success', markSegmentLogged: true }, ref),
    ).toBe(true);
    expect(ref.current).toBe(true);
  });

  it('re-exports phase advance helpers from pause-session-breath-flow', () => {
    const advance = computeBreathingPhaseAdvance({
      elapsed: 2,
      phaseDuration: 2,
      phaseIndex: 0,
      phaseCount: 3,
      cycle: 0,
      totalCycles: 1,
    });
    const outcome = resolveBreathingPhaseAdvanceOutcome({
      advance,
      ritualVariant: 'brief',
      current: { cycle: 0, phaseIndex: 0, elapsed: 2, completedLocal: false },
    });
    expect(advance.kind).toBe('next_phase');
    expect(outcome.kind).toBe('advanced');
  });

  it('routes segment 1 RPC through default repository via breath-flow', async () => {
    runEnsureBreathSegment1LoggedMock.mockResolvedValue({ status: 'logged' });

    await pauseEnsureBreathSegment1Logged({
      pauseInstanceId: 'pi-breath',
      segmentAlreadyLogged: false,
    });

    expect(runEnsureBreathSegment1LoggedMock).toHaveBeenCalledWith(
      { port: 'breathIoRepository' },
      {
        pauseInstanceId: 'pi-breath',
        segmentAlreadyLogged: false,
      },
      expect.objectContaining({ onSegmentLogged: expect.any(Function) }),
    );
  });

  it('re-exports ritual audio cue helpers for timed breathing UI', () => {
    expect(typeof playPauseBreathPhaseCue).toBe('function');
    expect(typeof resumePauseAudioContext).toBe('function');
  });
});
