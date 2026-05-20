import { describe, expect, it, vi } from 'vitest';
import {
  initialEmotionResetUi,
  runInitialEmotionSelect,
  runInitialEmotionSkip,
} from './run-initial-emotion-log';
import {
  initialEmotionLogDedupeKey,
  initialEmotionSkippedLogDedupeKey,
} from './initial-emotion-log';

describe('runInitialEmotionSelect', () => {
  it('returns deduped when log key matches', async () => {
    const payload = { mood: 'calm' };
    const logKey = initialEmotionLogDedupeKey(payload);
    const logStep = vi.fn();

    const result = await runInitialEmotionSelect(
      {
        pauseInstanceId: 'inst-1',
        mood: 'calm',
        lastFeelLogKey: logKey,
      },
      { logStep },
    );

    expect(result.status).toBe('deduped');
    expect(logStep).not.toHaveBeenCalled();
    if (result.status === 'deduped') {
      expect(result.ui.moodDone).toBe(true);
      expect(result.ui.selectedMood).toBe('calm');
    }
  });

  it('syncs RPC and returns log key on success', async () => {
    const logStep = vi.fn().mockResolvedValue(undefined);

    const result = await runInitialEmotionSelect(
      {
        pauseInstanceId: 'inst-1',
        mood: 'fomo',
        intensity: 3,
        lastFeelLogKey: null,
      },
      { logStep },
    );

    expect(result.status).toBe('synced');
    expect(logStep).toHaveBeenCalledWith({
      instanceId: 'inst-1',
      payload: { mood: 'fomo', intensity: 3 },
    });
    if (result.status === 'synced') {
      expect(result.logKey).toContain('fomo');
    }
  });

  it('rolls back UI when RPC fails', async () => {
    const logStep = vi.fn().mockRejectedValue(new Error('network'));

    const result = await runInitialEmotionSelect(
      {
        pauseInstanceId: 'inst-1',
        mood: 'calm',
        lastFeelLogKey: null,
      },
      { logStep },
    );

    expect(result).toEqual({
      status: 'sync_failed',
      ui: {
        moodDone: false,
        selectedMood: null,
        feelIntensity: null,
        selectedBriefFace: null,
      },
    });
  });

  it('skips RPC without instance id', async () => {
    const logStep = vi.fn();

    const result = await runInitialEmotionSelect(
      {
        pauseInstanceId: null,
        mood: 'calm',
        lastFeelLogKey: null,
      },
      { logStep },
    );

    expect(result.status).toBe('local_only');
    expect(logStep).not.toHaveBeenCalled();
  });
});

describe('runInitialEmotionSkip', () => {
  it('returns synced with skip dedupe key', async () => {
    const logStep = vi.fn().mockResolvedValue(undefined);

    const result = await runInitialEmotionSkip(
      { pauseInstanceId: 'inst-1' },
      { logStep },
    );

    expect(result.status).toBe('synced');
    if (result.status === 'synced') {
      expect(result.logKey).toBe(initialEmotionSkippedLogDedupeKey());
      expect(result.ui.moodDone).toBe(true);
    }
  });

  it('returns sync_failed without applying UI when RPC fails', async () => {
    const logStep = vi.fn().mockRejectedValue(new Error('fail'));

    const result = await runInitialEmotionSkip(
      { pauseInstanceId: 'inst-1' },
      { logStep },
    );

    expect(result.status).toBe('sync_failed');
  });
});

describe('initialEmotionResetUi', () => {
  it('clears feel-step fields', () => {
    expect(initialEmotionResetUi()).toEqual({
      moodDone: false,
      selectedMood: null,
      feelIntensity: null,
      selectedBriefFace: null,
    });
  });
});
