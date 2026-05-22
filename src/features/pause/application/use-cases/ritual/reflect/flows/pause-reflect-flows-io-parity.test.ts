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
  });
});
