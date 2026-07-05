import { describe, expect, it } from 'vitest';

import {
  buildFeelTilesMoodLogOptions,
  runInitialEmotionSelect,
  runInitialEmotionSkip
} from '../../feel/pause-feel-flow';
import {
  buildPauseScoreImpacts,
  resolvePauseDecideOutcomeFlow,
  resolvePauseSessionReflectAndDecideAfterGeneration,
  resolvePauseSessionReflectAndDecidePreflight,
  runPauseOutcomeLog,
  showPauseOutcomeNotCompletedToast,
  showPauseOutcomeSaveFailedToast
} from './pause-reflect-flows-flow';
import * as flowsFlow from './pause-reflect-flows-flow';
import * as moodFlow from '../../feel/pause-feel-flow';

describe('pause-reflect-flows-flow ↔ pause-feel-flow sibling parity', () => {
  it('flows-flow and mood-flow are distinct sibling CI anchors', () => {
    expect(typeof resolvePauseSessionReflectAndDecidePreflight).toBe('function');
    expect(typeof resolvePauseSessionReflectAndDecideAfterGeneration).toBe('function');
    expect(typeof resolvePauseDecideOutcomeFlow).toBe('function');
    expect(typeof runPauseOutcomeLog).toBe('function');
    expect(typeof showPauseOutcomeNotCompletedToast).toBe('function');
    expect(typeof showPauseOutcomeSaveFailedToast).toBe('function');
    expect(typeof buildPauseScoreImpacts).toBe('function');
    expect(typeof runInitialEmotionSelect).toBe('function');
    expect(typeof runInitialEmotionSkip).toBe('function');
    expect(typeof buildFeelTilesMoodLogOptions).toBe('function');

    expect('runInitialEmotionSelect' in flowsFlow).toBe(false);
    expect('runInitialEmotionSkip' in flowsFlow).toBe(false);
    expect('buildFeelTilesMoodLogOptions' in flowsFlow).toBe(false);
    expect('resolvePauseSessionReflectAndDecidePreflight' in moodFlow).toBe(false);
    expect('resolvePauseSessionReflectAndDecideAfterGeneration' in moodFlow).toBe(false);
    expect('resolvePauseDecideOutcomeFlow' in moodFlow).toBe(false);
    expect('runPauseOutcomeLog' in moodFlow).toBe(false);
  });

  it('flows umbrella exports stay off initial-emotion RPC and feel-tile helpers', () => {
    expect(resolvePauseSessionReflectAndDecidePreflight).not.toBe(runInitialEmotionSelect);
    expect(resolvePauseSessionReflectAndDecideAfterGeneration).not.toBe(runInitialEmotionSkip);
    expect(runPauseOutcomeLog).not.toBe(runInitialEmotionSelect);
    expect(resolvePauseDecideOutcomeFlow).not.toBe(runInitialEmotionSkip);
    expect(buildPauseScoreImpacts).not.toBe(buildFeelTilesMoodLogOptions);
  });

  it('mood umbrella exports stay off reflect+decide preflight and decide outcome helpers', () => {
    expect(runInitialEmotionSelect).not.toBe(resolvePauseSessionReflectAndDecidePreflight);
    expect(runInitialEmotionSkip).not.toBe(resolvePauseSessionReflectAndDecideAfterGeneration);
    expect(runInitialEmotionSelect).not.toBe(runPauseOutcomeLog);
    expect(runInitialEmotionSkip).not.toBe(resolvePauseDecideOutcomeFlow);
    expect(buildFeelTilesMoodLogOptions).not.toBe(showPauseOutcomeNotCompletedToast);
  });
});
