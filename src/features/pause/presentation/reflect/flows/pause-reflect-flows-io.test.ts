import { describe, expect, it, vi } from 'vitest';

const runPauseOutcomeLogMock = vi.hoisted(() => vi.fn());
const trackPauseReflectPostItOpenMock = vi.hoisted(() => vi.fn());
const trackPauseReflectShareTapMock = vi.hoisted(() => vi.fn());
const trackPauseReflectWallpaperTapMock = vi.hoisted(() => vi.fn());

vi.mock(
  '@/features/pause/application/use-cases/ritual/decide/run-pause-outcome-log',
  async (importOriginal) => {
    const actual = await importOriginal<
      typeof import('@/features/pause/application/use-cases/ritual/decide/run-pause-outcome-log')
    >();
    return {
      ...actual,
      runPauseOutcomeLog: runPauseOutcomeLogMock,
    };
  },
);

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectPauseRepository' },
}));

vi.mock(
  '@/features/pause/application/use-cases/ritual/reflect/telemetry/pause-reflect-session-ui-telemetry',
  () => ({
    trackPauseReflectPostItOpen: trackPauseReflectPostItOpenMock,
    trackPauseReflectShareTap: trackPauseReflectShareTapMock,
    trackPauseReflectWallpaperTap: trackPauseReflectWallpaperTapMock,
  }),
);

import { runPauseOutcomeLog as runPauseOutcomeLogDirect } from '@/features/pause/application/use-cases/ritual/decide/run-pause-outcome-log';
import { supabasePauseRepository } from '@/features/pause/public-rpc';

import {
  startPauseReflectFrameFocusAmbience,
  stopPauseReflectFrameFocusAmbience,
} from '@/features/pause/presentation/reflect/ambience/pause-reflect-ambience-io';
import {
  pauseShiftEmotionFrameHubDone,
  pauseShiftEmotionFrameHubDoneWithRepository,
} from '@/features/pause/presentation/reflect/hub/pause-reflect-hub-io';
import {
  buildFeelTilesMoodLogOptions,
  pauseInitialEmotionSelect,
  pauseInitialEmotionSkip,
} from '@/features/pause/presentation/reflect/mood/pause-reflect-mood-io';
import { pauseReflectionShareImage } from '@/features/pause/presentation/reflect/share/pause-reflect-share-io';
import {
  trackPauseReflectPostItOpen,
  trackPauseReflectShareTap,
  trackPauseReflectWallpaperTap,
} from '@/features/pause/presentation/reflect/telemetry/pause-reflect-telemetry-io';
import {
  getPendingPauseOfferDisplay,
  pauseAdoptPendingOffer,
  pauseAdoptPendingOfferWithRepository,
  pauseDeclinePendingOffer,
  pauseDeclinePendingOfferWithRepository,
} from '@/features/pause/presentation/reflect/pending-offer/pause-reflect-pending-offer-io';
import {
  pauseReflectFavoriteToggle,
  pauseReflectNoteUpdate,
  pauseReflectTagUpdate,
  pauseReflectionStepLogOnce,
  shouldLogPauseReflectionStep,
  shouldShowFavoriteProHint,
} from '@/features/pause/presentation/reflect/steps/pause-reflect-steps-io';
import {
  buildPauseSessionStepRitualBundle,
  buildPauseSessionStepShellBundle,
} from '@/features/pause/presentation/session/pause-session-step-handlers-io';
import {
  buildPauseScoreImpacts,
  formatReinforcementQuoteFromSession,
  getSessionQuote,
  pauseReflectOutcomeLog,
  pauseReflectOutcomeLogWithRepository,
  reflectPauseRepository,
  resolvePauseDecideOutcomeFlow,
  resolvePauseSessionReflectAndDecideAfterGeneration,
  resolvePauseSessionReflectAndDecidePreflight,
  type PauseImpactData,
} from './pause-reflect-flows-io';

