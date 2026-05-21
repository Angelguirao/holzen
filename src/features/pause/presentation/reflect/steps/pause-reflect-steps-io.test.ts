import { describe, expect, it, vi } from 'vitest';
import {
  pauseReflectFavoriteToggle,
  pauseReflectionStepLogOnce,
  shouldLogPauseReflectionStep,
  shouldShowFavoriteProHint,
} from './pause-reflect-steps-io';

const runPauseReflectionStepLogOnceMock = vi.hoisted(() => vi.fn());
const runPauseFavoriteToggleMock = vi.hoisted(() => vi.fn());

vi.mock(
  '@/features/pause/application/use-cases/ritual/reflect/steps/run-pause-reflection-step-log',
  () => ({
    runPauseReflectionStepLogOnce: runPauseReflectionStepLogOnceMock,
  }),
);

vi.mock(
  '@/features/pause/application/use-cases/ritual/reflect/steps/run-pause-favorite-toggle',
  () => ({
    runPauseFavoriteToggle: runPauseFavoriteToggleMock,
  }),
);

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectStepsRepository' },
  reflectionStepSessionStorage: { storage: 'reflectionStepSessionStorage' },
}));

describe('pause-reflect-steps-io', () => {
  it('re-exports favorite pro-hint gate from domain', () => {
    expect(shouldShowFavoriteProHint(true, false)).toBe(true);
    expect(shouldShowFavoriteProHint(true, true)).toBe(false);
  });

  it('re-exports reflection_step gate from domain', () => {
    expect(
      shouldLogPauseReflectionStep({
        pauseInstanceId: 'pi-1',
        reflectionLoading: false,
        reflectionMessage: 'Ready.',
        reflectionError: null,
      }),
    ).toBe(true);
    expect(
      shouldLogPauseReflectionStep({
        pauseInstanceId: null,
        reflectionLoading: false,
        reflectionMessage: 'Ready.',
        reflectionError: null,
      }),
    ).toBe(false);
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
