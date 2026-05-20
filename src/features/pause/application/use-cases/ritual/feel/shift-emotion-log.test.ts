import { describe, expect, it, vi } from 'vitest';
import type { PauseRepository } from '@/features/pause/ports/pause-repository';
import {
  buildShiftEmotionFrameHubLogBundle,
  runShiftEmotionFrameHubDone,
} from './shift-emotion-log';

describe('buildShiftEmotionFrameHubLogBundle', () => {
  it('keeps payload and logKey in sync', () => {
    const { payload, logKey } = buildShiftEmotionFrameHubLogBundle();
    expect(payload).toEqual({ from_frame_hub: true });
    expect(logKey).toBe(JSON.stringify(payload));
  });
});

describe('runShiftEmotionFrameHubDone', () => {
  it('skips RPC when log key matches', async () => {
    const { logKey } = buildShiftEmotionFrameHubLogBundle();
    const logStep = vi.fn();
    const repository = { logStep } as unknown as PauseRepository;

    const result = await runShiftEmotionFrameHubDone(repository, {
      pauseInstanceId: 'inst-1',
      lastShiftLogKey: logKey,
    });

    expect(result.status).toBe('advance');
    expect(logStep).not.toHaveBeenCalled();
  });

  it('logs once then advances on success', async () => {
    const logStep = vi.fn().mockResolvedValue(null);
    const repository = { logStep } as unknown as PauseRepository;

    const result = await runShiftEmotionFrameHubDone(repository, {
      pauseInstanceId: 'inst-1',
      lastShiftLogKey: null,
    });

    expect(result.status).toBe('advance');
    expect(logStep).toHaveBeenCalledWith({
      instanceId: 'inst-1',
      stepType: 'shift_emotion_logged',
      payload: { from_frame_hub: true },
    });
  });

  it('returns sync_failed when RPC throws', async () => {
    const logStep = vi.fn().mockRejectedValue(new Error('network'));
    const repository = { logStep } as unknown as PauseRepository;

    const result = await runShiftEmotionFrameHubDone(repository, {
      pauseInstanceId: 'inst-1',
      lastShiftLogKey: null,
    });

    expect(result.status).toBe('sync_failed');
  });

  it('advances without RPC when no instance id', async () => {
    const logStep = vi.fn();
    const repository = { logStep } as unknown as PauseRepository;

    const result = await runShiftEmotionFrameHubDone(repository, {
      pauseInstanceId: null,
      lastShiftLogKey: null,
    });

    expect(result.status).toBe('advance');
    expect(logStep).not.toHaveBeenCalled();
  });
});
