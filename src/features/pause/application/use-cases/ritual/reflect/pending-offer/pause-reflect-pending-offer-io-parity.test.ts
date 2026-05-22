/**
 * Application-layer I/O parity for ritual reflect pending-offer cluster (parity with
 * `pause-reflect-hub-io-parity.test.ts`; presentation pins stay colocated beside
 * `pause-reflect-pending-offer-io.ts`).
 * Imports `pause-reflect-pending-offer-flow` CI umbrella for `.toBe` identity pins only —
 * production pending-offer I/O keeps adopt/decline/display leaf imports.
 */
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'supabasePauseRepository' },
}));

vi.mock('@/features/pause/application/use-cases/ritual/reflect/pending-offer/run-adopt-pending-pause-offer', () => ({
  runAdoptPendingPauseOffer: vi.fn(() => Promise.resolve({ status: 'ok' as const, instanceId: 'inst-adopted' })),
}));

vi.mock('@/features/pause/application/use-cases/ritual/reflect/pending-offer/run-decline-pending-pause-offer', () => ({
  runDeclinePendingPauseOffer: vi.fn(() => Promise.resolve({ status: 'ok' as const })),
}));

import { getPendingPauseOfferDisplay as getDisplayDirect } from '@/features/pause/application/use-cases/ritual/reflect/pending-offer/pending-pause-offer-display';
import { runAdoptPendingPauseOffer as runAdoptDirect } from '@/features/pause/application/use-cases/ritual/reflect/pending-offer/run-adopt-pending-pause-offer';
import { runDeclinePendingPauseOffer as runDeclineDirect } from '@/features/pause/application/use-cases/ritual/reflect/pending-offer/run-decline-pending-pause-offer';
import { getPendingPauseOfferDisplay as getDisplayFromDisplayFlow } from '@/features/pause/application/use-cases/ritual/reflect/pending-offer/pause-pending-offer-display-flow';
import {
  getPendingPauseOfferDisplay,
  runAdoptPendingPauseOffer,
  runDeclinePendingPauseOffer,
} from '@/features/pause/application/use-cases/ritual/reflect/pending-offer/pause-reflect-pending-offer-flow';
import * as pendingOfferIo from '@/features/pause/presentation/reflect/pending-offer/pause-reflect-pending-offer-io';
import {
  getPendingPauseOfferDisplay as getDisplayFromPendingOfferIo,
  pauseAdoptPendingOffer,
  pauseAdoptPendingOfferWithRepository,
  pauseDeclinePendingOffer,
  pauseDeclinePendingOfferWithRepository,
  reflectPauseRepository,
} from '@/features/pause/presentation/reflect/pending-offer/pause-reflect-pending-offer-io';
import * as pendingOfferTelemetryIo from '@/features/pause/presentation/reflect/telemetry/pause-reflect-pending-offer-telemetry-io';
import {
  trackPausePendingAdopted as trackAdoptedFromTelemetryIo,
  trackPausePendingDeclined as trackDeclinedFromTelemetryIo,
  trackPauseSessionAbandoned as trackAbandonedFromTelemetryIo,
} from '@/features/pause/presentation/reflect/telemetry/pause-reflect-pending-offer-telemetry-io';
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
  buildShiftEmotionFrameHubLogBundle,
  pauseShiftEmotionFrameHubDone,
  pauseShiftEmotionFrameHubDoneWithRepository,
  resolveShiftFrameHubDonePresentation,
} from '@/features/pause/presentation/reflect/hub/pause-reflect-hub-io';
import {
  buildFeelTilesMoodLogOptions,
  pauseInitialEmotionSelect,
  pauseInitialEmotionSkip,
  pauseInitialEmotionSelectWithRepository,
  pauseInitialEmotionSkipWithRepository,
} from '@/features/pause/presentation/reflect/mood/pause-reflect-mood-io';
import {
  trackPauseReflectPostItOpen,
  trackPauseReflectShareTap,
  trackPauseReflectWallpaperTap,
} from '@/features/pause/presentation/reflect/telemetry/pause-reflect-telemetry-io';
import { supabasePauseRepository } from '@/features/pause/public-rpc';

/**
 * Application mirror: `presentation/reflect/pending-offer/pause-reflect-pending-offer-io-parity.test.ts`.
 * Session telemetry-io sibling: `pause-reflect-pending-offer-session-telemetry-io-sibling-parity.test.ts` (application + presentation);
 * reciprocal inline pins ↔ `application/.../telemetry/pause-reflect-telemetry-io-parity.test.ts`.
 */
