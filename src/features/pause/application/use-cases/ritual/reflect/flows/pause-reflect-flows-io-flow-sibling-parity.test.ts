import { describe, expect, it, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {},
}));

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectPauseRepository' },
}));

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

/**
 * Presentation ↔ application sibling parity: flows-io vs flows-flow CI umbrella
 * (parity with `pause-reflect-generation-hook-io-sibling-parity.test.ts` ↔ hook-flow;
 * complements `pause-reflect-flows-io-parity.test.ts` identity pins).
 */
describe('pause-reflect-flows-io ↔ pause-reflect-flows-flow sibling parity', () => {
  it('flows-io and flows-flow are distinct presentation I/O vs application CI surfaces', () => {
    expect(typeof resolvePreflightFromFlowsIo).toBe('function');
    expect(typeof pauseReflectOutcomeLog).toBe('function');
    expect(typeof reflectPauseRepository).toBe('object');

    expect(typeof resolvePauseSessionReflectAndDecidePreflight).toBe('function');
    expect(typeof runPauseOutcomeLog).toBe('function');

    expect('pauseReflectOutcomeLog' in flowsIo).toBe(true);
    expect('pauseReflectOutcomeLogWithRepository' in flowsIo).toBe(true);
    expect('reflectPauseRepository' in flowsIo).toBe(true);

    expect('pauseReflectOutcomeLog' in flowsFlow).toBe(false);
    expect('pauseReflectOutcomeLogWithRepository' in flowsFlow).toBe(false);
    expect('reflectPauseRepository' in flowsFlow).toBe(false);
  });

  it('presentation flows-io reflect+decide bindings match flows CI umbrella', () => {
    expect(resolvePreflightFromFlowsIo).toBe(resolvePauseSessionReflectAndDecidePreflight);
    expect(resolveAfterGenFromFlowsIo).toBe(resolvePauseSessionReflectAndDecideAfterGeneration);
    expect(formatQuoteFromFlowsIo).toBe(formatReinforcementQuoteFromSession);
    expect(resolveOutcomeFromFlowsIo).toBe(resolvePauseDecideOutcomeFlow);
    expect(getQuoteFromFlowsIo).toBe(getSessionQuote);
    expect(buildImpactsFromFlowsIo).toBe(buildPauseScoreImpacts);
    expect(parseVolatilityFromFlowsIo).toBe(parseScoreImpactVolatilityPct);
    expect(resolveDisplayImpactsFromFlowsIo).toBe(resolveScoreImpactDisplayImpacts);
    expect(resolveViewModeFromFlowsIo).toBe(resolveScoreImpactViewMode);
    expect(motionDelayFromFlowsIo).toBe(scoreImpactMotionDelaySec);
    expect(showNotCompletedFromFlowsIo).toBe(showPauseOutcomeNotCompletedToast);
    expect(showSaveFailedFromFlowsIo).toBe(showPauseOutcomeSaveFailedToast);
  });

  it('presentation outcome RPC wrappers stay off flows-flow leaf re-export', () => {
    expect(pauseReflectOutcomeLog).not.toBe(runPauseOutcomeLog);
    expect(pauseReflectOutcomeLogWithRepository).not.toBe(runPauseOutcomeLog);
    expect(pauseReflectOutcomeLog).not.toBe(pauseReflectOutcomeLogWithRepository);
    expect(resolvePreflightFromFlowsIo).not.toBe(pauseReflectOutcomeLog);
    expect(formatQuoteFromFlowsIo).not.toBe(pauseReflectOutcomeLogWithRepository);
    expect(reflectPauseRepository).not.toBe(runPauseOutcomeLog);
  });

  it('flows-flow CI umbrella re-exports runPauseOutcomeLog without presentation port wrappers', () => {
    expect(runPauseOutcomeLog).not.toBe(pauseReflectOutcomeLog);
    expect(runPauseOutcomeLog).not.toBe(pauseReflectOutcomeLogWithRepository);
    expect(resolvePauseSessionReflectAndDecidePreflight).not.toBe(pauseReflectOutcomeLog);
    expect(buildPauseScoreImpacts).not.toBe(reflectPauseRepository);
  });
});
