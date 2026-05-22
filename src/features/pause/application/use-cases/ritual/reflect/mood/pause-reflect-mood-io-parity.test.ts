/**
 * Application-layer I/O parity for ritual reflect mood cluster (parity with
 * `pause-reflect-hub-io-parity.test.ts`; presentation pins stay colocated beside
 * `pause-reflect-mood-io.ts`).
 * Imports `pause-reflect-mood-flow` CI umbrella for `.toBe` identity pins only —
 * production mood I/O keeps domain mood helpers + `run-initial-emotion-log` leaf imports.
 * Presentation mirror: `presentation/reflect/mood/pause-reflect-mood-io-parity.test.ts`.
 * Hub-io sibling: reciprocal inline pins ↔ `hub/pause-reflect-hub-io-parity.test.ts` (application + presentation).
 * Telemetry-io sibling: reciprocal inline pins ↔ `telemetry/pause-reflect-telemetry-io-parity.test.ts`.
 */
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'supabasePauseRepository' },
  supabaseReflectGenerator: { port: 'supabaseReflectGenerator' },
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
import {
  messageFromReflectGenerationResult,
  pauseReflectGeneration,
  reflectGenerationPrerequisite,
  reflectGenerator,
  runReflectGeneration,
} from '@/features/pause/presentation/reflect/generation/pause-reflect-generation-io';
import {
  pauseReflectFavoriteToggle,
  pauseReflectNoteUpdate,
  pauseReflectTagUpdate,
  pauseReflectionStepLogOnce,
  pauseReflectFavoriteToggleWithRepository,
  pauseReflectNoteUpdateWithRepository,
  pauseReflectionStepLogOnceWithRepository,
} from '@/features/pause/presentation/reflect/steps/pause-reflect-steps-io';
import {
  formatReinforcementQuoteFromSession,
  pauseReflectOutcomeLog,
  pauseReflectOutcomeLogWithRepository,
  resolvePauseSessionReflectAndDecidePreflight,
} from '@/features/pause/presentation/reflect/flows/pause-reflect-flows-io';
import {
  getPendingPauseOfferDisplay,
  pauseAdoptPendingOffer,
  pauseAdoptPendingOfferWithRepository,
  pauseDeclinePendingOffer,
  pauseDeclinePendingOfferWithRepository,
} from '@/features/pause/presentation/reflect/pending-offer/pause-reflect-pending-offer-io';
import {
  buildShiftEmotionFrameHubLogBundle,
  pauseShiftEmotionFrameHubDone,
  pauseShiftEmotionFrameHubDoneWithRepository,
  resolveShiftFrameHubDonePresentation,
} from '@/features/pause/presentation/reflect/hub/pause-reflect-hub-io';
import * as hubIo from '@/features/pause/presentation/reflect/hub/pause-reflect-hub-io';
import * as moodIo from '@/features/pause/presentation/reflect/mood/pause-reflect-mood-io';
import {
  trackPauseReflectPostItOpen,
  trackPauseReflectShareTap,
  trackPauseReflectWallpaperTap,
} from '@/features/pause/presentation/reflect/telemetry/pause-reflect-telemetry-io';
import {
  startPauseReflectFrameFocusAmbience,
  stopPauseReflectFrameFocusAmbience,
} from '@/features/pause/presentation/reflect/ambience/pause-reflect-ambience-io';
import {
  buildReflectionShareText,
  pauseReflectionShareImage,
} from '@/features/pause/presentation/reflect/share/pause-reflect-share-io';
import { supabasePauseRepository } from '@/features/pause/public-rpc';

/**
 * Application mirror: `presentation/reflect/mood/pause-reflect-mood-io-parity.test.ts`.
 */
