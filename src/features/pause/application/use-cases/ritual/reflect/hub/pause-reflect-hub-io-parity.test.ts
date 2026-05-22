/**
 * Application-layer I/O parity for ritual reflect hub cluster (parity with
 * `pause-reflect-flows-io-parity.test.ts`; presentation pins stay colocated beside
 * `pause-reflect-hub-io.ts`).
 * Imports `pause-reflect-hub-flow` CI umbrella for `.toBe` identity pins only —
 * production hub I/O keeps domain + `run-shift-emotion-frame-hub-done` leaf imports.
 * Presentation mirror: `presentation/reflect/hub/pause-reflect-hub-io-parity.test.ts`.
 * Steps-io sibling: `pause-reflect-steps-hub-io-sibling-parity.test.ts` (application + presentation);
 * reciprocal inline pins ↔ `pause-reflect-steps-io-parity.test.ts`.
 * Flows-io sibling: `pause-reflect-flows-hub-io-sibling-parity.test.ts` (application + presentation);
 * reciprocal inline pins ↔ `pause-reflect-flows-io-parity.test.ts`.
 * Generation-io sibling: `pause-reflect-generation-hub-io-sibling-parity.test.ts` (application + presentation);
 * reciprocal inline pins ↔ `pause-reflect-generation-io-parity.test.ts`.
 * Ambience-io sibling: `pause-reflect-ambience-hub-io-sibling-parity.test.ts` (application + presentation);
 * reciprocal inline pins ↔ `pause-reflect-ambience-io-parity.test.ts`.
 * Telemetry-io sibling: `pause-reflect-hub-telemetry-io-sibling-parity.test.ts` (application + presentation);
 * reciprocal inline pins ↔ `pause-reflect-telemetry-io-parity.test.ts`.
 */
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'supabasePauseRepository' },
  supabaseReflectGenerator: { port: 'supabaseReflectGenerator' },
}));

vi.mock(
  '@/features/pause/application/use-cases/ritual/reflect/hub/run-shift-emotion-frame-hub-done',
  () => ({
    runShiftEmotionFrameHubDone: vi.fn(() =>
      Promise.resolve({ status: 'advance' as const, logKey: 'k' }),
    ),
  }),
);

import { runShiftEmotionFrameHubDone as runShiftHubDoneDirect } from '@/features/pause/application/use-cases/ritual/reflect/hub/run-shift-emotion-frame-hub-done';
import { buildShiftEmotionFrameHubLogBundle as buildLogBundleDirect } from '@/features/pause/domain/reflect/hub/shift-emotion-log';
import {
  resolveShiftFrameHubDonePresentation as resolvePresentationDirect,
} from '@/features/pause/domain/reflect/hub/shift-frame-hub-done-presentation';
import {
  buildShiftEmotionFrameHubLogBundle,
  resolveShiftFrameHubDonePresentation,
  runShiftEmotionFrameHubDone as runShiftHubDoneFromFlow,
} from '@/features/pause/application/use-cases/ritual/reflect/hub/pause-reflect-hub-flow';
import {
  buildShiftEmotionFrameHubLogBundle as buildLogBundleFromHubIo,
  pauseShiftEmotionFrameHubDone,
  pauseShiftEmotionFrameHubDoneWithRepository,
  reflectPauseRepository,
  resolveShiftFrameHubDonePresentation as resolvePresentationFromHubIo,
} from '@/features/pause/presentation/reflect/hub/pause-reflect-hub-io';
import {
  messageFromReflectGenerationResult,
  pauseReflectGeneration,
  reflectGenerationPrerequisite,
  reflectGenerator,
  runReflectGeneration,
  shouldCommitReflectGeneration,
} from '@/features/pause/presentation/reflect/generation/pause-reflect-generation-io';
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
  trackPauseReflectPostItOpen,
  trackPauseReflectShareTap,
  trackPauseReflectWallpaperTap,
} from '@/features/pause/presentation/reflect/telemetry/pause-reflect-telemetry-io';
import { supabasePauseRepository } from '@/features/pause/public-rpc';

