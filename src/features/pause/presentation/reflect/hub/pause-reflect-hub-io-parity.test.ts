import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'supabasePauseRepository' },
  supabaseReflectGenerator: { port: 'supabaseReflectGenerator' }
}));

vi.mock('@/features/pause/application/use-cases/ritual/reflect/hub/run-shift-emotion-frame-hub-done', () => ({
  runShiftEmotionFrameHubDone: vi.fn(() => Promise.resolve({ status: 'advance' as const, logKey: 'k' }))
}));

import { runShiftEmotionFrameHubDone as runShiftHubDoneDirect } from '@/features/pause/application/use-cases/ritual/reflect/hub/run-shift-emotion-frame-hub-done';
import {
  buildShiftEmotionFrameHubLogBundle,
  resolveShiftFrameHubDonePresentation,
  runShiftEmotionFrameHubDone as runShiftHubDoneFromFlow
} from '@/features/pause/application/use-cases/ritual/reflect/hub/pause-reflect-hub-flow';
import {
  buildShiftEmotionFrameHubLogBundle as buildLogBundleFromHubIo,
  pauseShiftEmotionFrameHubDone,
  pauseShiftEmotionFrameHubDoneWithRepository,
  reflectPauseRepository,
  resolveShiftFrameHubDonePresentation as resolvePresentationFromHubIo
} from './pause-reflect-hub-io';
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
  shouldShowFavoriteProHint
} from '@/features/pause/presentation/reflect/steps/pause-reflect-steps-io';
import {
  buildPauseScoreImpacts,
  pauseReflectOutcomeLog,
  pauseReflectOutcomeLogWithRepository,
  resolvePauseDecideOutcomeFlow,
  resolvePauseSessionReflectAndDecideAfterGeneration,
  resolvePauseSessionReflectAndDecidePreflight,
  showPauseOutcomeNotCompletedToast,
  showPauseOutcomeSaveFailedToast
} from '@/features/pause/presentation/reflect/flows/pause-reflect-flows-io';
import {
  getPendingPauseOfferDisplay,
  pauseAdoptPendingOffer,
  pauseAdoptPendingOfferWithRepository,
  pauseDeclinePendingOffer,
  pauseDeclinePendingOfferWithRepository
} from '@/features/pause/presentation/reflect/pending-offer/pause-reflect-pending-offer-io';
import {
  messageFromReflectGenerationResult,
  pauseReflectGeneration,
  reflectGenerationPrerequisite,
  reflectGenerator,
  runReflectGeneration,
  shouldCommitReflectGeneration
} from '@/features/pause/presentation/reflect/generation/pause-reflect-generation-io';
import {
  startPauseReflectFrameFocusAmbience,
  stopPauseReflectFrameFocusAmbience
} from '@/features/pause/presentation/reflect/ambience/pause-reflect-ambience-io';
import {
  trackPauseReflectPostItOpen,
  trackPauseReflectShareTap,
  trackPauseReflectWallpaperTap
} from '@/features/pause/presentation/reflect/telemetry/pause-reflect-telemetry-io';
import {
  buildReflectionShareTelegramUrl,
  buildReflectionShareText,
  buildReflectionShareTweetUrl,
  buildReflectionShareWhatsAppUrl,
  pauseReflectionShareImage
} from '@/features/pause/presentation/reflect/share/pause-reflect-share-io';
import {
  applyBriefDepthPickerRitualEntry,
  applyDeepDepthPickerRitualEntry,
  buildFeelTilesMoodLogOptions,
  pauseInitialEmotionSelect,
  pauseInitialEmotionSkip,
  pauseInitialEmotionSelectWithRepository,
  pauseInitialEmotionSkipWithRepository,
  resolvePauseSessionChromeCloseAction
} from '@/features/pause/presentation/feel/pause-feel-io';
import * as hubIo from './pause-reflect-hub-io';
import * as generationIo from '../generation/pause-reflect-generation-io';
import * as moodIo from '../../feel/pause-feel-io';
import * as shareIo from '../share/pause-reflect-share-io';
import { supabasePauseRepository } from '@/features/pause/public-rpc';

