import { describe, expect, it, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {},
}));

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectPauseRepository' },
  supabaseReflectGenerator: { port: 'reflectGenerator' },
}));

vi.mock('@/features/pause/application/use-cases/ritual/decide/run-pause-outcome-log', () => ({
  runPauseOutcomeLog: vi.fn(() => Promise.resolve({ status: 'no_instance' as const })),
}));

import {
  formatReinforcementQuoteFromSession as formatQuoteDirect,
  resolvePauseDecideOutcomeFlow as resolveOutcomeDirect,
} from '@/features/pause/domain/decide/pause-decide-outcome-flow';
import {
  resolvePauseSessionReflectAndDecideAfterGeneration as resolveAfterGenDirect,
  resolvePauseSessionReflectAndDecidePreflight as resolvePreflightDirect,
} from '@/features/pause/domain/reflect/flows/pause-session-reflect-and-decide-flow';
import {
  buildPauseScoreImpacts as buildImpactsDirect,
  parseScoreImpactVolatilityPct as parseVolatilityDirect,
} from '@/features/pause/application/use-cases/ritual/decide/score-impacts';
import {
  resolveScoreImpactDisplayImpacts as resolveDisplayImpactsDirect,
  resolveScoreImpactViewMode as resolveViewModeDirect,
  scoreImpactMotionDelaySec as motionDelayDirect,
} from '@/features/pause/application/use-cases/ritual/decide/score-impact-presentation';
import {
  showPauseOutcomeNotCompletedToast as showNotCompletedDirect,
  showPauseOutcomeSaveFailedToast as showSaveFailedDirect,
} from '@/features/pause/application/use-cases/ritual/decide/outcome-toast';
import { runPauseOutcomeLog as runOutcomeLogDirect } from '@/features/pause/application/use-cases/ritual/decide/run-pause-outcome-log';
import { getSessionQuote as getQuoteDirect } from '@/features/pause/application/use-cases/ritual/decide/wisdom-quotes';
import {
  buildPauseScoreImpacts,
  formatReinforcementQuoteFromSession,
  getSessionQuote,
  parseScoreImpactVolatilityPct,
  resolvePauseDecideOutcomeFlow,
  resolvePauseSessionReflectAndDecideAfterGeneration,
  resolvePauseSessionReflectAndDecidePreflight,
  resolveScoreImpactDisplayImpacts,
  resolveScoreImpactViewMode,
  runPauseOutcomeLog,
  scoreImpactMotionDelaySec,
  showPauseOutcomeNotCompletedToast,
  showPauseOutcomeSaveFailedToast,
} from '@/features/pause/application/use-cases/ritual/reflect/flows/pause-reflect-flows-flow';
import {
  buildPauseScoreImpacts as buildImpactsFromFlowsIo,
  formatReinforcementQuoteFromSession as formatQuoteFromFlowsIo,
  getSessionQuote as getQuoteFromFlowsIo,
  parseScoreImpactVolatilityPct as parseVolatilityFromFlowsIo,
  pauseReflectOutcomeLog,
  pauseReflectOutcomeLogWithRepository,
  reflectPauseRepository,
  resolvePauseDecideOutcomeFlow as resolveOutcomeFromFlowsIo,
  resolvePauseSessionReflectAndDecideAfterGeneration as resolveAfterGenFromFlowsIo,
  resolvePauseSessionReflectAndDecidePreflight as resolvePreflightFromFlowsIo,
  resolveScoreImpactDisplayImpacts as resolveDisplayImpactsFromFlowsIo,
  resolveScoreImpactViewMode as resolveViewModeFromFlowsIo,
  scoreImpactMotionDelaySec as motionDelayFromFlowsIo,
  showPauseOutcomeNotCompletedToast as showNotCompletedFromFlowsIo,
  showPauseOutcomeSaveFailedToast as showSaveFailedFromFlowsIo,
} from './pause-reflect-flows-io';
import {
  buildPauseSessionStepRitualBundle,
  buildPauseSessionStepShellBundle,
} from '@/features/pause/presentation/session/pause-session-step-handlers-io';
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
  resolvePauseSessionChromeCloseAction,
} from '@/features/pause/presentation/reflect/mood/pause-reflect-mood-io';
import {
  pauseReflectFavoriteToggle,
  pauseReflectNoteUpdate,
  pauseReflectTagUpdate,
  pauseReflectionStepLogOnce,
  shouldLogPauseReflectionStep,
  shouldShowFavoriteProHint,
} from '@/features/pause/presentation/reflect/steps/pause-reflect-steps-io';
import {
  trackPauseReflectPostItOpen,
  trackPauseReflectShareTap,
  trackPauseReflectWallpaperTap,
} from '@/features/pause/presentation/reflect/telemetry/pause-reflect-telemetry-io';
import {
  initialDecisionFromRestored,
  initialPhaseFromRestored,
} from '@/features/pause/application/use-cases/session/pause-session-decide-flow';
import {
  startPauseReflectFrameFocusAmbience,
  stopPauseReflectFrameFocusAmbience,
} from '@/features/pause/presentation/reflect/ambience/pause-reflect-ambience-io';
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
  getPendingPauseOfferDisplay,
  pauseAdoptPendingOffer,
  pauseAdoptPendingOfferWithRepository,
  pauseDeclinePendingOffer,
  pauseDeclinePendingOfferWithRepository,
} from '@/features/pause/presentation/reflect/pending-offer/pause-reflect-pending-offer-io';
import {
  buildReflectionShareTelegramUrl,
  buildReflectionShareText,
  buildReflectionShareTweetUrl,
  buildReflectionShareWhatsAppUrl,
  pauseReflectionShareImage,
} from '@/features/pause/presentation/reflect/share/pause-reflect-share-io';

