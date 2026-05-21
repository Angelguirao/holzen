import { describe, expect, it, vi } from 'vitest';
import type { ReflectGenerator } from '@/features/pause/ports/reflect-generator';
import { runPersistSilentReflectionStub } from '@/features/pause/application/use-cases/ritual/reflect/generation/manual-open/run-persist-silent-reflection-stub';
import { runOpenManualPauseSilentModeAfterCreate } from './run-open-manual-pause-silent-mode-after-create';

vi.mock('@/features/pause/application/use-cases/ritual/reflect/generation/manual-open/run-persist-silent-reflection-stub', () => ({
  runPersistSilentReflectionStub: vi.fn(),
}));

const runPersistSilentReflectionStubMock = vi.mocked(runPersistSilentReflectionStub);

const baseInput = {
  pauseInstanceId: 'pause-1',
  userId: 'u1',
  contextText: 'ctx',
  silentMessage: 'BTC moved.',
  pendingOffer: false,
  created: true,
};

describe('runOpenManualPauseSilentModeAfterCreate', () => {
  it('returns opened when silent stub persist succeeds', async () => {
    runPersistSilentReflectionStubMock.mockResolvedValue({ outcome: 'ok' });
    const reflect = { persistReflectionArtifacts: vi.fn() } as unknown as ReflectGenerator;

    await expect(
      runOpenManualPauseSilentModeAfterCreate(reflect, { ...baseInput, pendingOffer: true }),
    ).resolves.toEqual({
      outcome: 'opened',
      instanceId: 'pause-1',
      context: 'ctx',
      pendingOffer: true,
      created: true,
      silentStubPersisted: true,
    });
    expect(runPersistSilentReflectionStubMock).toHaveBeenCalledWith(reflect, {
      pauseInstanceId: 'pause-1',
      userId: 'u1',
      context: 'ctx',
      message: 'BTC moved.',
    });
  });

  it('returns error when silent stub persist fails', async () => {
    runPersistSilentReflectionStubMock.mockResolvedValue({
      outcome: 'error',
      userMessage: 'Could not save reflection.',
    });
    const reflect = { persistReflectionArtifacts: vi.fn() } as unknown as ReflectGenerator;

    await expect(runOpenManualPauseSilentModeAfterCreate(reflect, baseInput)).resolves.toEqual({
      outcome: 'error',
      userMessage: 'Could not save reflection.',
      isNetwork: false,
    });
  });
});