/**
 * Presentation hub I/O parity (colocated beside `pause-reflect-hub-io.ts`).
 * Application mirror: `application/use-cases/ritual/reflect/hub/pause-reflect-hub-io-parity.test.ts`.
 * Steps-io sibling pins: `pause-reflect-steps-hub-io-sibling-parity.test.ts` (application + presentation);
 * reciprocal inline pins ↔ `pause-reflect-steps-io-parity.test.ts` (steps cluster).
 * Flows-io sibling pins: `pause-reflect-flows-hub-io-sibling-parity.test.ts` (application + presentation);
 * reciprocal inline pins ↔ `pause-reflect-flows-io-parity.test.ts` (flows cluster).
 * Generation-io sibling pins: `pause-reflect-generation-hub-io-sibling-parity.test.ts` (application + presentation);
 * reciprocal inline pins ↔ `pause-reflect-generation-io-parity.test.ts` (generation cluster).
 * Ambience-io sibling pins: `pause-reflect-ambience-hub-io-sibling-parity.test.ts` (application + presentation);
 * reciprocal inline pins ↔ `pause-reflect-ambience-io-parity.test.ts` (ambience cluster).
 * Telemetry-io sibling pins: `pause-reflect-hub-telemetry-io-sibling-parity.test.ts` (application + presentation);
 * reciprocal inline pins ↔ `pause-reflect-telemetry-io-parity.test.ts` (telemetry cluster).
 * Share-io sibling pins: `pause-reflect-hub-share-io-sibling-parity.test.ts` (application + presentation);
 * reciprocal inline pins ↔ `presentation/reflect/share/pause-reflect-share-io-parity.test.ts` (share cluster).
 * Mood-io sibling pins: `pause-reflect-hub-feel-io-sibling-parity.test.ts` (application + presentation);
 * reciprocal inline pins ↔ `presentation/feel/pause-feel-io-parity.test.ts` (mood cluster).
 */
