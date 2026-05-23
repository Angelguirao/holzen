import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'supabasePauseRepository' },
  supabaseReflectGenerator: { port: 'supabaseReflectGenerator' },
}));

vi.mock('@/features/pause/application/use-cases/ritual/feel/run-initial-emotion-log', () => ({
  runInitialEmotionSelect: vi.fn(() => Promise.resolve({ status: 'local_only' as const, ui: {} })),
  runInitialEmotionSkip: vi.fn(() => Promise.resolve({ status: 'local_only' as const, ui: {} })),
}));

import {
  applyBriefDepthPickerRitualEntry as applyBriefDirect,
  applyDeepDepthPickerRitualEntry as applyDeepDirect,
} from '@/features/pause/domain/feel/apply-depth-picker-ritual-entry';
import { buildFeelTilesMoodLogOptions as buildFeelTilesDirect } from '@/features/pause/domain/feel/build-feel-tiles-mood-log-options';
import {
  initialEmotionResetUi as resetUiDirect,
  initialEmotionSelectRollbackUi as rollbackUiDirect,
} from '@/features/pause/domain/feel/initial-emotion-presentation';
import { isPauseSessionDepthPickerActive as isDepthPickerActiveDirect } from '@/features/pause/domain/feel/pause-depth-picker-active';
import {
  resolvePauseSessionChromeCloseAction as resolveChromeCloseDirect,
  runPauseSessionChromeCloseAction as runChromeCloseDirect,
} from '@/features/pause/domain/feel/pause-session-chrome-close';
import { runDeepPausePickerEntryIfPro as runDeepPickerDirect } from '@/features/pause/domain/feel/run-deep-pause-picker-entry-if-pro';
import { resolvePauseDepthContextLineParams as resolveDepthLineDirect } from '@/features/pause/domain/feel/resolve-pause-depth-context-line-params';
import {
  runInitialEmotionSelect,
  runInitialEmotionSkip,
} from '@/features/pause/application/use-cases/ritual/feel/run-initial-emotion-log';
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
} from '@/features/pause/application/use-cases/ritual/feel/pause-feel-flow';
import {
  messageFromReflectGenerationResult,
  pauseReflectGeneration,
  reflectGenerationPrerequisite,
  reflectGenerator,
  resolveReflectGenerationPrefetch,
  runReflectGeneration,
  shouldCommitReflectGeneration,
} from '@/features/pause/presentation/reflect/generation/pause-reflect-generation-io';
import {
  buildPauseScoreImpacts,
  formatReinforcementQuoteFromSession,
  getSessionQuote,
  pauseReflectOutcomeLog,
  pauseReflectOutcomeLogWithRepository,
  resolvePauseDecideOutcomeFlow,
  resolvePauseSessionReflectAndDecideAfterGeneration,
  resolvePauseSessionReflectAndDecidePreflight,
  showPauseOutcomeNotCompletedToast,
  showPauseOutcomeSaveFailedToast,
} from '@/features/pause/presentation/reflect/flows/pause-reflect-flows-io';
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
import {
  getPendingPauseOfferDisplay,
  pauseAdoptPendingOffer,
  pauseAdoptPendingOfferWithRepository,
  pauseDeclinePendingOffer,
  pauseDeclinePendingOfferWithRepository,
} from '@/features/pause/presentation/reflect/pending-offer/pause-reflect-pending-offer-io';
import {
  startPauseReflectFrameFocusAmbience,
  stopPauseReflectFrameFocusAmbience,
} from '@/features/pause/presentation/reflect/ambience/pause-reflect-ambience-io';
import {
  buildReflectionShareTelegramUrl,
  buildReflectionShareText,
  buildReflectionShareTweetUrl,
  buildReflectionShareWhatsAppUrl,
  pauseReflectionShareImage,
} from '@/features/pause/presentation/reflect/share/pause-reflect-share-io';
import {
  buildShiftEmotionFrameHubLogBundle,
  pauseShiftEmotionFrameHubDone,
  pauseShiftEmotionFrameHubDoneWithRepository,
  resolveShiftFrameHubDonePresentation,
} from '@/features/pause/presentation/reflect/hub/pause-reflect-hub-io';
import * as hubIo from '@/features/pause/presentation/reflect/hub/pause-reflect-hub-io';
import * as moodIo from './pause-feel-io';
import * as shareIo from '../reflect/share/pause-reflect-share-io';
import { supabasePauseRepository } from '@/features/pause/public-rpc';

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
} from './pause-feel-io';