describe('pause-reflect-mood-io parity (application)', () => {
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

  it('presentation I/O exports mood RPC wrappers distinct from leaf use cases', () => {
    expect(typeof pauseInitialEmotionSelect).toBe('function');
    expect(typeof pauseInitialEmotionSelectWithRepository).toBe('function');
    expect(typeof pauseInitialEmotionSkip).toBe('function');
    expect(typeof pauseInitialEmotionSkipWithRepository).toBe('function');
    expect(pauseInitialEmotionSelect).not.toBe(runInitialEmotionSelect);
    expect(pauseInitialEmotionSkip).not.toBe(runInitialEmotionSkip);
  });

  it('pauseInitialEmotionSelect delegates to run-initial-emotion-log with default repository', async () => {
    const input = {
      pauseInstanceId: 'inst-mood-app',
      mood: 'calm' as const,
      lastFeelLogKey: null,
    };

    await pauseInitialEmotionSelect(input);

    expect(runInitialEmotionSelect).toHaveBeenCalledWith(supabasePauseRepository, input);
  });

  it('pauseInitialEmotionSkip delegates to run-initial-emotion-log with default repository', async () => {
    const input = { pauseInstanceId: 'inst-mood-app-skip' };

    await pauseInitialEmotionSkip(input);

    expect(runInitialEmotionSkip).toHaveBeenCalledWith(supabasePauseRepository, input);
  });

  it('pauseInitialEmotionSelectWithRepository delegates with injected repository', async () => {
    const customRepository = { port: 'customPauseRepository' };
    const input = {
      pauseInstanceId: 'inst-mood-app-custom',
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
    const input = { pauseInstanceId: 'inst-mood-app-skip-custom' };

    await pauseInitialEmotionSkipWithRepository(
      customRepository as unknown as typeof supabasePauseRepository,
      input,
    );

    expect(runInitialEmotionSkip).toHaveBeenCalledWith(customRepository, input);
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-hub-io-parity.test.ts` (application + presentation).
   * Dedicated sibling file: `pause-reflect-hub-mood-io-sibling-parity.test.ts`.
   */
  it('sibling cluster: hub-io shift-frame exports stay distinct from mood-io wrappers', () => {
    expect(pauseInitialEmotionSelect).not.toBe(pauseShiftEmotionFrameHubDone);
    expect(pauseInitialEmotionSkip).not.toBe(pauseShiftEmotionFrameHubDone);
    expect(pauseInitialEmotionSelectWithRepository).not.toBe(pauseShiftEmotionFrameHubDoneWithRepository);
    expect(buildFeelTilesFromMoodIo).not.toBe(buildShiftEmotionFrameHubLogBundle);
    expect(resolveChromeCloseFromMoodIo).not.toBe(resolveShiftFrameHubDonePresentation);
    expect(reflectPauseRepository).not.toBe(pauseShiftEmotionFrameHubDone);
    // Reciprocal inline pins: `pause-reflect-hub-io-parity.test.ts` (application + presentation).
    // Full pins: `pause-reflect-hub-mood-io-sibling-parity.test.ts`.
  });

  it('presentation mood-io and hub-io I/O namespaces stay separated (reciprocal inline)', () => {
    expect('pauseShiftEmotionFrameHubDone' in moodIo).toBe(false);
    expect('pauseShiftEmotionFrameHubDoneWithRepository' in moodIo).toBe(false);
    expect('buildShiftEmotionFrameHubLogBundle' in moodIo).toBe(false);
    expect('resolveShiftFrameHubDonePresentation' in moodIo).toBe(false);

    expect('pauseInitialEmotionSelect' in hubIo).toBe(false);
    expect('pauseInitialEmotionSkip' in hubIo).toBe(false);
    expect('pauseInitialEmotionSelectWithRepository' in hubIo).toBe(false);
    expect('pauseInitialEmotionSkipWithRepository' in hubIo).toBe(false);
    expect('buildFeelTilesMoodLogOptions' in hubIo).toBe(false);
    expect('resolvePauseSessionChromeCloseAction' in hubIo).toBe(false);
    // Reciprocal inline pins: `hub/pause-reflect-hub-io-parity.test.ts` (application + presentation).
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-generation-io-parity.test.ts` (application).
   */
  it('sibling cluster: generation-io holzen-reflect exports stay distinct from mood-io wrappers', () => {
    expect(pauseInitialEmotionSelect).not.toBe(runReflectGeneration);
    expect(pauseInitialEmotionSkip).not.toBe(pauseReflectGeneration);
    expect(buildFeelTilesMoodLogOptions).not.toBe(reflectGenerationPrerequisite);
    expect(reflectPauseRepository).not.toBe(reflectGenerator);
    expect(pauseInitialEmotionSelect).not.toBe(messageFromReflectGenerationResult);
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-steps-io-parity.test.ts` (application + presentation).
   * Dedicated sibling file: `pause-reflect-steps-mood-io-sibling-parity.test.ts`.
   */
  it('sibling cluster: steps-io exports stay distinct from mood-io wrappers', () => {
    expect(pauseInitialEmotionSelect).not.toBe(pauseReflectFavoriteToggle);
    expect(pauseInitialEmotionSkip).not.toBe(pauseReflectNoteUpdate);
    expect(pauseInitialEmotionSelectWithRepository).not.toBe(pauseReflectFavoriteToggleWithRepository);
    expect(pauseInitialEmotionSkipWithRepository).not.toBe(pauseReflectNoteUpdateWithRepository);
    expect(buildFeelTilesMoodLogOptions).not.toBe(pauseReflectionStepLogOnce);
    expect(buildFeelTilesMoodLogOptions).not.toBe(pauseReflectTagUpdate);
    expect(pauseInitialEmotionSelect).not.toBe(pauseReflectionStepLogOnceWithRepository);
    // Reciprocal inline pins: `pause-reflect-steps-io-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-flows-io-parity.test.ts` (application + presentation).
   * Dedicated sibling file: `pause-reflect-flows-mood-io-sibling-parity.test.ts`.
   */
  it('sibling cluster: flows-io reflect+decide exports stay distinct from mood-io wrappers', () => {
    expect(pauseInitialEmotionSelect).not.toBe(resolvePauseSessionReflectAndDecidePreflight);
    expect(pauseInitialEmotionSkip).not.toBe(pauseReflectOutcomeLog);
    expect(pauseInitialEmotionSelectWithRepository).not.toBe(pauseReflectOutcomeLogWithRepository);
    expect(buildFeelTilesMoodLogOptions).not.toBe(formatReinforcementQuoteFromSession);
    expect(pauseInitialEmotionSkip).not.toBe(pauseReflectOutcomeLogWithRepository);
    // Reciprocal inline pins: `pause-reflect-flows-io-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-pending-offer-io-parity.test.ts` (application + presentation).
   * Dedicated sibling file: `pause-reflect-mood-pending-offer-io-sibling-parity.test.ts`.
   */
  it('sibling cluster: pending-offer-io exports stay distinct from mood-io wrappers', () => {
    expect(pauseInitialEmotionSelect).not.toBe(pauseAdoptPendingOffer);
    expect(pauseInitialEmotionSkip).not.toBe(pauseDeclinePendingOffer);
    expect(pauseInitialEmotionSelectWithRepository).not.toBe(pauseAdoptPendingOfferWithRepository);
    expect(pauseInitialEmotionSkipWithRepository).not.toBe(pauseDeclinePendingOfferWithRepository);
    expect(buildFeelTilesMoodLogOptions).not.toBe(getPendingPauseOfferDisplay);
    // Reciprocal inline pins: `pause-reflect-pending-offer-io-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-telemetry-io-parity.test.ts` (application + presentation).
   * Dedicated sibling file: `pause-reflect-mood-telemetry-io-sibling-parity.test.ts`.
   */
  it('sibling cluster: session reflect telemetry-io exports stay distinct from mood-io wrappers', () => {
    expect(pauseInitialEmotionSelect).not.toBe(trackPauseReflectPostItOpen);
    expect(pauseInitialEmotionSkip).not.toBe(trackPauseReflectShareTap);
    expect(pauseInitialEmotionSelectWithRepository).not.toBe(trackPauseReflectWallpaperTap);
    expect(buildFeelTilesMoodLogOptions).not.toBe(trackPauseReflectPostItOpen);
    expect(reflectPauseRepository).not.toBe(trackPauseReflectShareTap);
    // Reciprocal inline pins: `pause-reflect-telemetry-io-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-ambience-io-parity.test.ts` (application).
   */
  it('sibling cluster: ambience-io frame-focus bed exports stay distinct from mood-io wrappers', () => {
    expect(pauseInitialEmotionSelect).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(pauseInitialEmotionSkip).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(buildFeelTilesFromMoodIo).not.toBe(startPauseReflectFrameFocusAmbience);
  });

  /**
   * Reciprocal inline pins ↔ `share/pause-reflect-share-io-parity.test.ts` (application + presentation).
   * Presentation mirror: `presentation/reflect/mood/pause-reflect-mood-io-parity.test.ts`.
   * Dedicated sibling file: `pause-reflect-share-mood-io-sibling-parity.test.ts`.
   */
  it('sibling cluster: share-io builders stay distinct from mood-io wrappers', () => {
    expect(pauseInitialEmotionSelect).not.toBe(pauseReflectionShareImage);
    expect(pauseInitialEmotionSkip).not.toBe(buildReflectionShareText);
    expect(pauseInitialEmotionSelectWithRepository).not.toBe(pauseReflectionShareImage);
    expect(pauseInitialEmotionSkipWithRepository).not.toBe(pauseReflectionShareImage);
    expect(pauseInitialEmotionSkipWithRepository).not.toBe(buildReflectionShareText);
    expect(buildFeelTilesMoodLogOptions).not.toBe(buildReflectionShareText);
    expect(buildFeelTilesFromMoodIo).not.toBe(pauseReflectionShareImage);
    expect(buildFeelTilesFromMoodIo).not.toBe(buildReflectionShareText);
    expect(reflectPauseRepository).not.toBe(pauseReflectionShareImage);
    // Reciprocal inline pins: `share/pause-reflect-share-io-parity.test.ts`,
    // `presentation/reflect/mood/pause-reflect-mood-io-parity.test.ts`.
    // Full pins: `pause-reflect-share-mood-io-sibling-parity.test.ts`.
  });
});
