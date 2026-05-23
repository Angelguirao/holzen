import { describe, expect, it } from 'vitest';

import {
  buildShiftEmotionFrameHubLogBundle,
  resolveShiftFrameHubDonePresentation,
  runShiftEmotionFrameHubDone,
} from '../hub/pause-reflect-hub-flow';
import {
  buildPauseScoreImpacts,
  formatReinforcementQuoteFromSession,
  getSessionQuote,
  resolvePauseDecideOutcomeFlow,
  resolvePauseSessionReflectAndDecideAfterGeneration,
  resolvePauseSessionReflectAndDecidePreflight,
  runPauseOutcomeLog,
  showPauseOutcomeNotCompletedToast,
  showPauseOutcomeSaveFailedToast,
} from './pause-reflect-flows-flow';
import * as flowsFlow from './pause-reflect-flows-flow';
import * as hubFlow from '../hub/pause-reflect-hub-flow';

describe('pause-reflect-flows-flow ↔ pause-reflect-hub-flow sibling parity', () => {
  it('flows-flow and hub-flow are distinct sibling CI anchors', () => {
    expect(typeof resolvePauseSessionReflectAndDecidePreflight).toBe('function');
    expect(typeof resolvePauseSessionReflectAndDecideAfterGeneration).toBe('function');
    expect(typeof formatReinforcementQuoteFromSession).toBe('function');
    expect(typeof resolvePauseDecideOutcomeFlow).toBe('function');
    expect(typeof getSessionQuote).toBe('function');
    expect(typeof runPauseOutcomeLog).toBe('function');
    expect(typeof showPauseOutcomeNotCompletedToast).toBe('function');
    expect(typeof showPauseOutcomeSaveFailedToast).toBe('function');
    expect(typeof buildPauseScoreImpacts).toBe('function');
    expect(typeof runShiftEmotionFrameHubDone).toBe('function');
    expect(typeof buildShiftEmotionFrameHubLogBundle).toBe('function');
    expect(typeof resolveShiftFrameHubDonePresentation).toBe('function');

    expect('runShiftEmotionFrameHubDone' in flowsFlow).toBe(false);
    expect('buildShiftEmotionFrameHubLogBundle' in flowsFlow).toBe(false);
    expect('resolveShiftFrameHubDonePresentation' in flowsFlow).toBe(false);
    expect('resolvePauseSessionReflectAndDecidePreflight' in hubFlow).toBe(false);
    expect('resolvePauseSessionReflectAndDecideAfterGeneration' in hubFlow).toBe(false);
    expect('formatReinforcementQuoteFromSession' in hubFlow).toBe(false);
    expect('resolvePauseDecideOutcomeFlow' in hubFlow).toBe(false);
    expect('runPauseOutcomeLog' in hubFlow).toBe(false);
  });

  it('flows umbrella exports stay off shift-frame hub done RPC and log bundle', () => {
    expect(resolvePauseSessionReflectAndDecidePreflight).not.toBe(runShiftEmotionFrameHubDone);
    expect(resolvePauseSessionReflectAndDecideAfterGeneration).not.toBe(runShiftEmotionFrameHubDone);
    expect(runPauseOutcomeLog).not.toBe(runShiftEmotionFrameHubDone);
    expect(formatReinforcementQuoteFromSession).not.toBe(buildShiftEmotionFrameHubLogBundle);
    expect(resolvePauseDecideOutcomeFlow).not.toBe(resolveShiftFrameHubDonePresentation);
    expect(buildPauseScoreImpacts).not.toBe(buildShiftEmotionFrameHubLogBundle);
  });

  it('hub umbrella exports stay off reflect+decide preflight and decide outcome helpers', () => {
    expect(runShiftEmotionFrameHubDone).not.toBe(resolvePauseSessionReflectAndDecidePreflight);
    expect(runShiftEmotionFrameHubDone).not.toBe(runPauseOutcomeLog);
    expect(buildShiftEmotionFrameHubLogBundle).not.toBe(formatReinforcementQuoteFromSession);
    expect(resolveShiftFrameHubDonePresentation).not.toBe(resolvePauseDecideOutcomeFlow);
    expect(runShiftEmotionFrameHubDone).not.toBe(showPauseOutcomeNotCompletedToast);
    expect(buildShiftEmotionFrameHubLogBundle).not.toBe(getSessionQuote);
  });
});
