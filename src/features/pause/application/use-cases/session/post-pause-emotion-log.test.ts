import { describe, expect, it, vi } from 'vitest';
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

    expect(
      await runPostPauseEmotionLogIfDirty(
        { pauseInstanceId: 'i', mood: null, intensity: 3, initialSnapshot: null },
        { logStep },
      ),
    ).toEqual({ status: 'skipped' });

    expect(
      await runPostPauseEmotionLogIfDirty(
        { pauseInstanceId: null, mood: 'calm', intensity: 3, initialSnapshot: null },
        { logStep },
      ),
    ).toEqual({ status: 'skipped' });

    expect(logStep).not.toHaveBeenCalled();
  });

  it('skips RPC when feel unchanged', async () => {
    const logStep = vi.fn();

    const result = await runPostPauseEmotionLogIfDirty(
      {
        pauseInstanceId: 'inst-1',
        mood: 'calm',
        intensity: 3,
        initialSnapshot: { mood: 'calm', intensity: 3 },
      },
      { logStep },
    );

    expect(result).toEqual({ status: 'skipped' });
    expect(logStep).not.toHaveBeenCalled();
  });

  it('logs post_pause_emotion when dirty', async () => {
    const logStep = vi.fn().mockResolvedValue(undefined);

    const result = await runPostPauseEmotionLogIfDirty(
      {
        pauseInstanceId: 'inst-1',
        mood: 'fomo',
        intensity: 4,
        initialSnapshot: { mood: 'calm', intensity: 3 },
      },
      { logStep },
    );

    expect(result).toEqual({ status: 'logged' });
    expect(logStep).toHaveBeenCalledWith({
      instanceId: 'inst-1',
      payload: buildPostPauseEmotionLoggedPayload('fomo', 4),
    });
  });

  it('returns sync_failed when RPC throws', async () => {
    const logStep = vi.fn().mockRejectedValue(new Error('network'));

    const result = await runPostPauseEmotionLogIfDirty(
      {
        pauseInstanceId: 'inst-1',
        mood: 'calm',
        intensity: 3,
        initialSnapshot: null,
      },
      { logStep },
    );

    expect(result).toEqual({ status: 'sync_failed' });
  });
});
