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
  buildPauseScoreImpacts as buildImpactsFromFlowsFlow,
  formatReinforcementQuoteFromSession as formatQuoteFromFlowsFlow,
  getSessionQuote as getQuoteFromFlowsFlow,
  parseScoreImpactVolatilityPct as parseVolatilityFromFlowsFlow,
  resolvePauseDecideOutcomeFlow as resolveOutcomeFromFlowsFlow,
  resolvePauseSessionReflectAndDecideAfterGeneration as resolveAfterGenFromFlowsFlow,
  resolvePauseSessionReflectAndDecidePreflight as resolvePreflightFromFlowsFlow,
  resolveScoreImpactDisplayImpacts as resolveDisplayImpactsFromFlowsFlow,
  resolveScoreImpactViewMode as resolveViewModeFromFlowsFlow,
  scoreImpactMotionDelaySec as motionDelayFromFlowsFlow,
  showPauseOutcomeNotCompletedToast as showNotCompletedFromFlowsFlow,
  showPauseOutcomeSaveFailedToast as showSaveFailedFromFlowsFlow,
} from '@/features/pause/application/use-cases/ritual/reflect/flows/pause-reflect-flows-flow';
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
import { getSessionQuote as getQuoteDirect } from '@/features/pause/application/use-cases/ritual/decide/wisdom-quotes';

import { supabasePauseRepository } from '@/features/pause/public-rpc';

import {
  buildPauseScoreImpacts,
  formatReinforcementQuoteFromSession,
  getSessionQuote,
  parseScoreImpactVolatilityPct,
  reflectPauseRepository,
  resolvePauseDecideOutcomeFlow,
  resolvePauseSessionReflectAndDecideAfterGeneration,
  resolvePauseSessionReflectAndDecidePreflight,
  resolveScoreImpactDisplayImpacts,
  resolveScoreImpactViewMode,
  scoreImpactMotionDelaySec,
  showPauseOutcomeNotCompletedToast,
  showPauseOutcomeSaveFailedToast,
} from './pause-reflect-flows-io';

describe('pause-reflect-flows-io re-exports', () => {
  it('re-exports reflect+decide helpers from domain + ritual/decide leaf modules', () => {
    expect(typeof resolvePauseSessionReflectAndDecidePreflight).toBe('function');
    expect(typeof resolvePauseSessionReflectAndDecideAfterGeneration).toBe('function');
    expect(typeof formatReinforcementQuoteFromSession).toBe('function');
    expect(typeof resolvePauseDecideOutcomeFlow).toBe('function');
    expect(typeof getSessionQuote).toBe('function');
    expect(typeof buildPauseScoreImpacts).toBe('function');
    expect(typeof parseScoreImpactVolatilityPct).toBe('function');
    expect(typeof resolveScoreImpactDisplayImpacts).toBe('function');
    expect(typeof resolveScoreImpactViewMode).toBe('function');
    expect(typeof scoreImpactMotionDelaySec).toBe('function');
    expect(typeof showPauseOutcomeNotCompletedToast).toBe('function');
    expect(typeof showPauseOutcomeSaveFailedToast).toBe('function');

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
  });

  it('binds default reflectPauseRepository to public-rpc supabasePauseRepository', () => {
    expect(reflectPauseRepository).toBe(supabasePauseRepository);
  });

  it('presentation I/O bindings match pause-reflect-flows-flow CI anchor (leaf parity)', () => {
    expect(resolvePauseSessionReflectAndDecidePreflight).toBe(resolvePreflightFromFlowsFlow);
    expect(resolvePauseSessionReflectAndDecideAfterGeneration).toBe(resolveAfterGenFromFlowsFlow);
    expect(formatReinforcementQuoteFromSession).toBe(formatQuoteFromFlowsFlow);
    expect(resolvePauseDecideOutcomeFlow).toBe(resolveOutcomeFromFlowsFlow);
    expect(getSessionQuote).toBe(getQuoteFromFlowsFlow);
    expect(buildPauseScoreImpacts).toBe(buildImpactsFromFlowsFlow);
    expect(parseScoreImpactVolatilityPct).toBe(parseVolatilityFromFlowsFlow);
    expect(resolveScoreImpactDisplayImpacts).toBe(resolveDisplayImpactsFromFlowsFlow);
    expect(resolveScoreImpactViewMode).toBe(resolveViewModeFromFlowsFlow);
    expect(scoreImpactMotionDelaySec).toBe(motionDelayFromFlowsFlow);
    expect(showPauseOutcomeNotCompletedToast).toBe(showNotCompletedFromFlowsFlow);
    expect(showPauseOutcomeSaveFailedToast).toBe(showSaveFailedFromFlowsFlow);
  });
});