/**
 * Presentation mood I/O parity (colocated beside `pause-feel-io.ts`).
 * Application mirror: `application/use-cases/ritual/feel/pause-feel-io-parity.test.ts`.
 * Share-io sibling pins: `pause-reflect-share-feel-io-sibling-parity.test.ts` (application + presentation);
 * reciprocal inline pins ↔ `presentation/reflect/share/pause-reflect-share-io-parity.test.ts` (share cluster).
 * Ambience-io sibling pins: `pause-reflect-ambience-feel-io-sibling-parity.test.ts` (presentation);
 * reciprocal inline pins ↔ `pause-reflect-ambience-io-parity.test.ts` (ambience cluster).
 * Steps-io sibling pins: `pause-reflect-steps-feel-io-sibling-parity.test.ts` (application + presentation);
 * reciprocal inline pins ↔ `pause-reflect-steps-io-parity.test.ts` (application).
 * Flows-io sibling pins: `pause-reflect-flows-feel-io-sibling-parity.test.ts` (application + presentation);
 * reciprocal inline pins ↔ colocated `presentation/reflect/flows/pause-reflect-flows-io-parity.test.ts`.
 * Generation-io sibling pins: `pause-reflect-generation-feel-io-sibling-parity.test.ts` (application + presentation);
 * reciprocal inline pins ↔ `presentation/reflect/generation/pause-reflect-generation-io-parity.test.ts`.
 * Pending-offer-io sibling pins: `pause-feel-pending-offer-io-sibling-parity.test.ts` (application + presentation);
 * reciprocal inline pins ↔ `pause-reflect-pending-offer-io-parity.test.ts`.
 * Ambience-io sibling pins: `pause-reflect-ambience-feel-io-sibling-parity.test.ts` (application + presentation);
 * reciprocal inline pins ↔ `pause-reflect-ambience-io-parity.test.ts`.
 * Share-io sibling pins: `pause-reflect-share-feel-io-sibling-parity.test.ts` (application + presentation);
 * reciprocal inline pins ↔ `presentation/reflect/share/pause-reflect-share-io-parity.test.ts`.
 * Hub-io sibling pins: `pause-reflect-hub-feel-io-sibling-parity.test.ts` (application + presentation);
 * reciprocal inline pins ↔ `presentation/reflect/hub/pause-reflect-hub-io-parity.test.ts` (hub cluster).
 */
