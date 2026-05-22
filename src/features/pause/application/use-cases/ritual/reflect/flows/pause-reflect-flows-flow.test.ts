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
  buildPauseScoreImpacts,
  getSessionQuote,
  resolvePauseSessionReflectAndDecidePreflight as resolvePreflightFromFlow,
  resolvePauseSessionReflectAndDecideAfterGeneration as resolveAfterFromFlow,
  formatReinforcementQuoteFromSession as formatQuoteFromFlow,
  resolvePauseDecideOutcomeFlow as resolveOutcomeFlowFromFlow,
  runPauseOutcomeLog,
  showPauseOutcomeNotCompletedToast,
  showPauseOutcomeSaveFailedToast,
  resolveScoreImpactDisplayImpacts,
  resolveScoreImpactViewMode,
  scoreImpactMotionDelaySec,
} from './pause-reflect-flows-flow';
import { runPauseOutcomeLog as runOutcomeLogDirect } from '../../decide/run-pause-outcome-log';
import {
  showPauseOutcomeNotCompletedToast as showNotCompletedDirect,
  showPauseOutcomeSaveFailedToast as showSaveFailedDirect,
} from '../../decide/outcome-toast';
import { getSessionQuote as getSessionQuoteDirect } from '../../decide/wisdom-quotes';
import { buildPauseScoreImpacts as buildScoreImpactsDirect } from '../../decide/score-impacts';
import {
  resolveScoreImpactDisplayImpacts as resolveDisplayImpactsDirect,
  resolveScoreImpactViewMode as resolveViewModeDirect,
  scoreImpactMotionDelaySec as motionDelayDirect,
} from '../../decide/score-impact-presentation';

describe('pause-reflect-flows-flow', () => {
  it('re-exports reflect+decide helpers from domain + ritual/decide leaf modules', () => {
    expect(typeof resolvePreflightFromFlow).toBe('function');
    expect(typeof resolveAfterFromFlow).toBe('function');
    expect(typeof formatQuoteFromFlow).toBe('function');
    expect(typeof resolveOutcomeFlowFromFlow).toBe('function');
    expect(typeof runPauseOutcomeLog).toBe('function');
    expect(typeof getSessionQuote).toBe('function');
    expect(typeof buildPauseScoreImpacts).toBe('function');
    expect(typeof showPauseOutcomeNotCompletedToast).toBe('function');
    expect(typeof showPauseOutcomeSaveFailedToast).toBe('function');
    expect(typeof resolveScoreImpactDisplayImpacts).toBe('function');
    expect(typeof resolveScoreImpactViewMode).toBe('function');
    expect(typeof scoreImpactMotionDelaySec).toBe('function');

    expect(resolvePreflightFromFlow).toBe(resolvePauseSessionReflectAndDecidePreflight);
    expect(resolveAfterFromFlow).toBe(resolvePauseSessionReflectAndDecideAfterGeneration);
    expect(formatQuoteFromFlow).toBe(formatReinforcementQuoteFromSession);
    expect(resolveOutcomeFlowFromFlow).toBe(resolvePauseDecideOutcomeFlow);
    expect(runPauseOutcomeLog).toBe(runOutcomeLogDirect);
    expect(showPauseOutcomeNotCompletedToast).toBe(showNotCompletedDirect);
    expect(showPauseOutcomeSaveFailedToast).toBe(showSaveFailedDirect);
    expect(getSessionQuote).toBe(getSessionQuoteDirect);
    expect(buildPauseScoreImpacts).toBe(buildScoreImpactsDirect);
    expect(resolveScoreImpactDisplayImpacts).toBe(resolveDisplayImpactsDirect);
    expect(resolveScoreImpactViewMode).toBe(resolveViewModeDirect);
    expect(scoreImpactMotionDelaySec).toBe(motionDelayDirect);
  });
});
