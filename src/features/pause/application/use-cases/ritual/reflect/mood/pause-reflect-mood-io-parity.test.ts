import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'supabasePauseRepository' },
}));

vi.mock('@/features/pause/application/use-cases/ritual/reflect/mood/run-initial-emotion-log', () => ({
  runInitialEmotionSelect: vi.fn(() => Promise.resolve({ status: 'local_only' as const, ui: {} })),
  runInitialEmotionSkip: vi.fn(() => Promise.resolve({ status: 'local_only' as const, ui: {} })),
}));

import {
  applyBriefDepthPickerRitualEntry as applyBriefDirect,
  applyDeepDepthPickerRitualEntry as applyDeepDirect,
} from '@/features/pause/domain/reflect/mood/apply-depth-picker-ritual-entry';
import { buildFeelTilesMoodLogOptions as buildFeelTilesDirect } from '@/features/pause/domain/reflect/mood/build-feel-tiles-mood-log-options';
import {
  initialEmotionResetUi as resetUiDirect,
  initialEmotionSelectRollbackUi as rollbackUiDirect,
} from '@/features/pause/domain/reflect/mood/initial-emotion-presentation';
import { isPauseSessionDepthPickerActive as isDepthPickerActiveDirect } from '@/features/pause/domain/reflect/mood/pause-depth-picker-active';
import {
  resolvePauseSessionChromeCloseAction as resolveChromeCloseDirect,
  runPauseSessionChromeCloseAction as runChromeCloseDirect,
} from '@/features/pause/domain/reflect/mood/pause-session-chrome-close';
import { runDeepPausePickerEntryIfPro as runDeepPickerDirect } from '@/features/pause/domain/reflect/mood/run-deep-pause-picker-entry-if-pro';
import { resolvePauseDepthContextLineParams as resolveDepthLineDirect } from '@/features/pause/domain/reflect/mood/resolve-pause-depth-context-line-params';
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
  pauseInitialEmotionSelectWithRepository,
  pauseInitialEmotionSkip,
  pauseInitialEmotionSkipWithRepository,
  reflectPauseRepository,
  resolvePauseDepthContextLineParams as resolveDepthLineFromMoodIo,
  resolvePauseSessionChromeCloseAction as resolveChromeCloseFromMoodIo,
  runDeepPausePickerEntryIfPro as runDeepPickerFromMoodIo,
  runPauseSessionChromeCloseAction as runChromeCloseFromMoodIo,
} from '@/features/pause/presentation/reflect/mood/pause-reflect-mood-io';
import { supabasePauseRepository } from '@/features/pause/public-rpc';
import {
  pauseReflectFavoriteToggle,
  pauseReflectNoteUpdate,
  pauseReflectTagUpdate,
  pauseReflectionStepLogOnce,
  pauseReflectFavoriteToggleWithRepository,
  pauseReflectNoteUpdateWithRepository,
  pauseReflectTagUpdateWithRepository,
  pauseReflectionStepLogOnceWithRepository,
  shouldLogPauseReflectionStep,
  shouldShowFavoriteProHint,
} from '@/features/pause/presentation/reflect/steps/pause-reflect-steps-io';

/**
 * Application-layer mood I/O parity. Steps-io sibling pins:
 * `pause-reflect-steps-mood-io-sibling-parity.test.ts` (application + presentation);
 * reciprocal inline pins ↔ `pause-reflect-steps-io-parity.test.ts`.
 */