describe('pause-feel-io parity', () => {
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

  it('presentation I/O mood exports match pause-feel-flow CI umbrella', () => {
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
   * Reciprocal inline pins ↔ `presentation/reflect/hub/pause-reflect-hub-io-parity.test.ts` (initial-emotion vs shift-frame hub).
   * Dedicated sibling file: `pause-reflect-hub-feel-io-sibling-parity.test.ts` (application + presentation).
   */
  it('sibling cluster: hub-io shift-frame exports stay distinct from mood-io wrappers', () => {
    expect(pauseInitialEmotionSelect).not.toBe(pauseShiftEmotionFrameHubDone);
    expect(pauseInitialEmotionSkip).not.toBe(pauseShiftEmotionFrameHubDone);
    expect(pauseInitialEmotionSelectWithRepository).not.toBe(pauseShiftEmotionFrameHubDoneWithRepository);
    expect(pauseInitialEmotionSkipWithRepository).not.toBe(pauseShiftEmotionFrameHubDoneWithRepository);
    expect(buildFeelTilesFromMoodIo).not.toBe(buildShiftEmotionFrameHubLogBundle);
    expect(resolveChromeCloseFromMoodIo).not.toBe(resolveShiftFrameHubDonePresentation);
    expect(reflectPauseRepository).not.toBe(pauseShiftEmotionFrameHubDone);
    // Reciprocal inline pins: `presentation/reflect/hub/pause-reflect-hub-io-parity.test.ts`.
    // Full pins: `pause-reflect-hub-feel-io-sibling-parity.test.ts`.
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
    // Reciprocal inline pins: `presentation/reflect/hub/pause-reflect-hub-io-parity.test.ts`.
  });

  it('presentation mood-io and share-io I/O namespaces stay separated (reciprocal inline)', () => {
    expect('pauseReflectionShareImage' in moodIo).toBe(false);
    expect('buildReflectionShareText' in moodIo).toBe(false);
    expect('buildReflectionShareTweetUrl' in moodIo).toBe(false);
    expect('buildReflectionShareTelegramUrl' in moodIo).toBe(false);
    expect('buildReflectionShareWhatsAppUrl' in moodIo).toBe(false);

    expect('pauseInitialEmotionSelect' in shareIo).toBe(false);
    expect('pauseInitialEmotionSkip' in shareIo).toBe(false);
    expect('pauseInitialEmotionSelectWithRepository' in shareIo).toBe(false);
    expect('pauseInitialEmotionSkipWithRepository' in shareIo).toBe(false);
    expect('buildFeelTilesMoodLogOptions' in shareIo).toBe(false);
    expect('resolvePauseSessionChromeCloseAction' in shareIo).toBe(false);
    // Reciprocal inline pins: `presentation/reflect/share/pause-reflect-share-io-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `presentation/reflect/generation/pause-reflect-generation-io-parity.test.ts` (mood RPC vs holzen-reflect).
   * Dedicated sibling file: `pause-reflect-generation-feel-io-sibling-parity.test.ts` (application + presentation).
   */
  it('sibling cluster: generation-io exports stay distinct from mood-io wrappers', () => {
    expect(pauseInitialEmotionSelect).not.toBe(pauseReflectGeneration);
    expect(pauseInitialEmotionSkip).not.toBe(runReflectGeneration);
    expect(buildFeelTilesMoodLogOptions).not.toBe(reflectGenerationPrerequisite);
    expect(pauseInitialEmotionSelectWithRepository).not.toBe(resolveReflectGenerationPrefetch);
    expect(pauseInitialEmotionSkip).not.toBe(shouldCommitReflectGeneration);
    expect(applyBriefDepthPickerRitualEntry).not.toBe(messageFromReflectGenerationResult);
    expect(reflectPauseRepository).not.toBe(reflectGenerator);
    expect(pauseInitialEmotionSelect).not.toBe(runReflectGeneration);
    // Reciprocal inline pins: `presentation/reflect/generation/pause-reflect-generation-io-parity.test.ts`.
    // Full pins: `pause-reflect-generation-feel-io-sibling-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `presentation/reflect/flows/pause-reflect-flows-io-parity.test.ts` (mood RPC vs reflect+decide).
   * Dedicated sibling file: `pause-reflect-flows-feel-io-sibling-parity.test.ts` (application + presentation).
   */
  it('sibling cluster: flows-io exports stay distinct from mood-io wrappers', () => {
    expect(pauseInitialEmotionSelect).not.toBe(pauseReflectOutcomeLog);
    expect(pauseInitialEmotionSkip).not.toBe(pauseReflectOutcomeLogWithRepository);
    expect(buildFeelTilesMoodLogOptions).not.toBe(resolvePauseSessionReflectAndDecidePreflight);
    expect(pauseInitialEmotionSelectWithRepository).not.toBe(resolvePauseSessionReflectAndDecideAfterGeneration);
    expect(pauseInitialEmotionSkip).not.toBe(formatReinforcementQuoteFromSession);
    expect(buildFeelTilesMoodLogOptions).not.toBe(resolvePauseDecideOutcomeFlow);
    expect(pauseInitialEmotionSelect).not.toBe(getSessionQuote);
    expect(pauseInitialEmotionSkip).not.toBe(buildPauseScoreImpacts);
    expect(buildFeelTilesMoodLogOptions).not.toBe(showPauseOutcomeNotCompletedToast);
    expect(resolvePauseSessionChromeCloseAction).not.toBe(showPauseOutcomeSaveFailedToast);
    // Reciprocal inline pins: `presentation/reflect/flows/pause-reflect-flows-io-parity.test.ts`.
    // Full pins: `pause-reflect-flows-feel-io-sibling-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-steps-io-parity.test.ts` (application; mood RPC vs step mutations).
   * Dedicated sibling file: `pause-reflect-steps-feel-io-sibling-parity.test.ts` (application + presentation).
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
    // Reciprocal inline pins: `pause-reflect-steps-io-parity.test.ts` (application).
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-ambience-io-parity.test.ts` (mood RPC vs frame-focus ambience bed).
   * Dedicated sibling file: `pause-reflect-ambience-feel-io-sibling-parity.test.ts` (application + presentation).
   */
  it('sibling cluster: ambience-io exports stay distinct from mood-io wrappers', () => {
    expect(pauseInitialEmotionSelect).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(pauseInitialEmotionSkip).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(pauseInitialEmotionSelectWithRepository).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(pauseInitialEmotionSkipWithRepository).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(buildFeelTilesFromMoodIo).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(buildFeelTilesFromMoodIo).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(applyBriefFromMoodIo).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(runChromeCloseFromMoodIo).not.toBe(stopPauseReflectFrameFocusAmbience);
    // Reciprocal inline pins: `pause-reflect-ambience-io-parity.test.ts`.
    // Full pins: `pause-reflect-ambience-feel-io-sibling-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-pending-offer-io-parity.test.ts` (mood RPC vs pending-offer adopt/decline).
   * Dedicated sibling file: `pause-feel-pending-offer-io-sibling-parity.test.ts` (application + presentation).
   */
  it('sibling cluster: pending-offer-io exports stay distinct from mood-io wrappers', () => {
    expect(pauseInitialEmotionSelect).not.toBe(pauseAdoptPendingOffer);
    expect(pauseInitialEmotionSkip).not.toBe(pauseDeclinePendingOffer);
    expect(pauseInitialEmotionSelectWithRepository).not.toBe(pauseAdoptPendingOfferWithRepository);
    expect(pauseInitialEmotionSkipWithRepository).not.toBe(pauseDeclinePendingOfferWithRepository);
    expect(buildFeelTilesMoodLogOptions).not.toBe(getPendingPauseOfferDisplay);
    expect(pauseInitialEmotionSelect).not.toBe(getPendingPauseOfferDisplay);
    expect(applyBriefDepthPickerRitualEntry).not.toBe(pauseAdoptPendingOffer);
    expect(runPauseSessionChromeCloseAction).not.toBe(pauseDeclinePendingOffer);
    // Reciprocal inline pins: `pause-reflect-pending-offer-io-parity.test.ts`.
    // Full pins: `pause-feel-pending-offer-io-sibling-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-ambience-io-parity.test.ts` (mood RPC vs frame-focus bed).
   * Dedicated sibling file: `pause-reflect-ambience-feel-io-sibling-parity.test.ts` (presentation).
   */
  it('sibling cluster: ambience-io exports stay distinct from mood-io wrappers', () => {
    expect(pauseInitialEmotionSelect).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(pauseInitialEmotionSkip).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(pauseInitialEmotionSelectWithRepository).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(pauseInitialEmotionSkipWithRepository).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(buildFeelTilesMoodLogOptions).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(buildFeelTilesMoodLogOptions).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(reflectPauseRepository).not.toBe(startPauseReflectFrameFocusAmbience);
    // Reciprocal inline pins: `pause-reflect-ambience-io-parity.test.ts`.
    // Full pins: `pause-reflect-ambience-feel-io-sibling-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `presentation/reflect/share/pause-reflect-share-io-parity.test.ts` (mood RPC vs share builders).
   * Dedicated sibling file: `pause-reflect-share-feel-io-sibling-parity.test.ts` (application + presentation).
   */
  it('sibling cluster: share-io builders stay distinct from mood-io wrappers', () => {
    expect(pauseInitialEmotionSelect).not.toBe(pauseReflectionShareImage);
    expect(pauseInitialEmotionSkip).not.toBe(buildReflectionShareText);
    expect(pauseInitialEmotionSelectWithRepository).not.toBe(buildReflectionShareTweetUrl);
    expect(pauseInitialEmotionSkipWithRepository).not.toBe(buildReflectionShareTelegramUrl);
    expect(buildFeelTilesMoodLogOptions).not.toBe(buildReflectionShareWhatsAppUrl);
    expect(pauseInitialEmotionSelectWithRepository).not.toBe(pauseReflectionShareImage);
    expect(pauseInitialEmotionSkipWithRepository).not.toBe(buildReflectionShareText);
    expect(buildFeelTilesMoodLogOptions).not.toBe(pauseReflectionShareImage);
    expect(buildFeelTilesFromMoodIo).not.toBe(buildReflectionShareText);
    expect(applyBriefDepthPickerRitualEntry).not.toBe(pauseReflectionShareImage);
    expect(runPauseSessionChromeCloseAction).not.toBe(buildReflectionShareText);
    expect(reflectPauseRepository).not.toBe(pauseReflectionShareImage);
    // Reciprocal inline pins: `presentation/reflect/share/pause-reflect-share-io-parity.test.ts`.
    // Full pins: `pause-reflect-share-feel-io-sibling-parity.test.ts`.
  });
});