import { supabasePauseRepository } from '@/features/pause/public-rpc';

/**
 * Presentation reflect+decide flows I/O parity (colocated beside `pause-reflect-flows-io.ts`).
 * Flows CI umbrella: `pause-reflect-flows-flow` (application). Sibling pins under
 * `application/.../ritual/reflect/flows/*-sibling-parity.test.ts` and this folder.
 * Reciprocal inline pins ↔ cluster `pause-reflect-*-io-parity.test.ts` files in other reflect subclusters.
 */
describe('pause-reflect-flows-io parity', () => {
  it('presentation I/O reflect+decide exports match flows CI umbrella', () => {
    expect(resolvePauseSessionReflectAndDecidePreflight).toBe(resolvePreflightFromFlowsIo);
    expect(resolvePauseSessionReflectAndDecideAfterGeneration).toBe(resolveAfterGenFromFlowsIo);
    expect(formatReinforcementQuoteFromSession).toBe(formatQuoteFromFlowsIo);
    expect(resolvePauseDecideOutcomeFlow).toBe(resolveOutcomeFromFlowsIo);
    expect(getSessionQuote).toBe(getQuoteFromFlowsIo);
    expect(buildPauseScoreImpacts).toBe(buildImpactsFromFlowsIo);
    expect(parseScoreImpactVolatilityPct).toBe(parseVolatilityFromFlowsIo);
    expect(resolveScoreImpactDisplayImpacts).toBe(resolveDisplayImpactsFromFlowsIo);
    expect(resolveScoreImpactViewMode).toBe(resolveViewModeFromFlowsIo);
    expect(scoreImpactMotionDelaySec).toBe(motionDelayFromFlowsIo);
    expect(showPauseOutcomeNotCompletedToast).toBe(showNotCompletedFromFlowsIo);
    expect(showPauseOutcomeSaveFailedToast).toBe(showSaveFailedFromFlowsIo);
    expect(runPauseOutcomeLog).toBe(runOutcomeLogDirect);
  });

  it('flows CI umbrella composes the same domain + ritual/decide leaf modules as presentation I/O', () => {
    expect(resolvePauseSessionReflectAndDecidePreflight).toBe(resolvePreflightDirect);
    expect(resolvePauseSessionReflectAndDecideAfterGeneration).toBe(resolveAfterGenDirect);
    expect(formatReinforcementQuoteFromSession).toBe(formatQuoteDirect);
    expect(resolvePauseDecideOutcomeFlow).toBe(resolveOutcomeDirect);
    expect(getSessionQuote).toBe(getQuoteDirect);
    expect(buildPauseScoreImpacts).toBe(buildImpactsDirect);
    expect(parseScoreImpactVolatilityPct).toBe(parseVolatilityDirect);
    expect(resolveScoreImpactDisplayImpacts).toBe(resolveDisplayImpactsDirect);
    expect(resolveScoreImpactViewMode).toBe(resolveViewModeDirect);
    expect(scoreImpactMotionDelaySec).toBe(motionDelayDirect);
    expect(showPauseOutcomeNotCompletedToast).toBe(showNotCompletedDirect);
    expect(showPauseOutcomeSaveFailedToast).toBe(showSaveFailedDirect);
    expect(runPauseOutcomeLog).toBe(runOutcomeLogDirect);
  });

  it('presentation I/O binds reflectPauseRepository to public-rpc supabasePauseRepository', () => {
    expect(reflectPauseRepository).toBe(supabasePauseRepository);
  });

  it('presentation I/O delegates decide outcome RPC to ritual/decide leaf with default repository', async () => {
    const input = { pauseInstanceId: 'inst-1', decision: 'held' };

    await pauseReflectOutcomeLog(input);

    expect(runPauseOutcomeLog).toHaveBeenCalledWith(supabasePauseRepository, input);
  });

  it('pauseReflectOutcomeLogWithRepository forwards injected PauseRepository', async () => {
    const customRepo = { port: 'injected' } as unknown as typeof supabasePauseRepository;
    const input = { pauseInstanceId: 'inst-2', decision: 'sold' };

    await pauseReflectOutcomeLogWithRepository(customRepo, input);

    expect(runPauseOutcomeLog).toHaveBeenCalledWith(customRepo, input);
  });

  it('presentation I/O exports outcome RPC wrappers distinct from run-pause-outcome-log leaf', () => {
    expect(typeof pauseReflectOutcomeLog).toBe('function');
    expect(typeof pauseReflectOutcomeLogWithRepository).toBe('function');
    expect(pauseReflectOutcomeLog).not.toBe(runOutcomeLogDirect);
    expect(pauseReflectOutcomeLogWithRepository).not.toBe(runOutcomeLogDirect);
    expect(pauseReflectOutcomeLog).not.toBe(runPauseOutcomeLog);
    expect(pauseReflectOutcomeLogWithRepository).not.toBe(runPauseOutcomeLog);
    expect(pauseReflectOutcomeLog).not.toBe(pauseReflectOutcomeLogWithRepository);
  });

  /**
   * Reciprocal inline pins ↔ `presentation/reflect/hub/pause-reflect-hub-io-parity.test.ts` (reflect+decide vs shift-frame hub).
   * Dedicated sibling file: `pause-reflect-flows-hub-io-sibling-parity.test.ts` (application + presentation).
   */
  it('sibling cluster: hub-io shift-frame exports stay distinct from flows-io', () => {
    expect(pauseReflectOutcomeLog).not.toBe(pauseShiftEmotionFrameHubDone);
    expect(pauseReflectOutcomeLogWithRepository).not.toBe(pauseShiftEmotionFrameHubDoneWithRepository);
    expect(resolvePauseSessionReflectAndDecidePreflight).not.toBe(pauseShiftEmotionFrameHubDone);
    expect(resolvePauseSessionReflectAndDecideAfterGeneration).not.toBe(pauseShiftEmotionFrameHubDone);
    expect(formatReinforcementQuoteFromSession).not.toBe(buildShiftEmotionFrameHubLogBundle);
    expect(resolvePauseDecideOutcomeFlow).not.toBe(resolveShiftFrameHubDonePresentation);
    expect(buildPauseScoreImpacts).not.toBe(buildShiftEmotionFrameHubLogBundle);
    // Full pins: `pause-reflect-flows-hub-io-sibling-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-steps-io-parity.test.ts` (reflect+decide vs step RPC wrappers).
   * Dedicated sibling file: `pause-reflect-flows-steps-io-sibling-parity.test.ts` (application + presentation).
   */
  it('sibling cluster: steps-io exports stay distinct from flows-io', () => {
    expect(pauseReflectOutcomeLog).not.toBe(pauseReflectFavoriteToggle);
    expect(pauseReflectOutcomeLogWithRepository).not.toBe(pauseReflectNoteUpdate);
    expect(resolvePauseSessionReflectAndDecidePreflight).not.toBe(pauseReflectTagUpdate);
    expect(resolvePauseSessionReflectAndDecideAfterGeneration).not.toBe(pauseReflectionStepLogOnce);
    expect(formatReinforcementQuoteFromSession).not.toBe(pauseReflectNoteUpdate);
    expect(resolvePauseDecideOutcomeFlow).not.toBe(pauseReflectTagUpdate);
    expect(buildPauseScoreImpacts).not.toBe(pauseReflectFavoriteToggle);
    expect(getSessionQuote).not.toBe(pauseReflectTagUpdate);
    expect(pauseReflectOutcomeLog).not.toBe(shouldLogPauseReflectionStep);
    expect(pauseReflectOutcomeLogWithRepository).not.toBe(shouldShowFavoriteProHint);
    expect(pauseReflectNoteUpdate).not.toBe(pauseReflectTagUpdate);
    // Reciprocal inline pins: `application/.../steps/pause-reflect-steps-io-parity.test.ts`.
    // Full pins: `pause-reflect-flows-steps-io-sibling-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `pause-session-decide-io-parity.test.ts` (reflect+decide vs restored decide hydration).
   * Dedicated sibling file: `pause-reflect-flows-decide-io-sibling-parity.test.ts` (application + presentation).
   */
  it('sibling cluster: session decide-io hydration stays distinct from flows-io', () => {
    expect(pauseReflectOutcomeLog).not.toBe(initialDecisionFromRestored);
    expect(pauseReflectOutcomeLogWithRepository).not.toBe(initialPhaseFromRestored);
    expect(resolvePauseSessionReflectAndDecidePreflight).not.toBe(initialDecisionFromRestored);
    expect(resolvePauseSessionReflectAndDecideAfterGeneration).not.toBe(initialPhaseFromRestored);
    expect(formatReinforcementQuoteFromSession).not.toBe(initialDecisionFromRestored);
    expect(resolvePauseDecideOutcomeFlow).not.toBe(initialPhaseFromRestored);
    expect(buildPauseScoreImpacts).not.toBe(initialDecisionFromRestored);
    expect(getSessionQuote).not.toBe(initialPhaseFromRestored);
    // Reciprocal inline pins: `application/.../session/pause-session-decide-io-parity.test.ts`.
    // Full pins: `pause-reflect-flows-decide-io-sibling-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-generation-io-parity.test.ts` (reflect+decide vs holzen-reflect).
   * Dedicated sibling file: `pause-reflect-flows-generation-io-sibling-parity.test.ts` (application + presentation).
   */
  it('sibling cluster: generation-io exports stay distinct from flows-io', () => {
    expect(pauseReflectOutcomeLog).not.toBe(runReflectGeneration);
    expect(resolvePauseSessionReflectAndDecidePreflight).not.toBe(pauseReflectGeneration);
    expect(formatReinforcementQuoteFromSession).not.toBe(reflectGenerationPrerequisite);
    expect(resolvePauseDecideOutcomeFlow).not.toBe(resolveReflectGenerationPrefetch);
    expect(buildPauseScoreImpacts).not.toBe(shouldCommitReflectGeneration);
    expect(pauseReflectOutcomeLogWithRepository).not.toBe(pauseReflectGeneration);
    expect(reflectPauseRepository).not.toBe(reflectGenerator);
    // Reciprocal inline pins: `pause-reflect-generation-io-parity.test.ts`.
    // Full pins: `pause-reflect-flows-generation-io-sibling-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `presentation/reflect/ambience/pause-reflect-ambience-io-parity.test.ts` (reflect+decide vs frame-focus bed).
   * Dedicated sibling file: `pause-reflect-flows-ambience-io-sibling-parity.test.ts` (application + presentation).
   */
  it('sibling cluster: ambience-io exports stay distinct from flows-io', () => {
    expect(pauseReflectOutcomeLog).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(resolvePauseSessionReflectAndDecidePreflight).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(formatReinforcementQuoteFromSession).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(resolvePauseDecideOutcomeFlow).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(buildPauseScoreImpacts).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(pauseReflectOutcomeLogWithRepository).not.toBe(stopPauseReflectFrameFocusAmbience);
    // Reciprocal inline pins: `presentation/reflect/ambience/pause-reflect-ambience-io-parity.test.ts`.
    // Full pins: `pause-reflect-flows-ambience-io-sibling-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `presentation/reflect/mood/pause-reflect-mood-io-parity.test.ts` (reflect+decide vs initial-emotion mood).
   * Dedicated sibling file: `pause-reflect-flows-mood-io-sibling-parity.test.ts` (application + presentation).
   */
  it('sibling cluster: mood-io exports stay distinct from flows-io', () => {
    expect(pauseReflectOutcomeLog).not.toBe(pauseInitialEmotionSelect);
    expect(pauseReflectOutcomeLogWithRepository).not.toBe(pauseInitialEmotionSkip);
    expect(resolvePauseSessionReflectAndDecidePreflight).not.toBe(pauseInitialEmotionSelectWithRepository);
    expect(resolvePauseSessionReflectAndDecideAfterGeneration).not.toBe(pauseInitialEmotionSkipWithRepository);
    expect(formatReinforcementQuoteFromSession).not.toBe(buildFeelTilesMoodLogOptions);
    expect(resolvePauseDecideOutcomeFlow).not.toBe(resolvePauseSessionChromeCloseAction);
    expect(buildPauseScoreImpacts).not.toBe(pauseInitialEmotionSelect);
    expect(getSessionQuote).not.toBe(pauseInitialEmotionSkip);
    expect(showPauseOutcomeNotCompletedToast).not.toBe(buildFeelTilesMoodLogOptions);
    expect(showPauseOutcomeSaveFailedToast).not.toBe(resolvePauseSessionChromeCloseAction);
    // Reciprocal inline pins: `presentation/reflect/mood/pause-reflect-mood-io-parity.test.ts`.
    // Full pins: `pause-reflect-flows-mood-io-sibling-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-telemetry-io-parity.test.ts` (reflect+decide vs session UI telemetry).
   * Dedicated sibling file: `pause-reflect-flows-telemetry-io-sibling-parity.test.ts` (application + presentation).
   */
  it('sibling cluster: telemetry-io exports stay distinct from flows-io', () => {
    expect(pauseReflectOutcomeLog).not.toBe(trackPauseReflectPostItOpen);
    expect(pauseReflectOutcomeLogWithRepository).not.toBe(trackPauseReflectShareTap);
    expect(resolvePauseSessionReflectAndDecidePreflight).not.toBe(trackPauseReflectWallpaperTap);
    expect(resolvePauseSessionReflectAndDecideAfterGeneration).not.toBe(trackPauseReflectPostItOpen);
    expect(formatReinforcementQuoteFromSession).not.toBe(trackPauseReflectShareTap);
    expect(resolvePauseDecideOutcomeFlow).not.toBe(trackPauseReflectWallpaperTap);
    expect(getSessionQuote).not.toBe(trackPauseReflectPostItOpen);
    expect(buildPauseScoreImpacts).not.toBe(trackPauseReflectShareTap);
    // Reciprocal inline pins: `application/.../telemetry/pause-reflect-telemetry-io-parity.test.ts`.
    // Full pins: `pause-reflect-flows-telemetry-io-sibling-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-pending-offer-io-parity.test.ts` (reflect+decide vs pending-offer RPC).
   * Dedicated sibling file: `pause-reflect-flows-pending-offer-io-sibling-parity.test.ts` (application + presentation).
   */
  it('sibling cluster: pending-offer-io exports stay distinct from flows-io', () => {
    expect(pauseReflectOutcomeLog).not.toBe(pauseAdoptPendingOffer);
    expect(pauseReflectOutcomeLogWithRepository).not.toBe(pauseDeclinePendingOffer);
    expect(resolvePauseSessionReflectAndDecidePreflight).not.toBe(pauseAdoptPendingOfferWithRepository);
    expect(resolvePauseSessionReflectAndDecideAfterGeneration).not.toBe(pauseDeclinePendingOfferWithRepository);
    expect(buildPauseScoreImpacts).not.toBe(getPendingPauseOfferDisplay);
    expect(formatReinforcementQuoteFromSession).not.toBe(pauseAdoptPendingOffer);
    expect(getSessionQuote).not.toBe(pauseDeclinePendingOffer);
    expect(showPauseOutcomeNotCompletedToast).not.toBe(getPendingPauseOfferDisplay);
    expect(showPauseOutcomeSaveFailedToast).not.toBe(pauseAdoptPendingOffer);
    // Reciprocal inline pins: `pause-reflect-pending-offer-io-parity.test.ts`.
    // Full pins: `pause-reflect-flows-pending-offer-io-sibling-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-share-io-parity.test.ts` and `pause-reflect-share-io.test.ts`.
   * Dedicated sibling file: `pause-reflect-flows-share-io-sibling-parity.test.ts` (application + presentation).
   */
  it('sibling cluster: share-io exports stay distinct from flows-io', () => {
    expect(pauseReflectOutcomeLog).not.toBe(pauseReflectionShareImage);
    expect(pauseReflectOutcomeLogWithRepository).not.toBe(pauseReflectionShareImage);
    expect(resolvePauseSessionReflectAndDecidePreflight).not.toBe(buildReflectionShareText);
    expect(resolvePauseSessionReflectAndDecideAfterGeneration).not.toBe(buildReflectionShareTelegramUrl);
    expect(formatReinforcementQuoteFromSession).not.toBe(buildReflectionShareTweetUrl);
    expect(resolvePauseDecideOutcomeFlow).not.toBe(buildReflectionShareWhatsAppUrl);
    expect(buildPauseScoreImpacts).not.toBe(pauseReflectionShareImage);
    expect(getSessionQuote).not.toBe(buildReflectionShareText);
    expect(showPauseOutcomeNotCompletedToast).not.toBe(pauseReflectionShareImage);
    expect(showPauseOutcomeSaveFailedToast).not.toBe(buildReflectionShareTelegramUrl);
    // Reciprocal inline pins: `pause-reflect-share-io-parity.test.ts`, `pause-reflect-share-io.test.ts`.
    // Full pins: `pause-reflect-flows-share-io-sibling-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `pause-session-step-handlers-io-parity.test.ts` (reflect+decide vs session bundles).
   * Dedicated sibling file: `pause-session-step-handlers-flows-io-sibling-parity.test.ts` (application + presentation).
   */
  it('sibling cluster: step-handlers-io exports stay distinct from flows-io', () => {
    expect(pauseReflectOutcomeLog).not.toBe(buildPauseSessionStepShellBundle);
    expect(pauseReflectOutcomeLogWithRepository).not.toBe(buildPauseSessionStepRitualBundle);
    expect(resolvePauseSessionReflectAndDecidePreflight).not.toBe(buildPauseSessionStepShellBundle);
    expect(resolvePauseSessionReflectAndDecideAfterGeneration).not.toBe(buildPauseSessionStepRitualBundle);
    expect(buildPauseScoreImpacts).not.toBe(buildPauseSessionStepShellBundle);
    expect(formatReinforcementQuoteFromSession).not.toBe(buildPauseSessionStepRitualBundle);
    expect(getSessionQuote).not.toBe(buildPauseSessionStepShellBundle);
    expect(reflectPauseRepository).not.toBe(buildPauseSessionStepRitualBundle);
    // Reciprocal inline pins: `application/.../session/pause-session-step-handlers-io-parity.test.ts`.
    // Full pins: `pause-session-step-handlers-flows-io-sibling-parity.test.ts`.
  });
});
