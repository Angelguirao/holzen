import { describe, expect, it, vi } from 'vitest';

import {
  runInitialEmotionSelect as runInitialEmotionSelectDirect,
  runInitialEmotionSkip as runInitialEmotionSkipDirect,
} from '@/features/pause/application/use-cases/ritual/reflect/mood/run-initial-emotion-log';
import {
  applyBriefDepthPickerRitualEntry as applyBriefDirect,
  applyDeepDepthPickerRitualEntry as applyDeepDirect,
} from '@/features/pause/domain/reflect/mood/apply-depth-picker-ritual-entry';
import { buildFeelTilesMoodLogOptions as buildFeelTilesDirect } from '@/features/pause/domain/reflect/mood/build-feel-tiles-mood-log-options';
import {
  initialEmotionResetUi as initialEmotionResetUiDirect,
  initialEmotionSelectRollbackUi as initialEmotionSelectRollbackUiDirect,
} from '@/features/pause/domain/reflect/mood/initial-emotion-presentation';
import { isPauseSessionDepthPickerActive as isDepthPickerActiveDirect } from '@/features/pause/domain/reflect/mood/pause-depth-picker-active';
import {
  resolvePauseSessionChromeCloseAction as resolveChromeCloseDirect,
  runPauseSessionChromeCloseAction as runChromeCloseDirect,
} from '@/features/pause/domain/reflect/mood/pause-session-chrome-close';
import { resolvePauseDepthContextLineParams as resolveDepthContextDirect } from '@/features/pause/domain/reflect/mood/resolve-pause-depth-context-line-params';
import { runDeepPausePickerEntryIfPro as runDeepPickerDirect } from '@/features/pause/domain/reflect/mood/run-deep-pause-picker-entry-if-pro';
import { supabasePauseRepository } from '@/features/pause/public-rpc';

import {
  applyBriefDepthPickerRitualEntry,
  applyDeepDepthPickerRitualEntry,
  buildFeelTilesMoodLogOptions,
  initialEmotionResetUi,
  initialEmotionSelectRollbackUi,
  isPauseSessionDepthPickerActive,
  pauseInitialEmotionSelect,
  pauseInitialEmotionSelectWithRepository,
  pauseInitialEmotionSkip,
  pauseInitialEmotionSkipWithRepository,
  reflectPauseRepository,
  resolvePauseDepthContextLineParams,
  resolvePauseSessionChromeCloseAction,
  runDeepPausePickerEntryIfPro,
  runPauseSessionChromeCloseAction,
} from './pause-reflect-mood-io';

const runInitialEmotionSelectMock = vi.hoisted(() => vi.fn());
const runInitialEmotionSkipMock = vi.hoisted(() => vi.fn());

vi.mock(
  '@/features/pause/application/use-cases/ritual/reflect/mood/run-initial-emotion-log',
  () => ({
    runInitialEmotionSelect: runInitialEmotionSelectMock,
    runInitialEmotionSkip: runInitialEmotionSkipMock,
  }),
);

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectPauseRepository' },
}));

describe('pause-reflect-mood-io', () => {
  it('re-exports mood domain helpers with identity bindings to leaf modules', () => {
    expect(applyBriefDepthPickerRitualEntry).toBe(applyBriefDirect);
    expect(applyDeepDepthPickerRitualEntry).toBe(applyDeepDirect);
    expect(buildFeelTilesMoodLogOptions).toBe(buildFeelTilesDirect);
    expect(initialEmotionResetUi).toBe(initialEmotionResetUiDirect);
    expect(initialEmotionSelectRollbackUi).toBe(initialEmotionSelectRollbackUiDirect);
    expect(isPauseSessionDepthPickerActive).toBe(isDepthPickerActiveDirect);
    expect(resolvePauseDepthContextLineParams).toBe(resolveDepthContextDirect);
    expect(resolvePauseSessionChromeCloseAction).toBe(resolveChromeCloseDirect);
    expect(runDeepPausePickerEntryIfPro).toBe(runDeepPickerDirect);
    expect(runPauseSessionChromeCloseAction).toBe(runChromeCloseDirect);
    expect(reflectPauseRepository).toBe(supabasePauseRepository);
  });

  it('re-exports depth-picker active gate from domain mood helpers', () => {
    expect(
      isPauseSessionDepthPickerActive({
        phase: 'session',
        ritualEntry: 'picker',
        hasShellMessage: true,
      }),
    ).toBe(true);
    expect(
      isPauseSessionDepthPickerActive({
        phase: 'session',
        ritualEntry: 'deep',
        hasShellMessage: true,
      }),
    ).toBe(false);
  });

  it('routes initial emotion select through the default PauseRepository port adapter', async () => {
    runInitialEmotionSelectMock.mockResolvedValue({ status: 'deduped', ui: {} });

    await pauseInitialEmotionSelect({
      pauseInstanceId: 'pi-1',
      mood: 'calm',
      intensity: 3,
      lastFeelLogKey: null,
    });

    expect(runInitialEmotionSelectMock).toHaveBeenCalledWith(reflectPauseRepository, {
      pauseInstanceId: 'pi-1',
      mood: 'calm',
      intensity: 3,
      lastFeelLogKey: null,
    });
    expect(reflectPauseRepository).toEqual({ port: 'reflectPauseRepository' });
  });

  it('routes initial emotion skip through the default PauseRepository port adapter', async () => {
    runInitialEmotionSkipMock.mockResolvedValue({
      status: 'synced',
      logKey: 'skip',
      ui: { moodDone: true, feelIntensity: null },
    });

    await pauseInitialEmotionSkip({ pauseInstanceId: 'pi-1' });

    expect(runInitialEmotionSkipMock).toHaveBeenCalledWith(reflectPauseRepository, {
      pauseInstanceId: 'pi-1',
    });
  });

  it('exports mood RPC wrappers distinct from leaf use cases', () => {
    expect(typeof pauseInitialEmotionSelect).toBe('function');
    expect(typeof pauseInitialEmotionSelectWithRepository).toBe('function');
    expect(typeof pauseInitialEmotionSkip).toBe('function');
    expect(typeof pauseInitialEmotionSkipWithRepository).toBe('function');
    expect(pauseInitialEmotionSelect).not.toBe(runInitialEmotionSelectDirect);
    expect(pauseInitialEmotionSkip).not.toBe(runInitialEmotionSkipDirect);
  });

  it('pauseInitialEmotionSelectWithRepository forwards injected repository', async () => {
    const customRepo = { port: 'injected-mood-select' };
    runInitialEmotionSelectMock.mockResolvedValue({ status: 'deduped', ui: {} });

    await pauseInitialEmotionSelectWithRepository(customRepo as never, {
      pauseInstanceId: 'pi-custom',
      mood: 'calm',
      intensity: 2,
      lastFeelLogKey: null,
    });

    expect(runInitialEmotionSelectMock).toHaveBeenCalledWith(customRepo, {
      pauseInstanceId: 'pi-custom',
      mood: 'calm',
      intensity: 2,
      lastFeelLogKey: null,
    });
  });

  it('pauseInitialEmotionSkipWithRepository forwards injected repository', async () => {
    const customRepo = { port: 'injected-mood-skip' };
    runInitialEmotionSkipMock.mockResolvedValue({ status: 'synced', logKey: 'k', ui: {} });

    await pauseInitialEmotionSkipWithRepository(customRepo as never, {
      pauseInstanceId: 'pi-skip-custom',
    });

    expect(runInitialEmotionSkipMock).toHaveBeenCalledWith(customRepo, {
      pauseInstanceId: 'pi-skip-custom',
    });
  });
});
