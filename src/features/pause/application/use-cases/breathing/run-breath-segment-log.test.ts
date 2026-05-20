import { describe, expect, it, vi } from 'vitest';
import {
  applyBreathSegmentLogOutcome,
  runEnsureBreathSegment1Logged,
  runEnsureBreathSegment2Logged,
  runLogBreathSegment1Skipped,
  runLogBreathSegment2Skipped,
} from './run-breath-segment-log';

describe('runEnsureBreathSegment1Logged', () => {
  it('returns no_instance without RPC', async () => {
    const logStep = vi.fn();
    expect(
      await runEnsureBreathSegment1Logged(
        { pauseInstanceId: null, segmentAlreadyLogged: false },
        { logStep },
      ),
    ).toEqual({ status: 'no_instance' });
    expect(logStep).not.toHaveBeenCalled();
  });

  it('returns already_logged when dedupe flag set', async () => {
    const logStep = vi.fn();
    expect(
      await runEnsureBreathSegment1Logged(
        { pauseInstanceId: 'i', segmentAlreadyLogged: true },
        { logStep },
      ),
    ).toEqual({ status: 'already_logged' });
    expect(logStep).not.toHaveBeenCalled();
  });

  it('logs once and invalidates companion completion cache', async () => {
    const logStep = vi.fn().mockResolvedValue(undefined);
    const invalidateCompanionCompletion = vi.fn();

    const result = await runEnsureBreathSegment1Logged(
      { pauseInstanceId: 'inst-1', segmentAlreadyLogged: false, briefRitual: true },
      { logStep, invalidateCompanionCompletion },
    );

    expect(result).toEqual({ status: 'success', markSegmentLogged: true });
    expect(logStep).toHaveBeenCalledWith({
      instanceId: 'inst-1',
      payload: { breath_segment: 1, brief_ritual: true },
    });
    expect(invalidateCompanionCompletion).toHaveBeenCalledWith('inst-1');
  });
});

describe('runLogBreathSegment1Skipped', () => {
  it('sends skipped payload with brief ritual', async () => {
    const logStep = vi.fn().mockResolvedValue(undefined);

    await runLogBreathSegment1Skipped(
      { pauseInstanceId: 'inst-1', opts: { briefRitual: true } },
      { logStep },
    );

    expect(logStep).toHaveBeenCalledWith({
      instanceId: 'inst-1',
      payload: { breath_segment: 1, brief_ritual: true, skipped: true },
    });
  });
});

describe('runLogBreathSegment2Skipped', () => {
  it('sends segment 2 skipped payload', async () => {
    const logStep = vi.fn().mockResolvedValue(undefined);

    await runLogBreathSegment2Skipped({ pauseInstanceId: 'inst-1' }, { logStep });

    expect(logStep).toHaveBeenCalledWith({
      instanceId: 'inst-1',
      payload: { breath_segment: 2, skipped: true },
    });
  });
});

describe('runEnsureBreathSegment2Logged', () => {
  it('returns sync_failed when RPC throws', async () => {
    const logStep = vi.fn().mockRejectedValue(new Error('network'));

    const result = await runEnsureBreathSegment2Logged(
      { pauseInstanceId: 'inst-1', segmentAlreadyLogged: false },
      { logStep },
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
