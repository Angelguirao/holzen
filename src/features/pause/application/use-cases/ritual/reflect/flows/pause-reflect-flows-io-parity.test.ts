/**
 * Application-layer I/O parity for ritual reflect+decide flows cluster (parity with
 * `pause-session-ritual-restore-io-parity.test.ts`; presentation pins stay colocated beside
 * `pause-reflect-flows-io.ts`).
 * Imports `pause-reflect-flows-flow` CI umbrella for `.toBe` identity pins only —
 * production flows I/O keeps ritual/decide + domain leaf imports.
 */
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {},
}));

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectPauseRepository' },
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
  resolvePauseDecideOutcomeFlow as resolveOutcomeFromFlowsIo,
  resolvePauseSessionReflectAndDecideAfterGeneration as resolveAfterGenFromFlowsIo,
  resolvePauseSessionReflectAndDecidePreflight as resolvePreflightFromFlowsIo,
  resolveScoreImpactDisplayImpacts as resolveDisplayImpactsFromFlowsIo,
  resolveScoreImpactViewMode as resolveViewModeFromFlowsIo,
  scoreImpactMotionDelaySec as motionDelayFromFlowsIo,
  showPauseOutcomeNotCompletedToast as showNotCompletedFromFlowsIo,
  showPauseOutcomeSaveFailedToast as showSaveFailedFromFlowsIo,
} from '@/features/pause/presentation/reflect/flows/pause-reflect-flows-io';

/**
 * Application mirror: `presentation/reflect/flows/pause-reflect-flows-io-parity.test.ts`.
 */
describe('pause-reflect-flows-io parity (application)', () => {
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
});
