import { describe, expect, it } from 'vitest';

import {
  formatReinforcementQuoteFromSession,
  resolvePauseDecideOutcomeFlow,
} from '@/features/pause/domain/decide/pause-decide-outcome-flow';
import {
  resolvePauseSessionReflectAndDecideAfterGeneration,
  resolvePauseSessionReflectAndDecidePreflight,
} from '@/features/pause/domain/reflect/flows/pause-session-reflect-and-decide-flow';

import {
  showPauseOutcomeNotCompletedToast,
  showPauseOutcomeSaveFailedToast,
} from '../../decide/outcome-toast';
import { runPauseOutcomeLog } from '../../decide/run-pause-outcome-log';
import {
  buildPauseScoreImpacts,
  parseScoreImpactVolatilityPct,
} from '../../decide/score-impacts';
import {
  resolveScoreImpactDisplayImpacts,
  resolveScoreImpactViewMode,
  scoreImpactMotionDelaySec,
} from '../../decide/score-impact-presentation';
import { getSessionQuote } from '../../decide/wisdom-quotes';

import {
  buildPauseScoreImpacts as buildImpactsFromFlow,
  formatReinforcementQuoteFromSession as formatQuoteFromFlow,
  getSessionQuote as getQuoteFromFlow,
  parseScoreImpactVolatilityPct as parseVolatilityFromFlow,
  resolvePauseDecideOutcomeFlow as resolveOutcomeFlowFromFlow,
  resolvePauseSessionReflectAndDecideAfterGeneration as resolveAfterGenFromFlow,
  resolvePauseSessionReflectAndDecidePreflight as resolvePreflightFromFlow,
  resolveScoreImpactDisplayImpacts as resolveDisplayImpactsFromFlow,
  resolveScoreImpactViewMode as resolveViewModeFromFlow,
  runPauseOutcomeLog as runOutcomeLogFromFlow,
  scoreImpactMotionDelaySec as motionDelayFromFlow,
  showPauseOutcomeNotCompletedToast as showNotCompletedFromFlow,
  showPauseOutcomeSaveFailedToast as showSaveFailedFromFlow,
} from './pause-reflect-flows-flow';

describe('pause-reflect-flows-flow', () => {
  it('re-exports reflect+decide helpers from domain + ritual/decide leaf modules', () => {
    expect(typeof resolvePreflightFromFlow).toBe('function');
    expect(typeof resolveAfterGenFromFlow).toBe('function');
    expect(typeof formatQuoteFromFlow).toBe('function');
    expect(typeof resolveOutcomeFlowFromFlow).toBe('function');
    expect(typeof getQuoteFromFlow).toBe('function');
    expect(typeof runOutcomeLogFromFlow).toBe('function');
    expect(typeof showNotCompletedFromFlow).toBe('function');
    expect(typeof showSaveFailedFromFlow).toBe('function');
    expect(typeof buildImpactsFromFlow).toBe('function');
    expect(typeof parseVolatilityFromFlow).toBe('function');
    expect(typeof resolveDisplayImpactsFromFlow).toBe('function');
    expect(typeof resolveViewModeFromFlow).toBe('function');
    expect(typeof motionDelayFromFlow).toBe('function');

    expect(resolvePreflightFromFlow).toBe(resolvePauseSessionReflectAndDecidePreflight);
    expect(resolveAfterGenFromFlow).toBe(resolvePauseSessionReflectAndDecideAfterGeneration);
    expect(formatQuoteFromFlow).toBe(formatReinforcementQuoteFromSession);
    expect(resolveOutcomeFlowFromFlow).toBe(resolvePauseDecideOutcomeFlow);
    expect(getQuoteFromFlow).toBe(getSessionQuote);
    expect(runOutcomeLogFromFlow).toBe(runPauseOutcomeLog);
    expect(showNotCompletedFromFlow).toBe(showPauseOutcomeNotCompletedToast);
    expect(showSaveFailedFromFlow).toBe(showPauseOutcomeSaveFailedToast);
    expect(buildImpactsFromFlow).toBe(buildPauseScoreImpacts);
    expect(parseVolatilityFromFlow).toBe(parseScoreImpactVolatilityPct);
    expect(resolveDisplayImpactsFromFlow).toBe(resolveScoreImpactDisplayImpacts);
    expect(resolveViewModeFromFlow).toBe(resolveScoreImpactViewMode);
    expect(motionDelayFromFlow).toBe(scoreImpactMotionDelaySec);
  });
});