describe('pause-reflect-pending-offer-io parity (application)', () => {
  it('presentation I/O pending-offer display matches pending-offer CI umbrella', () => {
    expect(getPendingPauseOfferDisplay).toBe(getDisplayFromPendingOfferIo);
  });

  it('presentation I/O display matches pause-pending-offer-display-flow CI anchor', () => {
    expect(getPendingPauseOfferDisplay).toBe(getDisplayFromDisplayFlow);
    expect(getDisplayFromPendingOfferIo).toBe(getDisplayFromDisplayFlow);
  });

  it('pending-offer CI umbrella composes the same run-* leaf use cases as presentation I/O', () => {
    expect(runAdoptPendingPauseOffer).toBe(runAdoptDirect);
    expect(runDeclinePendingPauseOffer).toBe(runDeclineDirect);
    expect(getPendingPauseOfferDisplay).toBe(getDisplayDirect);
    expect(getDisplayFromPendingOfferIo).toBe(getDisplayDirect);
  });

  it('presentation I/O binds reflectPauseRepository to public-rpc supabasePauseRepository', () => {
    expect(reflectPauseRepository).toBe(supabasePauseRepository);
  });

  it('presentation I/O exports adopt/decline port wrappers distinct from leaf use cases', () => {
    expect(typeof pauseAdoptPendingOfferWithRepository).toBe('function');
    expect(typeof pauseDeclinePendingOfferWithRepository).toBe('function');
    expect(pauseAdoptPendingOffer).not.toBe(runAdoptDirect);
    expect(pauseDeclinePendingOffer).not.toBe(runDeclineDirect);
    expect(pauseAdoptPendingOffer).not.toBe(pauseDeclinePendingOffer);
    expect(pauseAdoptPendingOfferWithRepository).not.toBe(pauseDeclinePendingOfferWithRepository);
    expect(pauseAdoptPendingOfferWithRepository).not.toBe(runAdoptDirect);
    expect(pauseDeclinePendingOfferWithRepository).not.toBe(runDeclineDirect);
  });

  it('pauseAdoptPendingOffer delegates to run-adopt-pending-pause-offer with default repository', async () => {
    await pauseAdoptPendingOffer();

    expect(runAdoptDirect).toHaveBeenCalledWith(supabasePauseRepository);
  });

  it('pauseDeclinePendingOffer delegates to run-decline-pending-pause-offer with default repository', async () => {
    await pauseDeclinePendingOffer();

    expect(runDeclineDirect).toHaveBeenCalledWith(supabasePauseRepository);
  });

  it('pauseAdoptPendingOfferWithRepository forwards injected PauseRepository', async () => {
    const customRepo = { port: 'injected-adopt' } as unknown as typeof supabasePauseRepository;

    await pauseAdoptPendingOfferWithRepository(customRepo);

    expect(runAdoptDirect).toHaveBeenCalledWith(customRepo);
  });

  it('pauseDeclinePendingOfferWithRepository forwards injected PauseRepository', async () => {
    const customRepo = { port: 'injected-decline' } as unknown as typeof supabasePauseRepository;

    await pauseDeclinePendingOfferWithRepository(customRepo);

    expect(runDeclineDirect).toHaveBeenCalledWith(customRepo);
  });

  it('presentation pending-offer-io stays off pending-offer-telemetry-io exports', () => {
    expect('trackPausePendingAdopted' in pendingOfferIo).toBe(false);
    expect('trackPausePendingDeclined' in pendingOfferIo).toBe(false);
    expect('trackPauseSessionAbandoned' in pendingOfferIo).toBe(false);
    expect('pauseAdoptPendingOffer' in pendingOfferTelemetryIo).toBe(false);
    expect('pauseDeclinePendingOffer' in pendingOfferTelemetryIo).toBe(false);
    expect('getPendingPauseOfferDisplay' in pendingOfferTelemetryIo).toBe(false);
    expect('reflectPauseRepository' in pendingOfferTelemetryIo).toBe(false);
  });

  it('pending-offer-io RPC wrappers stay distinct from pending-offer-telemetry-io trackers', () => {
    expect(pauseAdoptPendingOffer).not.toBe(trackAdoptedFromTelemetryIo);
    expect(pauseDeclinePendingOffer).not.toBe(trackDeclinedFromTelemetryIo);
    expect(pauseAdoptPendingOfferWithRepository).not.toBe(trackAbandonedFromTelemetryIo);
    expect(pauseDeclinePendingOfferWithRepository).not.toBe(trackAdoptedFromTelemetryIo);
    expect(getPendingPauseOfferDisplay).not.toBe(trackDeclinedFromTelemetryIo);
    expect(reflectPauseRepository).not.toBe(trackAbandonedFromTelemetryIo);
  });

  it('sibling cluster: flows-io exports stay distinct from pending-offer-io', () => {
    expect(pauseAdoptPendingOffer).not.toBe(resolvePauseSessionReflectAndDecidePreflight);
    expect(pauseDeclinePendingOffer).not.toBe(resolvePauseSessionReflectAndDecideAfterGeneration);
    expect(getPendingPauseOfferDisplay).not.toBe(pauseReflectOutcomeLog);
    expect(pauseAdoptPendingOfferWithRepository).not.toBe(pauseReflectOutcomeLogWithRepository);
    expect(pauseDeclinePendingOffer).not.toBe(buildPauseScoreImpacts);
    expect(pauseDeclinePendingOfferWithRepository).not.toBe(resolvePauseDecideOutcomeFlow);
    expect(getPendingPauseOfferDisplay).not.toBe(formatReinforcementQuoteFromSession);
    expect(getPendingPauseOfferDisplay).not.toBe(getSessionQuote);
    expect(pauseAdoptPendingOfferWithRepository).not.toBe(showPauseOutcomeSaveFailedToast);
    expect(pauseDeclinePendingOffer).not.toBe(showPauseOutcomeNotCompletedToast);
  });

  it('sibling cluster: steps-io exports stay distinct from pending-offer-io', () => {
    expect(pauseAdoptPendingOffer).not.toBe(pauseReflectFavoriteToggle);
    expect(pauseDeclinePendingOffer).not.toBe(pauseReflectNoteUpdate);
    expect(pauseAdoptPendingOfferWithRepository).not.toBe(pauseReflectTagUpdateWithRepository);
    expect(pauseDeclinePendingOfferWithRepository).not.toBe(pauseReflectFavoriteToggleWithRepository);
    expect(getPendingPauseOfferDisplay).not.toBe(pauseReflectionStepLogOnce);
    expect(pauseAdoptPendingOffer).not.toBe(shouldShowFavoriteProHint);
    expect(pauseDeclinePendingOffer).not.toBe(shouldLogPauseReflectionStep);
    expect(pauseAdoptPendingOffer).not.toBe(pauseReflectionStepLogOnceWithRepository);
  });

  it('sibling cluster: hub-io shift-frame exports stay distinct from pending-offer-io', () => {
    expect(pauseAdoptPendingOffer).not.toBe(pauseShiftEmotionFrameHubDone);
    expect(pauseDeclinePendingOffer).not.toBe(pauseShiftEmotionFrameHubDoneWithRepository);
    expect(pauseAdoptPendingOfferWithRepository).not.toBe(pauseShiftEmotionFrameHubDone);
    expect(pauseDeclinePendingOfferWithRepository).not.toBe(buildShiftEmotionFrameHubLogBundle);
    expect(getPendingPauseOfferDisplay).not.toBe(resolveShiftFrameHubDonePresentation);
    expect(pauseAdoptPendingOffer).not.toBe(buildShiftEmotionFrameHubLogBundle);
  });

  it('sibling cluster: mood-io initial-emotion exports stay distinct from pending-offer-io', () => {
    expect(pauseAdoptPendingOffer).not.toBe(pauseInitialEmotionSelect);
    expect(pauseDeclinePendingOffer).not.toBe(pauseInitialEmotionSkip);
    expect(pauseAdoptPendingOfferWithRepository).not.toBe(pauseInitialEmotionSelectWithRepository);
    expect(pauseDeclinePendingOfferWithRepository).not.toBe(pauseInitialEmotionSkipWithRepository);
    expect(getPendingPauseOfferDisplay).not.toBe(buildFeelTilesMoodLogOptions);
    expect(pauseAdoptPendingOffer).not.toBe(buildFeelTilesMoodLogOptions);
  });

  it('sibling cluster: share-io exports stay distinct from pending-offer-io', () => {
    expect(pauseAdoptPendingOffer).not.toBe(pauseReflectionShareImage);
    expect(pauseDeclinePendingOffer).not.toBe(buildReflectionShareText);
    expect(pauseAdoptPendingOfferWithRepository).not.toBe(buildReflectionShareTweetUrl);
    expect(pauseDeclinePendingOfferWithRepository).not.toBe(buildReflectionShareWhatsAppUrl);
    expect(getPendingPauseOfferDisplay).not.toBe(buildReflectionShareTelegramUrl);
    expect(reflectPauseRepository).not.toBe(pauseReflectionShareImage);
  });

  it('sibling cluster: ambience-io frame-focus bed exports stay distinct from pending-offer-io', () => {
    expect(pauseAdoptPendingOffer).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(pauseDeclinePendingOffer).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(pauseAdoptPendingOfferWithRepository).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(pauseDeclinePendingOfferWithRepository).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(getPendingPauseOfferDisplay).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(reflectPauseRepository).not.toBe(stopPauseReflectFrameFocusAmbience);
  });

  /**
   * Reciprocal inline pins ↔ `application/.../telemetry/pause-reflect-telemetry-io-parity.test.ts`.
   * Dedicated sibling file: `pause-reflect-pending-offer-session-telemetry-io-sibling-parity.test.ts`
   * (application + presentation).
   */
  it('sibling cluster: session reflect telemetry-io exports stay distinct from pending-offer-io', () => {
    expect(pauseAdoptPendingOffer).not.toBe(trackPauseReflectPostItOpen);
    expect(pauseDeclinePendingOffer).not.toBe(trackPauseReflectShareTap);
    expect(getPendingPauseOfferDisplay).not.toBe(trackPauseReflectWallpaperTap);
    expect(pauseAdoptPendingOfferWithRepository).not.toBe(trackPauseReflectPostItOpen);
    expect(pauseDeclinePendingOfferWithRepository).not.toBe(trackPauseReflectShareTap);
    expect(reflectPauseRepository).not.toBe(trackPauseReflectWallpaperTap);
  });
});