describe('pause-reflect-hub-io parity', () => {
  it('presentation I/O hub exports match pause-reflect-hub-flow CI umbrella', () => {
    expect(buildShiftEmotionFrameHubLogBundle).toBe(buildLogBundleFromHubIo);
    expect(resolveShiftFrameHubDonePresentation).toBe(resolvePresentationFromHubIo);
    expect(runShiftHubDoneFromFlow).toBe(runShiftHubDoneDirect);
  });

  it('presentation I/O binds reflectPauseRepository to public-rpc supabasePauseRepository', () => {
    expect(reflectPauseRepository).toBe(supabasePauseRepository);
  });

  it('presentation I/O exports hub RPC wrapper distinct from leaf use case', () => {
    expect(typeof pauseShiftEmotionFrameHubDone).toBe('function');
    expect(typeof pauseShiftEmotionFrameHubDoneWithRepository).toBe('function');
    expect(pauseShiftEmotionFrameHubDone).not.toBe(runShiftHubDoneDirect);
  });

  it('pauseShiftEmotionFrameHubDone delegates to run-shift-emotion-frame-hub-done with default repository', async () => {
    const input = { pauseInstanceId: 'inst-hub', lastShiftLogKey: null };

    await pauseShiftEmotionFrameHubDone(input);

    expect(runShiftHubDoneDirect).toHaveBeenCalledWith(supabasePauseRepository, input);
  });

  it('pauseShiftEmotionFrameHubDoneWithRepository delegates with injected repository', async () => {
    const customRepository = { port: 'customPauseRepository' };
    const input = { pauseInstanceId: 'inst-hub-custom', lastShiftLogKey: 'key-1' };

    await pauseShiftEmotionFrameHubDoneWithRepository(
      customRepository as unknown as typeof supabasePauseRepository,
      input,
    );

    expect(runShiftHubDoneDirect).toHaveBeenCalledWith(customRepository, input);
  });

  /**
   * Reciprocal inline pins ↔ `presentation/reflect/generation/pause-reflect-generation-io-parity.test.ts` (shift-frame hub vs holzen-reflect).
   * Dedicated sibling file: `pause-reflect-generation-hub-io-sibling-parity.test.ts` (application + presentation).
   */
  it('sibling cluster: generation-io holzen-reflect exports stay distinct from hub-io wrappers', () => {
    expect(pauseShiftEmotionFrameHubDone).not.toBe(runReflectGeneration);
    expect(pauseShiftEmotionFrameHubDoneWithRepository).not.toBe(pauseReflectGeneration);
    expect(buildLogBundleFromHubIo).not.toBe(reflectGenerationPrerequisite);
    expect(resolvePresentationFromHubIo).not.toBe(shouldCommitReflectGeneration);
    expect(reflectPauseRepository).not.toBe(reflectGenerator);
    expect(pauseShiftEmotionFrameHubDone).not.toBe(messageFromReflectGenerationResult);
    expect(buildLogBundleFromHubIo).not.toBe(runReflectGeneration);
    // Reciprocal inline pins: `presentation/reflect/generation/pause-reflect-generation-io-parity.test.ts`.
    // Full pins: `pause-reflect-generation-hub-io-sibling-parity.test.ts`.
  });

  it('presentation hub-io and generation-io I/O namespaces stay separated (reciprocal inline)', () => {
    expect('runReflectGeneration' in hubIo).toBe(false);
    expect('pauseReflectGeneration' in hubIo).toBe(false);
    expect('reflectGenerationPrerequisite' in hubIo).toBe(false);
    expect('shouldCommitReflectGeneration' in hubIo).toBe(false);
    expect('reflectGenerator' in hubIo).toBe(false);
    expect('messageFromReflectGenerationResult' in hubIo).toBe(false);
    expect('resolveReflectGenerationPrefetch' in hubIo).toBe(false);

    expect('pauseShiftEmotionFrameHubDone' in generationIo).toBe(false);
    expect('pauseShiftEmotionFrameHubDoneWithRepository' in generationIo).toBe(false);
    expect('buildShiftEmotionFrameHubLogBundle' in generationIo).toBe(false);
    expect('resolveShiftFrameHubDonePresentation' in generationIo).toBe(false);
    expect('reflectPauseRepository' in generationIo).toBe(false);
    // Reciprocal inline pins: `presentation/reflect/generation/pause-reflect-generation-io-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-steps-io-parity.test.ts` (shift-frame hub RPC vs step wrappers).
   * Dedicated sibling file: `pause-reflect-steps-hub-io-sibling-parity.test.ts`.
   */
  it('sibling cluster: steps-io exports stay distinct from hub-io wrappers', () => {
    expect(pauseShiftEmotionFrameHubDone).not.toBe(pauseReflectFavoriteToggle);
    expect(pauseShiftEmotionFrameHubDoneWithRepository).not.toBe(pauseReflectNoteUpdate);
    expect(pauseShiftEmotionFrameHubDone).not.toBe(pauseReflectTagUpdate);
    expect(buildLogBundleFromHubIo).not.toBe(pauseReflectionStepLogOnce);
    expect(pauseShiftEmotionFrameHubDoneWithRepository).not.toBe(pauseReflectFavoriteToggleWithRepository);
    expect(pauseShiftEmotionFrameHubDone).not.toBe(pauseReflectNoteUpdateWithRepository);
    expect(resolvePresentationFromHubIo).not.toBe(pauseReflectionStepLogOnceWithRepository);
    expect(buildLogBundleFromHubIo).not.toBe(shouldShowFavoriteProHint);
    expect(resolvePresentationFromHubIo).not.toBe(shouldLogPauseReflectionStep);
    expect(reflectPauseRepository).not.toBe(pauseReflectFavoriteToggle);
    // Reciprocal inline pins: `pause-reflect-steps-io-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-flows-io-parity.test.ts` (shift-frame hub vs reflect+decide).
   * Dedicated sibling file: `pause-reflect-flows-hub-io-sibling-parity.test.ts` (application + presentation).
   */
  it('sibling cluster: flows-io reflect+decide exports stay distinct from hub-io wrappers', () => {
    expect(pauseShiftEmotionFrameHubDone).not.toBe(resolvePauseSessionReflectAndDecidePreflight);
    expect(pauseShiftEmotionFrameHubDone).not.toBe(pauseReflectOutcomeLog);
    expect(pauseShiftEmotionFrameHubDoneWithRepository).not.toBe(pauseReflectOutcomeLogWithRepository);
    expect(resolveShiftFrameHubDonePresentation).not.toBe(resolvePauseDecideOutcomeFlow);
    expect(pauseShiftEmotionFrameHubDone).not.toBe(showPauseOutcomeNotCompletedToast);
    expect(pauseShiftEmotionFrameHubDone).not.toBe(buildPauseScoreImpacts);
    expect(pauseShiftEmotionFrameHubDoneWithRepository).not.toBe(showPauseOutcomeSaveFailedToast);
    // Full pins: `pause-reflect-flows-hub-io-sibling-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-pending-offer-io-parity.test.ts` (shift-frame hub vs pending-offer RPC).
   * Dedicated sibling file: `pause-reflect-hub-pending-offer-io-sibling-parity.test.ts` (application + presentation).
   */
  it('sibling cluster: pending-offer-io exports stay distinct from hub-io wrappers', () => {
    expect(pauseShiftEmotionFrameHubDone).not.toBe(pauseAdoptPendingOffer);
    expect(pauseShiftEmotionFrameHubDone).not.toBe(pauseDeclinePendingOffer);
    expect(pauseShiftEmotionFrameHubDoneWithRepository).not.toBe(pauseAdoptPendingOfferWithRepository);
    expect(pauseShiftEmotionFrameHubDoneWithRepository).not.toBe(pauseDeclinePendingOfferWithRepository);
    expect(buildLogBundleFromHubIo).not.toBe(getPendingPauseOfferDisplay);
    expect(resolvePresentationFromHubIo).not.toBe(getPendingPauseOfferDisplay);
    expect(pauseShiftEmotionFrameHubDone).not.toBe(pauseAdoptPendingOfferWithRepository);
    expect(resolvePresentationFromHubIo).not.toBe(pauseDeclinePendingOffer);
    // Reciprocal inline pins: `pause-reflect-pending-offer-io-parity.test.ts`.
    // Full pins: `pause-reflect-hub-pending-offer-io-sibling-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-ambience-io-parity.test.ts` (shift-frame hub vs frame-focus bed).
   * Dedicated sibling file: `pause-reflect-ambience-hub-io-sibling-parity.test.ts` (application + presentation).
   */
  it('sibling cluster: ambience-io frame-focus bed exports stay distinct from hub-io wrappers', () => {
    expect(pauseShiftEmotionFrameHubDone).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(pauseShiftEmotionFrameHubDone).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(pauseShiftEmotionFrameHubDoneWithRepository).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(pauseShiftEmotionFrameHubDoneWithRepository).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(buildLogBundleFromHubIo).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(resolvePresentationFromHubIo).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(reflectPauseRepository).not.toBe(startPauseReflectFrameFocusAmbience);
    // Reciprocal inline pins: `pause-reflect-ambience-io-parity.test.ts`.
    // Full pins: `pause-reflect-ambience-hub-io-sibling-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-telemetry-io-parity.test.ts` (shift-frame hub vs session reflect telemetry).
   * Dedicated sibling file: `pause-reflect-hub-telemetry-io-sibling-parity.test.ts` (application + presentation).
   */
  it('sibling cluster: session reflect telemetry-io exports stay distinct from hub-io wrappers', () => {
    expect(pauseShiftEmotionFrameHubDone).not.toBe(trackPauseReflectPostItOpen);
    expect(pauseShiftEmotionFrameHubDoneWithRepository).not.toBe(trackPauseReflectShareTap);
    expect(buildLogBundleFromHubIo).not.toBe(trackPauseReflectWallpaperTap);
    expect(resolvePresentationFromHubIo).not.toBe(trackPauseReflectPostItOpen);
    expect(reflectPauseRepository).not.toBe(trackPauseReflectShareTap);
    expect(pauseShiftEmotionFrameHubDone).not.toBe(trackPauseReflectWallpaperTap);
    // Reciprocal inline pins: `pause-reflect-telemetry-io-parity.test.ts`.
    // Full pins: `pause-reflect-hub-telemetry-io-sibling-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `presentation/feel/pause-feel-io-parity.test.ts` (shift-frame hub vs initial-emotion).
   * Dedicated sibling file: `pause-reflect-hub-feel-io-sibling-parity.test.ts` (application + presentation).
   */
  it('sibling cluster: mood-io initial-emotion exports stay distinct from hub-io wrappers', () => {
    expect(pauseShiftEmotionFrameHubDone).not.toBe(pauseInitialEmotionSelect);
    expect(pauseShiftEmotionFrameHubDone).not.toBe(pauseInitialEmotionSkip);
    expect(pauseShiftEmotionFrameHubDoneWithRepository).not.toBe(pauseInitialEmotionSelectWithRepository);
    expect(pauseShiftEmotionFrameHubDoneWithRepository).not.toBe(pauseInitialEmotionSkipWithRepository);
    expect(buildLogBundleFromHubIo).not.toBe(buildFeelTilesMoodLogOptions);
    expect(resolvePresentationFromHubIo).not.toBe(buildFeelTilesMoodLogOptions);
    expect(pauseShiftEmotionFrameHubDone).not.toBe(applyBriefDepthPickerRitualEntry);
    expect(pauseShiftEmotionFrameHubDoneWithRepository).not.toBe(applyDeepDepthPickerRitualEntry);
    expect(buildShiftEmotionFrameHubLogBundle).not.toBe(resolvePauseSessionChromeCloseAction);
    expect(reflectPauseRepository).not.toBe(pauseInitialEmotionSelect);
    // Reciprocal inline pins: `presentation/feel/pause-feel-io-parity.test.ts`.
    // Full pins: `pause-reflect-hub-feel-io-sibling-parity.test.ts`.
  });

  it('presentation hub-io and mood-io I/O namespaces stay separated (reciprocal inline)', () => {
    expect('pauseInitialEmotionSelect' in hubIo).toBe(false);
    expect('pauseInitialEmotionSkip' in hubIo).toBe(false);
    expect('pauseInitialEmotionSelectWithRepository' in hubIo).toBe(false);
    expect('pauseInitialEmotionSkipWithRepository' in hubIo).toBe(false);
    expect('buildFeelTilesMoodLogOptions' in hubIo).toBe(false);
    expect('resolvePauseSessionChromeCloseAction' in hubIo).toBe(false);

    expect('pauseShiftEmotionFrameHubDone' in moodIo).toBe(false);
    expect('pauseShiftEmotionFrameHubDoneWithRepository' in moodIo).toBe(false);
    expect('buildShiftEmotionFrameHubLogBundle' in moodIo).toBe(false);
    expect('resolveShiftFrameHubDonePresentation' in moodIo).toBe(false);
    // Reciprocal inline pins: `presentation/feel/pause-feel-io-parity.test.ts`.
  });

  it('presentation hub-io and share-io I/O namespaces stay separated (reciprocal inline)', () => {
    expect('pauseReflectionShareImage' in hubIo).toBe(false);
    expect('buildReflectionShareText' in hubIo).toBe(false);
    expect('buildReflectionShareTweetUrl' in hubIo).toBe(false);
    expect('buildReflectionShareTelegramUrl' in hubIo).toBe(false);
    expect('buildReflectionShareWhatsAppUrl' in hubIo).toBe(false);

    expect('pauseShiftEmotionFrameHubDone' in shareIo).toBe(false);
    expect('pauseShiftEmotionFrameHubDoneWithRepository' in shareIo).toBe(false);
    expect('buildShiftEmotionFrameHubLogBundle' in shareIo).toBe(false);
    expect('resolveShiftFrameHubDonePresentation' in shareIo).toBe(false);
    // Reciprocal inline pins: `presentation/reflect/share/pause-reflect-share-io-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `presentation/reflect/share/pause-reflect-share-io-parity.test.ts` (shift-frame hub vs share builders).
   * Dedicated sibling file: `pause-reflect-hub-share-io-sibling-parity.test.ts` (application + presentation).
   */
  it('sibling cluster: share-io builders stay distinct from hub-io wrappers', () => {
    expect(pauseShiftEmotionFrameHubDone).not.toBe(pauseReflectionShareImage);
    expect(pauseShiftEmotionFrameHubDoneWithRepository).not.toBe(buildReflectionShareText);
    expect(buildLogBundleFromHubIo).not.toBe(buildReflectionShareTweetUrl);
    expect(resolvePresentationFromHubIo).not.toBe(buildReflectionShareTelegramUrl);
    expect(pauseShiftEmotionFrameHubDone).not.toBe(buildReflectionShareWhatsAppUrl);
    expect(buildLogBundleFromHubIo).not.toBe(pauseReflectionShareImage);
    expect(resolvePresentationFromHubIo).not.toBe(buildReflectionShareText);
    expect(reflectPauseRepository).not.toBe(pauseReflectionShareImage);
    expect(pauseShiftEmotionFrameHubDone).not.toBe(buildReflectionShareText);
    // Reciprocal inline pins: `presentation/reflect/share/pause-reflect-share-io-parity.test.ts`.
    // Full pins: `pause-reflect-hub-share-io-sibling-parity.test.ts`.
  });
});
