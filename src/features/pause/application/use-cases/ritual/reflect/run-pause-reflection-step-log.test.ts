import { describe, expect, it, vi } from 'vitest';
import {
  reflectionStepLoggedStorageKey,
  runPauseReflectionStepLogOnce,
  shouldLogPauseReflectionStep,
} from './run-pause-reflection-step-log';

describe('shouldLogPauseReflectionStep', () => {
  it('requires instance id and settled reflection state', () => {
    expect(
      shouldLogPauseReflectionStep({
        pauseInstanceId: null,
        reflectionLoading: false,
        reflectionMessage: 'hi',
        reflectionError: null,
      }),
    ).toBe(false);
    expect(
      shouldLogPauseReflectionStep({
        pauseInstanceId: 'i',
        reflectionLoading: true,
        reflectionMessage: 'hi',
        reflectionError: null,
      }),
    ).toBe(false);
    expect(
      shouldLogPauseReflectionStep({
        pauseInstanceId: 'i',
        reflectionLoading: false,
        reflectionMessage: '',
        reflectionError: null,
      }),
    ).toBe(false);
    expect(
      shouldLogPauseReflectionStep({
        pauseInstanceId: 'i',
        reflectionLoading: false,
        reflectionMessage: '',
        reflectionError: 'err',
      }),
    ).toBe(true);
  });
});

describe('runPauseReflectionStepLogOnce', () => {
  it('skips when storage cannot be read', async () => {
    const logStep = vi.fn();
    const result = await runPauseReflectionStepLogOnce(
      { pauseInstanceId: 'inst-1' },
      {
        storage: { canRead: () => false, isLogged: () => false, markLogged: vi.fn() },
        logStep,
      },
    );
    expect(result).toEqual({ status: 'storage_unavailable' });
    expect(logStep).not.toHaveBeenCalled();
  });

  it('logs once and marks storage', async () => {
    const markLogged = vi.fn();
    const logStep = vi.fn().mockResolvedValue(undefined);

    const result = await runPauseReflectionStepLogOnce(
      { pauseInstanceId: 'inst-1' },
      {
        storage: { canRead: () => true, isLogged: () => false, markLogged },
        logStep,
      },
    );

    expect(result).toEqual({ status: 'logged' });
    expect(logStep).toHaveBeenCalledWith({
      instanceId: 'inst-1',
      payload: { surface: 'pause_reflect' },
    });
    expect(markLogged).toHaveBeenCalledWith(reflectionStepLoggedStorageKey('inst-1'));
  });

  it('returns already_logged without RPC', async () => {
    const logStep = vi.fn();
    const result = await runPauseReflectionStepLogOnce(
      { pauseInstanceId: 'inst-1' },
      {
        storage: { canRead: () => true, isLogged: () => true, markLogged: vi.fn() },
        logStep,
      },
    );
    expect(result).toEqual({ status: 'already_logged' });
    expect(logStep).not.toHaveBeenCalled();
  });
});