describe('pause-reflect-hub-io parity (application)', () => {
  it('presentation I/O hub exports match pause-reflect-hub-flow CI umbrella', () => {
    expect(buildShiftEmotionFrameHubLogBundle).toBe(buildLogBundleFromHubIo);
    expect(resolveShiftFrameHubDonePresentation).toBe(resolvePresentationFromHubIo);
    expect(runShiftHubDoneFromFlow).toBe(runShiftHubDoneDirect);
  });

  it('presentation I/O binds reflectPauseRepository to public-rpc supabasePauseRepository', () => {
    expect(reflectPauseRepository).toBe(supabasePauseRepository);
  });

  it('hub CI umbrella composes the same domain + run-shift-emotion-frame-hub-done leaf as presentation I/O', () => {
    expect(buildShiftEmotionFrameHubLogBundle).toBe(buildLogBundleDirect);
    expect(resolveShiftFrameHubDonePresentation).toBe(resolvePresentationDirect);
    expect(runShiftHubDoneFromFlow).toBe(runShiftHubDoneDirect);
    expect(buildLogBundleFromHubIo).toBe(buildLogBundleDirect);
    expect(resolvePresentationFromHubIo).toBe(resolvePresentationDirect);
  });

  it('presentation I/O exports hub RPC wrapper distinct from leaf use case', () => {
    expect(typeof pauseShiftEmotionFrameHubDone).toBe('function');
    expect(typeof pauseShiftEmotionFrameHubDoneWithRepository).toBe('function');
    expect(pauseShiftEmotionFrameHubDone).not.toBe(runShiftHubDoneDirect);
  });

  it('pauseShiftEmotionFrameHubDone delegates to run-shift-emotion-frame-hub-done with default repository', async () => {
    const input = { pauseInstanceId: 'inst-hub-app', lastShiftLogKey: null };

    await pauseShiftEmotionFrameHubDone(input);

    expect(runShiftHubDoneDirect).toHaveBeenCalledWith(supabasePauseRepository, input);
  });

  it('pauseShiftEmotionFrameHubDoneWithRepository delegates with injected repository', async () => {
    const customRepository = { port: 'customPauseRepository' };
    const input = { pauseInstanceId: 'inst-hub-app-custom', lastShiftLogKey: 'key-1' };

    await pauseShiftEmotionFrameHubDoneWithRepository(
      customRepository as unknown as typeof supabasePauseRepository,
      input,
    );

    expect(runShiftHubDoneDirect).toHaveBeenCalledWith(customRepository, input);
  });

  /**
   * Reciprocal inline pins ↔ `presentation/reflect/generation/pause-reflect-generation-io-parity.test.ts`.
   * Dedicated sibling file: `pause-reflect-generation-hub-io-sibling-parity.test.ts` (application + presentation).
   */
  it('sibling cluster: generation-io holzen-reflect exports stay distinct from hub-io wrappers', () => {
    expect(pauseShiftEmotionFrameHubDone).not.toBe(runReflectGeneration);
    expect(pauseShiftEmotionFrameHubDoneWithRepository).not.toBe(pauseReflectGeneration);
    expect(buildLogBundleFromHubIo).not.toBe(reflectGenerationPrerequisite);
    expect(resolvePresentationFromHubIo).not.toBe(shouldCommitReflectGeneration);
    expect(reflectPauseRepository).not.toBe(reflectGenerator);
    expect(pauseShiftEmotionFrameHubDone).not.toBe(messageFromReflectGenerationResult);
    // Reciprocal inline pins: `presentation/reflect/generation/pause-reflect-generation-io-parity.test.ts`.
    // Full pins: `pause-reflect-generation-hub-io-sibling-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-steps-io-parity.test.ts` (application + presentation).
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
    // Reciprocal inline pins: `pause-reflect-steps-io-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-flows-io-parity.test.ts` (application + presentation).
   * Dedicated sibling file: `pause-reflect-flows-hub-io-sibling-parity.test.ts`.
   */
  it('sibling cluster: flows-io reflect+decide exports stay distinct from hub-io wrappers', () => {
    expect(pauseShiftEmotionFrameHubDone).not.toBe(resolvePauseSessionReflectAndDecidePreflight);
    expect(pauseShiftEmotionFrameHubDone).not.toBe(pauseReflectOutcomeLog);
    expect(pauseShiftEmotionFrameHubDoneWithRepository).not.toBe(pauseReflectOutcomeLogWithRepository);
    expect(buildShiftEmotionFrameHubLogBundle).not.toBe(formatReinforcementQuoteFromSession);
    expect(resolveShiftFrameHubDonePresentation).not.toBe(resolvePauseDecideOutcomeFlow);
    expect(pauseShiftEmotionFrameHubDone).not.toBe(showPauseOutcomeNotCompletedToast);
    expect(buildShiftEmotionFrameHubLogBundle).not.toBe(getSessionQuote);
    expect(pauseShiftEmotionFrameHubDone).not.toBe(buildPauseScoreImpacts);
    expect(pauseShiftEmotionFrameHubDoneWithRepository).not.toBe(showPauseOutcomeSaveFailedToast);
    expect(pauseShiftEmotionFrameHubDone).not.toBe(resolvePauseSessionReflectAndDecideAfterGeneration);
    // Reciprocal inline pins: `pause-reflect-flows-io-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `presentation/reflect/pending-offer/pause-reflect-pending-offer-io-parity.test.ts`.
   * Dedicated sibling file: `pause-reflect-hub-pending-offer-io-sibling-parity.test.ts` (application + presentation).
   */
  it('sibling cluster: pending-offer-io exports stay distinct from hub-io wrappers', () => {
    expect(pauseShiftEmotionFrameHubDone).not.toBe(pauseAdoptPendingOffer);
    expect(pauseShiftEmotionFrameHubDone).not.toBe(pauseDeclinePendingOffer);
    expect(pauseShiftEmotionFrameHubDoneWithRepository).not.toBe(pauseAdoptPendingOfferWithRepository);
    expect(pauseShiftEmotionFrameHubDoneWithRepository).not.toBe(pauseDeclinePendingOfferWithRepository);
    expect(buildLogBundleFromHubIo).not.toBe(getPendingPauseOfferDisplay);
    expect(resolvePresentationFromHubIo).not.toBe(getPendingPauseOfferDisplay);
    // Reciprocal inline pins: `presentation/reflect/pending-offer/pause-reflect-pending-offer-io-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-ambience-io-parity.test.ts` (application + presentation).
   * Dedicated sibling file: `pause-reflect-ambience-hub-io-sibling-parity.test.ts`.
   */
  it('sibling cluster: ambience-io frame-focus bed exports stay distinct from hub-io wrappers', () => {
    expect(pauseShiftEmotionFrameHubDone).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(pauseShiftEmotionFrameHubDone).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(pauseShiftEmotionFrameHubDoneWithRepository).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(buildLogBundleFromHubIo).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(reflectPauseRepository).not.toBe(startPauseReflectFrameFocusAmbience);
    // Reciprocal inline pins: `pause-reflect-ambience-io-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-telemetry-io-parity.test.ts` (application + presentation).
   * Dedicated sibling file: `pause-reflect-hub-telemetry-io-sibling-parity.test.ts`.
   */
  it('sibling cluster: session reflect telemetry-io exports stay distinct from hub-io wrappers', () => {
    expect(pauseShiftEmotionFrameHubDone).not.toBe(trackPauseReflectPostItOpen);
    expect(pauseShiftEmotionFrameHubDoneWithRepository).not.toBe(trackPauseReflectShareTap);
    expect(buildLogBundleFromHubIo).not.toBe(trackPauseReflectWallpaperTap);
    expect(resolvePresentationFromHubIo).not.toBe(trackPauseReflectPostItOpen);
    expect(reflectPauseRepository).not.toBe(trackPauseReflectShareTap);
    expect(pauseShiftEmotionFrameHubDone).not.toBe(trackPauseReflectWallpaperTap);
    // Reciprocal inline pins: `pause-reflect-telemetry-io-parity.test.ts`.
  });
});
