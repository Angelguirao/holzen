import { describe, expect, it, vi } from 'vitest';
import {
  pauseReflectFavoriteToggle,
  pauseReflectionStepLogOnce,
  shouldLogPauseReflectionStep,
  shouldShowFavoriteProHint,
} from './pause-reflect-steps-io';

const runPauseReflectionStepLogOnceMock = vi.hoisted(() => vi.fn());
const runPauseFavoriteToggleMock = vi.hoisted(() => vi.fn());
const shouldShowFavoriteProHintMock = vi.hoisted(() => vi.fn());
const shouldLogPauseReflectionStepMock = vi.hoisted(() => vi.fn());

vi.mock(
  '@/features/pause/application/use-cases/ritual/reflect/steps/pause-favorite-toggle-flow',
  async (importOriginal) => {
    const actual = await importOriginal<
      typeof import('@/features/pause/application/use-cases/ritual/reflect/steps/pause-favorite-toggle-flow')
    >();
    return {
      ...actual,
      runPauseFavoriteToggle: runPauseFavoriteToggleMock,
      shouldShowFavoriteProHint: shouldShowFavoriteProHintMock,
    };
  },
);

vi.mock(
  '@/features/pause/application/use-cases/ritual/reflect/steps/pause-reflection-step-log-flow',
  async (importOriginal) => {
    const actual = await importOriginal<
      typeof import('@/features/pause/application/use-cases/ritual/reflect/steps/pause-reflection-step-log-flow')
    >();
    return {
      ...actual,
      runPauseReflectionStepLogOnce: runPauseReflectionStepLogOnceMock,
      shouldLogPauseReflectionStep: shouldLogPauseReflectionStepMock,
    };
  },
);

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectStepsRepository' },
  reflectionStepSessionStorage: { storage: 'reflectionStepSessionStorage' },
}));

describe('pause-reflect-steps-io', () => {
  it('re-exports step gates from steps subcluster flows', () => {
    expect(shouldShowFavoriteProHint).toBe(shouldShowFavoriteProHintMock);
    expect(shouldLogPauseReflectionStep).toBe(shouldLogPauseReflectionStepMock);
  });

  it('routes reflection_step log through default repository + storage', async () => {
    runPauseReflectionStepLogOnceMock.mockResolvedValue({ status: 'logged' });

    await pauseReflectionStepLogOnce({ pauseInstanceId: 'pi-1' });

    expect(runPauseReflectionStepLogOnceMock).toHaveBeenCalledWith(
      { port: 'reflectStepsRepository' },
      { pauseInstanceId: 'pi-1' },
      { storage: { storage: 'reflectionStepSessionStorage' } },
    );
  });

  it('routes favorite toggle through the default PauseRepository port adapter', async () => {
    runPauseFavoriteToggleMock.mockResolvedValue({ status: 'success', newValue: true });

    await pauseReflectFavoriteToggle({
      pauseInstanceId: 'pi-1',
      isFavorite: true,
    });

    expect(runPauseFavoriteToggleMock).toHaveBeenCalledWith(
      { port: 'reflectStepsRepository' },
      { pauseInstanceId: 'pi-1', isFavorite: true },
    );
  });
});
