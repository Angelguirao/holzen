import { describe, expect, it, vi } from 'vitest';
import type { PauseRepository } from '@/features/pause/ports/pause-repository';
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
    const repository = { logStep } as unknown as PauseRepository;

    const result = await runInitialEmotionSelect(repository, {
      pauseInstanceId: 'inst-1',
      mood: 'calm',
      lastFeelLogKey: logKey,
    });

    expect(result.status).toBe('deduped');
    expect(logStep).not.toHaveBeenCalled();
    if (result.status === 'deduped') {
      expect(result.ui.moodDone).toBe(true);
      expect(result.ui.selectedMood).toBe('calm');
    }
  });

  it('syncs RPC and returns log key on success', async () => {
    const logStep = vi.fn().mockResolvedValue(null);
    const repository = { logStep } as unknown as PauseRepository;

    const result = await runInitialEmotionSelect(repository, {
      pauseInstanceId: 'inst-1',
      mood: 'fomo',
      intensity: 3,
      lastFeelLogKey: null,
    });

    expect(result.status).toBe('synced');
    expect(logStep).toHaveBeenCalledWith({
      instanceId: 'inst-1',
      stepType: 'initial_emotion_logged',
      payload: { mood: 'fomo', intensity: 3 },
    });
    if (result.status === 'synced') {
      expect(result.logKey).toContain('fomo');
    }
  });

  it('rolls back UI when RPC fails', async () => {
    const logStep = vi.fn().mockRejectedValue(new Error('network'));
    const repository = { logStep } as unknown as PauseRepository;

    const result = await runInitialEmotionSelect(repository, {
      pauseInstanceId: 'inst-1',
      mood: 'calm',
      lastFeelLogKey: null,
    });

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
    const repository = { logStep } as unknown as PauseRepository;

    const result = await runInitialEmotionSelect(repository, {
      pauseInstanceId: null,
      mood: 'calm',
      lastFeelLogKey: null,
    });

    expect(result.status).toBe('local_only');
    expect(logStep).not.toHaveBeenCalled();
  });
});

describe('runInitialEmotionSkip', () => {
  it('returns synced with skip dedupe key', async () => {
    const logStep = vi.fn().mockResolvedValue(null);
    const repository = { logStep } as unknown as PauseRepository;

    const result = await runInitialEmotionSkip(repository, { pauseInstanceId: 'inst-1' });

    expect(result.status).toBe('synced');
    if (result.status === 'synced') {
      expect(result.logKey).toBe(initialEmotionSkippedLogDedupeKey());
      expect(result.ui.moodDone).toBe(true);
    }
  });

  it('returns sync_failed without applying UI when RPC fails', async () => {
    const logStep = vi.fn().mockRejectedValue(new Error('fail'));
    const repository = { logStep } as unknown as PauseRepository;

    const result = await runInitialEmotionSkip(repository, { pauseInstanceId: 'inst-1' });

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
