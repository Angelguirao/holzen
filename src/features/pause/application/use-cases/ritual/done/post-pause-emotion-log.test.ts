import { describe, expect, it, vi } from 'vitest';
import type { PauseRepository } from '@/features/pause/ports/pause-repository';
import {
  buildPostPauseEmotionLoggedPayload,
  isPostPauseEmotionDirty,
  runPostPauseEmotionLogIfDirty,
} from './post-pause-emotion-log';

describe('isPostPauseEmotionDirty', () => {
  it('is dirty when initial snapshot is missing', () => {
    expect(isPostPauseEmotionDirty({ mood: 'calm', intensity: 3 }, null)).toBe(true);
  });

  it('is dirty when mood or intensity changed', () => {
    expect(
      isPostPauseEmotionDirty(
        { mood: 'fomo', intensity: 3 },
        { mood: 'calm', intensity: 3 },
      ),
    ).toBe(true);
    expect(
      isPostPauseEmotionDirty(
        { mood: 'calm', intensity: 4 },
        { mood: 'calm', intensity: 3 },
      ),
    ).toBe(true);
  });

  it('is clean when unchanged from snapshot', () => {
    expect(
      isPostPauseEmotionDirty(
        { mood: 'calm', intensity: 3 },
        { mood: 'calm', intensity: 3 },
      ),
    ).toBe(false);
  });
});

describe('runPostPauseEmotionLogIfDirty', () => {
  it('skips when mood unset or instance missing', async () => {
    const logStep = vi.fn();
    const repository = { logStep } as unknown as PauseRepository;

    expect(
      await runPostPauseEmotionLogIfDirty(repository, {
        pauseInstanceId: 'i',
        mood: null,
        intensity: 3,
        initialSnapshot: null,
      }),
    ).toEqual({ status: 'skipped' });

    expect(
      await runPostPauseEmotionLogIfDirty(repository, {
        pauseInstanceId: null,
        mood: 'calm',
        intensity: 3,
        initialSnapshot: null,
      }),
    ).toEqual({ status: 'skipped' });

    expect(logStep).not.toHaveBeenCalled();
  });

  it('skips RPC when feel unchanged', async () => {
    const logStep = vi.fn();
    const repository = { logStep } as unknown as PauseRepository;

    const result = await runPostPauseEmotionLogIfDirty(repository, {
      pauseInstanceId: 'inst-1',
      mood: 'calm',
      intensity: 3,
      initialSnapshot: { mood: 'calm', intensity: 3 },
    });

    expect(result).toEqual({ status: 'skipped' });
    expect(logStep).not.toHaveBeenCalled();
  });

  it('logs post_pause_emotion when dirty', async () => {
    const logStep = vi.fn().mockResolvedValue(null);
    const repository = { logStep } as unknown as PauseRepository;

    const result = await runPostPauseEmotionLogIfDirty(repository, {
      pauseInstanceId: 'inst-1',
      mood: 'fomo',
      intensity: 4,
      initialSnapshot: { mood: 'calm', intensity: 3 },
    });

    expect(result).toEqual({ status: 'logged' });
    expect(logStep).toHaveBeenCalledWith({
      instanceId: 'inst-1',
      stepType: 'post_pause_emotion_logged',
      payload: buildPostPauseEmotionLoggedPayload('fomo', 4),
    });
  });

  it('returns sync_failed when RPC throws', async () => {
    const logStep = vi.fn().mockRejectedValue(new Error('network'));
    const repository = { logStep } as unknown as PauseRepository;

    const result = await runPostPauseEmotionLogIfDirty(repository, {
      pauseInstanceId: 'inst-1',
      mood: 'calm',
      intensity: 3,
      initialSnapshot: null,
    });

    expect(result).toEqual({ status: 'sync_failed' });
  });
});
