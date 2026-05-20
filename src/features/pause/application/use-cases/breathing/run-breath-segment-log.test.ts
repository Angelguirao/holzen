import { describe, expect, it, vi } from 'vitest';
import type { PauseRepository } from '@/features/pause/ports/pause-repository';
import {
  applyBreathSegmentLogOutcome,
  runEnsureBreathSegment1Logged,
  runEnsureBreathSegment2Logged,
  runLogBreathSegment1Skipped,
  runLogBreathSegment2Skipped,
} from './run-breath-segment-log';

function mockRepository(logStep = vi.fn().mockResolvedValue(null)): PauseRepository {
  return { logStep } as unknown as PauseRepository;
}

describe('runEnsureBreathSegment1Logged', () => {
  it('returns no_instance without RPC', async () => {
    const logStep = vi.fn();
    expect(
      await runEnsureBreathSegment1Logged(
        mockRepository(logStep),
        { pauseInstanceId: null, segmentAlreadyLogged: false },
      ),
    ).toEqual({ status: 'no_instance' });
    expect(logStep).not.toHaveBeenCalled();
  });

  it('returns already_logged when dedupe flag set', async () => {
    const logStep = vi.fn();
    expect(
      await runEnsureBreathSegment1Logged(
        mockRepository(logStep),
        { pauseInstanceId: 'i', segmentAlreadyLogged: true },
      ),
    ).toEqual({ status: 'already_logged' });
    expect(logStep).not.toHaveBeenCalled();
  });

  it('logs once and invalidates companion completion cache', async () => {
    const logStep = vi.fn().mockResolvedValue(null);
    const onSegmentLogged = vi.fn();

    const result = await runEnsureBreathSegment1Logged(
      mockRepository(logStep),
      { pauseInstanceId: 'inst-1', segmentAlreadyLogged: false, briefRitual: true },
      { onSegmentLogged },
    );

    expect(result).toEqual({ status: 'success', markSegmentLogged: true });
    expect(logStep).toHaveBeenCalledWith({
      instanceId: 'inst-1',
      stepType: 'breath_completed',
      payload: { breath_segment: 1, brief_ritual: true },
    });
    expect(onSegmentLogged).toHaveBeenCalledWith('inst-1');
  });
});

describe('runLogBreathSegment1Skipped', () => {
  it('sends skipped payload with brief ritual', async () => {
    const logStep = vi.fn().mockResolvedValue(null);

    await runLogBreathSegment1Skipped(
      mockRepository(logStep),
      { pauseInstanceId: 'inst-1', opts: { briefRitual: true } },
    );

    expect(logStep).toHaveBeenCalledWith({
      instanceId: 'inst-1',
      stepType: 'breath_completed',
      payload: { breath_segment: 1, brief_ritual: true, skipped: true },
    });
  });
});

describe('runLogBreathSegment2Skipped', () => {
  it('sends segment 2 skipped payload', async () => {
    const logStep = vi.fn().mockResolvedValue(null);

    await runLogBreathSegment2Skipped(mockRepository(logStep), { pauseInstanceId: 'inst-1' });

    expect(logStep).toHaveBeenCalledWith({
      instanceId: 'inst-1',
      stepType: 'breath_completed',
      payload: { breath_segment: 2, skipped: true },
    });
  });
});

describe('runEnsureBreathSegment2Logged', () => {
  it('returns sync_failed when RPC throws', async () => {
    const logStep = vi.fn().mockRejectedValue(new Error('network'));

    const result = await runEnsureBreathSegment2Logged(
      mockRepository(logStep),
      { pauseInstanceId: 'inst-1', segmentAlreadyLogged: false },
    );

    expect(result).toEqual({ status: 'sync_failed' });
  });
});

describe('applyBreathSegmentLogOutcome', () => {
  it('sets ref only on successful mark', () => {
    const ref = { current: false };
    expect(applyBreathSegmentLogOutcome({ status: 'already_logged' }, ref)).toBe(true);
    expect(ref.current).toBe(false);

    expect(
      applyBreathSegmentLogOutcome({ status: 'success', markSegmentLogged: true }, ref),
    ).toBe(true);
    expect(ref.current).toBe(true);

    ref.current = false;
    expect(applyBreathSegmentLogOutcome({ status: 'sync_failed' }, ref)).toBe(false);
    expect(ref.current).toBe(false);
  });
});