describe('pause-reflect-mood-io parity', () => {
  it('mood CI umbrella composes the same domain mood leaves as presentation I/O', () => {
    expect(buildFeelTilesMoodLogOptions).toBe(buildFeelTilesDirect);
    expect(buildFeelTilesFromMoodIo).toBe(buildFeelTilesDirect);
    expect(applyBriefDepthPickerRitualEntry).toBe(applyBriefDirect);
    expect(applyBriefFromMoodIo).toBe(applyBriefDirect);
    expect(applyDeepDepthPickerRitualEntry).toBe(applyDeepDirect);
    expect(applyDeepFromMoodIo).toBe(applyDeepDirect);
    expect(initialEmotionResetUi).toBe(resetUiDirect);
    expect(resetUiFromMoodIo).toBe(resetUiDirect);
    expect(initialEmotionSelectRollbackUi).toBe(rollbackUiDirect);
    expect(rollbackUiFromMoodIo).toBe(rollbackUiDirect);
    expect(isPauseSessionDepthPickerActive).toBe(isDepthPickerActiveDirect);
    expect(isDepthPickerActiveFromMoodIo).toBe(isDepthPickerActiveDirect);
    expect(resolvePauseDepthContextLineParams).toBe(resolveDepthLineDirect);
    expect(resolveDepthLineFromMoodIo).toBe(resolveDepthLineDirect);
    expect(resolvePauseSessionChromeCloseAction).toBe(resolveChromeCloseDirect);
    expect(resolveChromeCloseFromMoodIo).toBe(resolveChromeCloseDirect);
    expect(runPauseSessionChromeCloseAction).toBe(runChromeCloseDirect);
    expect(runChromeCloseFromMoodIo).toBe(runChromeCloseDirect);
    expect(runDeepPausePickerEntryIfPro).toBe(runDeepPickerDirect);
    expect(runDeepPickerFromMoodIo).toBe(runDeepPickerDirect);
  });

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

  it('presentation I/O exports mood RPC wrappers distinct from leaf use cases', () => {
    expect(typeof pauseInitialEmotionSelect).toBe('function');
    expect(typeof pauseInitialEmotionSelectWithRepository).toBe('function');
    expect(typeof pauseInitialEmotionSkip).toBe('function');
    expect(typeof pauseInitialEmotionSkipWithRepository).toBe('function');
    expect(pauseInitialEmotionSelect).not.toBe(runInitialEmotionSelect);
    expect(pauseInitialEmotionSkip).not.toBe(runInitialEmotionSkip);
  });

  it('pauseInitialEmotionSelectWithRepository delegates with injected repository', async () => {
    const customRepository = { port: 'customPauseRepository' };
    const input = {
      pauseInstanceId: 'inst-mood-custom',
      mood: 'energized' as const,
      lastFeelLogKey: 'key-1',
    };

    await pauseInitialEmotionSelectWithRepository(
      customRepository as unknown as typeof supabasePauseRepository,
      input,
    );

    expect(runInitialEmotionSelect).toHaveBeenCalledWith(customRepository, input);
  });

  it('pauseInitialEmotionSkipWithRepository delegates with injected repository', async () => {
    const customRepository = { port: 'customPauseRepositorySkip' };
    const input = { pauseInstanceId: 'inst-mood-skip-custom' };

    await pauseInitialEmotionSkipWithRepository(
      customRepository as unknown as typeof supabasePauseRepository,
      input,
    );

    expect(runInitialEmotionSkip).toHaveBeenCalledWith(customRepository, input);
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-steps-io-parity.test.ts` (mood RPC vs step mutations).
   * Dedicated sibling file: `pause-reflect-steps-mood-io-sibling-parity.test.ts` (application + presentation).
   */
  it('sibling cluster: steps-io exports stay distinct from mood-io wrappers', () => {
    expect(pauseInitialEmotionSelect).not.toBe(pauseReflectFavoriteToggle);
    expect(pauseInitialEmotionSkip).not.toBe(pauseReflectNoteUpdate);
    expect(buildFeelTilesMoodLogOptions).not.toBe(pauseReflectTagUpdate);
    expect(pauseInitialEmotionSelect).not.toBe(pauseReflectionStepLogOnce);
    expect(pauseInitialEmotionSelectWithRepository).not.toBe(pauseReflectFavoriteToggleWithRepository);
    expect(pauseInitialEmotionSkipWithRepository).not.toBe(pauseReflectNoteUpdateWithRepository);
    expect(buildFeelTilesMoodLogOptions).not.toBe(shouldShowFavoriteProHint);
    expect(pauseInitialEmotionSkip).not.toBe(shouldLogPauseReflectionStep);
    // Reciprocal inline pins: `pause-reflect-steps-io-parity.test.ts`.
  });
});