describe('pause-reflect-flows-io', () => {
  it('binds default reflectPauseRepository to public-rpc supabasePauseRepository', () => {
    expect(reflectPauseRepository).toBe(supabasePauseRepository);
  });

  it('types PauseImpactData via pause-session-decide-io (session decide beat)', () => {
    const sample: PauseImpactData = {
      mood: null,
      moodAfter: null,
      breathingCompleted: true,
      decision: 'hold',
      context: null,
      engagedTools: 0,
      wroteNote: false,
      usedTags: false,
    };
    expect(sample.decision).toBe('hold');
  });

  it('re-exports reflect-and-decide preflight helpers from subcluster flows', () => {
    const view = resolvePauseSessionReflectAndDecidePreflight({
      seedMessage: 'seed',
      ritualEntry: 'deep',
      step: 'reflect',
      btcData: null,
    });
    expect(view.reflectGenEnabled).toBe(true);
    expect(view.effectiveReflectionMessage).toBe('seed');
  });

  it('re-exports score-impact builders from ritual/decide score-impacts leaf modules', () => {
    const impacts = buildPauseScoreImpacts(
      {
        mood: 'calm',
        moodAfter: 'calm',
        breathingCompleted: true,
        decision: 'hold',
        context: null,
        engagedTools: 0,
        wroteNote: false,
        usedTags: false,
      },
      (key) => key,
      'brief',
    );
    expect(impacts.length).toBeGreaterThan(0);
  });

  it('re-exports decide flow helpers from domain/decide leaf modules', () => {
    const quote = getSessionQuote();
    expect(formatReinforcementQuoteFromSession(quote)).toContain(quote.author);
    expect(
      resolvePauseDecideOutcomeFlow({
        outcome: { status: 'sync_failed' },
        decision: 'hold',
        ritualSnapshot: {
          context: null,
          selectedMood: null,
          selectedMoodAfter: null,
          ritualEntry: 'deep',
          breathingFirstCompleted: true,
          breathingSecondCompleted: true,
          feelIntensity: null,
          shiftIntensity: null,
          reflectionMessage: '',
          haiku: null,
        },
        reinforcementQuote: 'quote',
      }).kind,
    ).toBe('abort_sync_failed');
  });

  /**
   * Reciprocal pins ↔ `pause-reflect-flows-flow.test.ts`. Full cross-layer pins:
   * `pause-reflect-flows-io-flow-sibling-parity.test.ts`.
   */
  it('sibling cluster: flows-flow leaf outcome log stays distinct from presentation port wrappers', () => {
    expect(pauseReflectOutcomeLog).not.toBe(runPauseOutcomeLogDirect);
    expect(pauseReflectOutcomeLogWithRepository).not.toBe(runPauseOutcomeLogDirect);
    expect(resolvePauseSessionReflectAndDecidePreflight).not.toBe(pauseReflectOutcomeLog);
    expect(formatReinforcementQuoteFromSession).not.toBe(pauseReflectOutcomeLogWithRepository);
    expect(reflectPauseRepository).not.toBe(runPauseOutcomeLogDirect);
  });

  it('exports pauseReflectOutcomeLog wrappers distinct from run-pause-outcome-log leaf', () => {
    expect(typeof pauseReflectOutcomeLog).toBe('function');
    expect(typeof pauseReflectOutcomeLogWithRepository).toBe('function');
    expect(pauseReflectOutcomeLog).not.toBe(runPauseOutcomeLogDirect);
    expect(pauseReflectOutcomeLogWithRepository).not.toBe(runPauseOutcomeLogDirect);
    expect(pauseReflectOutcomeLog).not.toBe(pauseReflectOutcomeLogWithRepository);
    expect(pauseReflectOutcomeLog).not.toBe(trackPauseReflectPostItOpen);
    expect(pauseReflectOutcomeLogWithRepository).not.toBe(trackPauseReflectShareTap);
    expect(resolvePauseSessionReflectAndDecidePreflight).not.toBe(trackPauseReflectWallpaperTap);
  });

  it('routes decide outcome log through the default PauseRepository port adapter', async () => {
    runPauseOutcomeLogMock.mockResolvedValue({ status: 'completed' });

    const result = await pauseReflectOutcomeLog({
      pauseInstanceId: 'pi-1',
      decision: 'hold',
    });

    expect(result).toEqual({ status: 'completed' });
    expect(runPauseOutcomeLogMock).toHaveBeenCalledWith(reflectPauseRepository, {
      pauseInstanceId: 'pi-1',
      decision: 'hold',
    });
  });

  it('pauseReflectOutcomeLogWithRepository forwards a custom repository', async () => {
    const repository = { port: 'custom' } as import('@/features/pause/ports/pause-repository').PauseRepository;
    runPauseOutcomeLogMock.mockResolvedValue({ status: 'no_instance' });

    await pauseReflectOutcomeLogWithRepository(repository, {
      pauseInstanceId: null,
      decision: 'hold',
    });

    expect(runPauseOutcomeLogMock).toHaveBeenCalledWith(repository, {
      pauseInstanceId: null,
      decision: 'hold',
    });
  });

  it('sibling cluster: telemetry-io exports stay distinct from flows-io re-exports', () => {
    expect(resolvePauseSessionReflectAndDecidePreflight).not.toBe(trackPauseReflectPostItOpen);
    expect(pauseReflectOutcomeLog).not.toBe(trackPauseReflectShareTap);
    expect(buildPauseScoreImpacts).not.toBe(trackPauseReflectWallpaperTap);
    expect(getSessionQuote).not.toBe(trackPauseReflectPostItOpen);
    expect(pauseReflectOutcomeLogWithRepository).not.toBe(trackPauseReflectShareTap);
  });

  it('sibling cluster: ambience-io exports stay distinct from flows-io re-exports', () => {
    expect(resolvePauseSessionReflectAndDecidePreflight).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(pauseReflectOutcomeLog).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(buildPauseScoreImpacts).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(formatReinforcementQuoteFromSession).not.toBe(stopPauseReflectFrameFocusAmbience);
  });

  it('sibling cluster: hub-io exports stay distinct from flows-io', () => {
    expect(pauseReflectOutcomeLog).not.toBe(pauseShiftEmotionFrameHubDone);
    expect(pauseReflectOutcomeLogWithRepository).not.toBe(pauseShiftEmotionFrameHubDoneWithRepository);
    expect(resolvePauseSessionReflectAndDecidePreflight).not.toBe(pauseShiftEmotionFrameHubDone);
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-share-io.test.ts` (reflect+decide vs reflection share).
   * Dedicated sibling file: `pause-reflect-flows-share-io-sibling-parity.test.ts` (application + presentation).
   */
  it('sibling cluster: share-io exports stay distinct from flows-io', () => {
    expect(pauseReflectOutcomeLog).not.toBe(pauseReflectionShareImage);
    expect(pauseReflectOutcomeLogWithRepository).not.toBe(pauseReflectionShareImage);
    expect(resolvePauseSessionReflectAndDecidePreflight).not.toBe(pauseReflectionShareImage);
    expect(buildPauseScoreImpacts).not.toBe(pauseReflectionShareImage);
    // Full pins: `pause-reflect-flows-share-io-sibling-parity.test.ts`.
  });

  it('sibling cluster: mood-io exports stay distinct from flows-io', () => {
    expect(pauseReflectOutcomeLog).not.toBe(pauseInitialEmotionSelect);
    expect(pauseReflectOutcomeLogWithRepository).not.toBe(pauseInitialEmotionSkip);
    expect(resolvePauseSessionReflectAndDecidePreflight).not.toBe(pauseInitialEmotionSelect);
    expect(buildPauseScoreImpacts).not.toBe(pauseInitialEmotionSkip);
    expect(buildPauseScoreImpacts).not.toBe(buildFeelTilesMoodLogOptions);
    // Reciprocal inline pins: `pause-reflect-mood-io.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-pending-offer-io.test.ts` (reflect+decide vs pending-offer RPC).
   * Dedicated sibling file: `pause-reflect-flows-pending-offer-io-sibling-parity.test.ts`.
   */
  it('sibling cluster: pending-offer-io exports stay distinct from flows-io', () => {
    expect(pauseReflectOutcomeLog).not.toBe(pauseAdoptPendingOffer);
    expect(pauseReflectOutcomeLogWithRepository).not.toBe(pauseDeclinePendingOffer);
    expect(resolvePauseSessionReflectAndDecidePreflight).not.toBe(getPendingPauseOfferDisplay);
    expect(resolvePauseSessionReflectAndDecideAfterGeneration).not.toBe(pauseAdoptPendingOfferWithRepository);
    expect(buildPauseScoreImpacts).not.toBe(pauseDeclinePendingOffer);
    expect(formatReinforcementQuoteFromSession).not.toBe(pauseDeclinePendingOfferWithRepository);
    expect(getSessionQuote).not.toBe(pauseAdoptPendingOffer);
    expect(resolvePauseDecideOutcomeFlow).not.toBe(getPendingPauseOfferDisplay);
    // Reciprocal inline pins: `pause-reflect-pending-offer-io.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-steps-io.test.ts` (reflect+decide vs step RPC wrappers).
   * Dedicated sibling file: `pause-reflect-flows-steps-io-sibling-parity.test.ts`.
   */
  it('sibling cluster: steps-io exports stay distinct from flows-io', () => {
    expect(pauseReflectOutcomeLog).not.toBe(pauseReflectFavoriteToggle);
    expect(pauseReflectOutcomeLogWithRepository).not.toBe(pauseReflectNoteUpdate);
    expect(resolvePauseSessionReflectAndDecidePreflight).not.toBe(pauseReflectTagUpdate);
    expect(resolvePauseSessionReflectAndDecideAfterGeneration).not.toBe(pauseReflectionStepLogOnce);
    expect(buildPauseScoreImpacts).not.toBe(pauseReflectFavoriteToggle);
    expect(formatReinforcementQuoteFromSession).not.toBe(pauseReflectNoteUpdate);
    expect(getSessionQuote).not.toBe(pauseReflectTagUpdate);
    expect(resolvePauseDecideOutcomeFlow).not.toBe(pauseReflectionStepLogOnce);
    expect(reflectPauseRepository).not.toBe(shouldShowFavoriteProHint);
    expect(pauseReflectOutcomeLog).not.toBe(shouldLogPauseReflectionStep);
    expect(pauseReflectOutcomeLogWithRepository).not.toBe(pauseReflectFavoriteToggle);
    // Reciprocal inline pins: `pause-reflect-steps-io.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `pause-session-step-handlers-io.test.ts` (reflect+decide vs session bundles).
   * Dedicated sibling file: `pause-session-step-handlers-flows-io-sibling-parity.test.ts`.
   */
  it('sibling cluster: step-handlers-io exports stay distinct from flows-io', () => {
    expect(pauseReflectOutcomeLog).not.toBe(buildPauseSessionStepShellBundle);
    expect(pauseReflectOutcomeLogWithRepository).not.toBe(buildPauseSessionStepRitualBundle);
    expect(resolvePauseSessionReflectAndDecidePreflight).not.toBe(buildPauseSessionStepShellBundle);
    expect(resolvePauseSessionReflectAndDecideAfterGeneration).not.toBe(buildPauseSessionStepRitualBundle);
    expect(buildPauseScoreImpacts).not.toBe(buildPauseSessionStepShellBundle);
    expect(formatReinforcementQuoteFromSession).not.toBe(buildPauseSessionStepRitualBundle);
    expect(reflectPauseRepository).not.toBe(buildPauseSessionStepShellBundle);
    // Full cross-I/O pins: `pause-session-step-handlers-flows-io-sibling-parity.test.ts`.
  });
});
