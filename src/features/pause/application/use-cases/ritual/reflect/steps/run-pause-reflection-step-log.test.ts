import { describe, expect, it, vi } from 'vitest';
import { reflectionStepLoggedStorageKey } from '@/features/pause/domain/reflection-step-log';
import type { PauseRepository } from '@/features/pause/ports/pause-repository';
import { runPauseReflectionStepLogOnce } from './run-pause-reflection-step-log';

describe('runPauseReflectionStepLogOnce', () => {
  it('skips when storage cannot be read', async () => {
    const logStep = vi.fn();
    const repository = { logStep } as unknown as PauseRepository;
    const result = await runPauseReflectionStepLogOnce(
      repository,
      { pauseInstanceId: 'inst-1' },
      {
        storage: { canRead: () => false, isLogged: () => false, markLogged: vi.fn() },
      },
    );
    expect(result).toEqual({ status: 'storage_unavailable' });
    expect(logStep).not.toHaveBeenCalled();
  });

  it('logs once and marks storage', async () => {
    const markLogged = vi.fn();
    const logStep = vi.fn().mockResolvedValue(null);
    const repository = { logStep } as unknown as PauseRepository;

    const result = await runPauseReflectionStepLogOnce(
      repository,
      { pauseInstanceId: 'inst-1' },
      {
        storage: { canRead: () => true, isLogged: () => false, markLogged },
      },
    );

    expect(result).toEqual({ status: 'logged' });
    expect(logStep).toHaveBeenCalledWith({
      instanceId: 'inst-1',
      stepType: 'reflection_step',
      payload: { surface: 'pause_reflect' },
    });
    expect(markLogged).toHaveBeenCalledWith(reflectionStepLoggedStorageKey('inst-1'));
  });

  it('returns already_logged without RPC', async () => {
    const logStep = vi.fn();
    const repository = { logStep } as unknown as PauseRepository;
    const result = await runPauseReflectionStepLogOnce(
      repository,
      { pauseInstanceId: 'inst-1' },
      {
        storage: { canRead: () => true, isLogged: () => true, markLogged: vi.fn() },
      },
    );
    expect(result).toEqual({ status: 'already_logged' });
    expect(logStep).not.toHaveBeenCalled();
  });
});
