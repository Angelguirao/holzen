import { describe, expect, it, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {},
}));

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectPauseRepository' },
}));

vi.mock('@/features/pause/application/use-cases/ritual/decide/run-pause-outcome-log', () => ({
  runPauseOutcomeLog: vi.fn(() => Promise.resolve({ status: 'no_instance' as const })),
}));

/**
 * Application sibling parity: flows-flow CI umbrella vs presentation flows-io wrappers.
 * Presentation mirror: `presentation/reflect/flows/pause-reflect-flows-flow-io-wrapper-sibling-parity.test.ts`.
 */
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
} from './pause-reflect-flows-flow';
import * as flowsFlow from './pause-reflect-flows-flow';
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
} from '@/features/pause/presentation/reflect/flows/pause-reflect-flows-io';
import * as flowsIo from '@/features/pause/presentation/reflect/flows/pause-reflect-flows-io';

describe('pause-reflect-flows-flow ↔ pause-reflect-flows-io wrapper sibling parity (application)', () => {
  it('flows-flow CI umbrella and presentation flows-io are distinct anchors', () => {
    expect(typeof resolvePauseSessionReflectAndDecidePreflight).toBe('function');
    expect(typeof resolvePauseSessionReflectAndDecideAfterGeneration).toBe('function');
    expect(typeof resolvePauseDecideOutcomeFlow).toBe('function');
    expect(typeof formatReinforcementQuoteFromSession).toBe('function');
    expect(typeof buildPauseScoreImpacts).toBe('function');
    expect(typeof runPauseOutcomeLog).toBe('function');
    expect(typeof getSessionQuote).toBe('function');
    expect(typeof pauseReflectOutcomeLog).toBe('function');
    expect(typeof pauseReflectOutcomeLogWithRepository).toBe('function');
    expect(typeof reflectPauseRepository).toBe('object');

    expect('pauseReflectOutcomeLog' in flowsFlow).toBe(false);
    expect('pauseReflectOutcomeLogWithRepository' in flowsFlow).toBe(false);
    expect('reflectPauseRepository' in flowsFlow).toBe(false);
    expect('pauseReflectOutcomeLog' in flowsIo).toBe(true);
    expect('pauseReflectOutcomeLogWithRepository' in flowsIo).toBe(true);
    expect('reflectPauseRepository' in flowsIo).toBe(true);
    expect('runPauseOutcomeLog' in flowsIo).toBe(false);
  });

  it('flows-flow re-exports stay aligned with presentation flows-io (shared pure helpers)', () => {
    expect(resolvePauseSessionReflectAndDecidePreflight).toBe(resolvePreflightFromFlowsIo);
    expect(resolvePauseSessionReflectAndDecideAfterGeneration).toBe(resolveAfterGenFromFlowsIo);
    expect(resolvePauseDecideOutcomeFlow).toBe(resolveOutcomeFromFlowsIo);
    expect(formatReinforcementQuoteFromSession).toBe(formatQuoteFromFlowsIo);
    expect(buildPauseScoreImpacts).toBe(buildImpactsFromFlowsIo);
    expect(parseScoreImpactVolatilityPct).toBe(parseVolatilityFromFlowsIo);
    expect(resolveScoreImpactDisplayImpacts).toBe(resolveDisplayImpactsFromFlowsIo);
    expect(resolveScoreImpactViewMode).toBe(resolveViewModeFromFlowsIo);
    expect(scoreImpactMotionDelaySec).toBe(motionDelayFromFlowsIo);
    expect(showPauseOutcomeNotCompletedToast).toBe(showNotCompletedFromFlowsIo);
    expect(showPauseOutcomeSaveFailedToast).toBe(showSaveFailedFromFlowsIo);
    expect(getSessionQuote).toBe(getQuoteFromFlowsIo);
  });

  it('flows-flow leaf outcome export stays off presentation port-bound wrappers', () => {
    expect(runPauseOutcomeLog).not.toBe(pauseReflectOutcomeLog);
    expect(runPauseOutcomeLog).not.toBe(pauseReflectOutcomeLogWithRepository);
    expect(runPauseOutcomeLog).not.toBe(reflectPauseRepository);
    expect(resolvePauseSessionReflectAndDecidePreflight).not.toBe(pauseReflectOutcomeLog);
    expect(getSessionQuote).not.toBe(reflectPauseRepository);
  });

  it('presentation flows-io wrappers stay off flows-flow-only bindings', () => {
    expect(pauseReflectOutcomeLog).not.toBe(runPauseOutcomeLog);
    expect(pauseReflectOutcomeLogWithRepository).not.toBe(runPauseOutcomeLog);
    expect(pauseReflectOutcomeLog).not.toBe(pauseReflectOutcomeLogWithRepository);
    expect(reflectPauseRepository).not.toBe(runPauseOutcomeLog);
    expect(pauseReflectOutcomeLog).not.toBe(resolvePauseSessionReflectAndDecidePreflight);
    expect(pauseReflectOutcomeLogWithRepository).not.toBe(buildPauseScoreImpacts);
  });
});
