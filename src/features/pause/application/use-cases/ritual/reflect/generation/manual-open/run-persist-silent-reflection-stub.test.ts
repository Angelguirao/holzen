import { describe, expect, it, vi } from 'vitest';
import type { ReflectGenerator } from '@/features/pause/ports/reflect-generator';
import { runPersistSilentReflectionStub } from './run-persist-silent-reflection-stub';

describe('runPersistSilentReflectionStub', () => {
  const input = {
    pauseInstanceId: 'pause-1',
    userId: 'u1',
    context: 'ctx',
    message: 'BTC moved.',
  };

  it('persists reflection artifacts via ReflectGenerator port', async () => {
    const persistReflectionArtifacts = vi.fn().mockResolvedValue(undefined);
    const reflect = { persistReflectionArtifacts } as unknown as ReflectGenerator;

    await expect(runPersistSilentReflectionStub(reflect, input)).resolves.toEqual({ outcome: 'ok' });
    expect(persistReflectionArtifacts).toHaveBeenCalledWith({
      pauseInstanceId: 'pause-1',
      userId: 'u1',
      context: 'ctx',
      message: 'BTC moved.',
    });
  });

  it('returns error userMessage when persist fails', async () => {
    const persistReflectionArtifacts = vi.fn().mockRejectedValue(new Error('db'));
    const reflect = { persistReflectionArtifacts } as unknown as ReflectGenerator;

    const result = await runPersistSilentReflectionStub(reflect, input);
    expect(result.outcome).toBe('error');
    if (result.outcome === 'error') {
      expect(result.userMessage.length).toBeGreaterThan(0);
    }
  });
});
