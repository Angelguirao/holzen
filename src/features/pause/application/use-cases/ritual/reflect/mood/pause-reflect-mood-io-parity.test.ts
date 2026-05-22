import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'supabasePauseRepository' },
}));

vi.mock('@/features/pause/application/use-cases/ritual/reflect/mood/run-initial-emotion-log', () => ({
  runInitialEmotionSelect: vi.fn(() => Promise.resolve({ status: 'local_only' as const, ui: {} })),
  runInitialEmotionSkip: vi.fn(() => Promise.resolve({ status: 'local_only' as const, ui: {} })),
}));

import {
  runInitialEmotionSelect,
  runInitialEmotionSkip,
} from '@/features/pause/application/use-cases/ritual/reflect/mood/run-initial-emotion-log';
import {
  applyBriefDepthPickerRitualEntry,
  applyDeepDepthPickerRitualEntry,
  buildFeelTilesMoodLogOptions,
  initialEmotionResetUi,
  initialEmotionSelectRollbackUi,
  isPauseSessionDepthPickerActive,
  resolvePauseDepthContextLineParams,
  resolvePauseSessionChromeCloseAction,
  runDeepPausePickerEntryIfPro,
  runInitialEmotionSelect as runInitialEmotionSelectFromFlow,
  runInitialEmotionSkip as runInitialEmotionSkipFromFlow,
  runPauseSessionChromeCloseAction,
} from '@/features/pause/application/use-cases/ritual/reflect/mood/pause-reflect-mood-flow';
import {
  applyBriefDepthPickerRitualEntry as applyBriefFromMoodIo,
  applyDeepDepthPickerRitualEntry as applyDeepFromMoodIo,
  buildFeelTilesMoodLogOptions as buildFeelTilesFromMoodIo,
  initialEmotionResetUi as resetUiFromMoodIo,
  initialEmotionSelectRollbackUi as rollbackUiFromMoodIo,
  isPauseSessionDepthPickerActive as isDepthPickerActiveFromMoodIo,
  pauseInitialEmotionSelect,
  pauseInitialEmotionSkip,
  reflectPauseRepository,
  resolvePauseDepthContextLineParams as resolveDepthLineFromMoodIo,
  resolvePauseSessionChromeCloseAction as resolveChromeCloseFromMoodIo,
  runDeepPausePickerEntryIfPro as runDeepPickerFromMoodIo,
  runPauseSessionChromeCloseAction as runChromeCloseFromMoodIo,
} from '@/features/pause/presentation/reflect/mood/pause-reflect-mood-io';
import { supabasePauseRepository } from '@/features/pause/public-rpc';

describe('pause-reflect-mood-io parity', () => {
  it('presentation I/O mood exports match pause-reflect-mood-flow CI umbrella', () => {
    expect(applyBriefDepthPickerRitualEntry).toBe(applyBriefFromMoodIo);
    expect(applyDeepDepthPickerRitualEntry).toBe(applyDeepFromMoodIo);
    expect(buildFeelTilesMoodLogOptions).toBe(buildFeelTilesFromMoodIo);
    expect(initialEmotionResetUi).toBe(resetUiFromMoodIo);
    expect(initialEmotionSelectRollbackUi).toBe(rollbackUiFromMoodIo);
    expect(isPauseSessionDepthPickerActive).toBe(isDepthPickerActiveFromMoodIo);
    expect(resolvePauseDepthContextLineParams).toBe(resolveDepthLineFromMoodIo);
    expect(resolvePauseSessionChromeCloseAction).toBe(resolveChromeCloseFromMoodIo);
    expect(runDeepPausePickerEntryIfPro).toBe(runDeepPickerFromMoodIo);
    expect(runPauseSessionChromeCloseAction).toBe(runChromeCloseFromMoodIo);
    expect(runInitialEmotionSelectFromFlow).toBe(runInitialEmotionSelect);
    expect(runInitialEmotionSkipFromFlow).toBe(runInitialEmotionSkip);
  });

  it('presentation I/O binds reflectPauseRepository to public-rpc supabasePauseRepository', () => {
    expect(reflectPauseRepository).toBe(supabasePauseRepository);
  });

  it('pauseInitialEmotionSelect delegates to run-initial-emotion-log with default repository', async () => {
    const input = {
      pauseInstanceId: 'inst-1',
      mood: 'calm' as const,
      lastFeelLogKey: null,
    };

    await pauseInitialEmotionSelect(input);

    expect(runInitialEmotionSelect).toHaveBeenCalledWith(supabasePauseRepository, input);
  });

  it('pauseInitialEmotionSkip delegates to run-initial-emotion-log with default repository', async () => {
    const input = { pauseInstanceId: 'inst-2' };

    await pauseInitialEmotionSkip(input);

    expect(runInitialEmotionSkip).toHaveBeenCalledWith(supabasePauseRepository, input);
  });
});
