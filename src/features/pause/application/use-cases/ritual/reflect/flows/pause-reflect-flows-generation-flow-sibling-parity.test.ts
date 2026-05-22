import { describe, expect, it } from 'vitest';

import {
  dismissOpenPauseHome,
  openManualPauseFromHome,
  resolveReflectGenerationPrefetch,
  runReflectGeneration,
} from '../generation/pause-reflect-generation-flow';
import {
  buildPauseScoreImpacts,
  formatReinforcementQuoteFromSession,
  resolvePauseDecideOutcomeFlow,
  resolvePauseSessionReflectAndDecideAfterGeneration,
  resolvePauseSessionReflectAndDecidePreflight,
  runPauseOutcomeLog,
  showPauseOutcomeNotCompletedToast,
} from './pause-reflect-flows-flow';
import * as flowsFlow from './pause-reflect-flows-flow';
import * as generationFlow from '../generation/pause-reflect-generation-flow';

describe('pause-reflect-flows-flow ↔ pause-reflect-generation-flow sibling parity', () => {
  it('flows-flow and generation-flow are distinct sibling CI anchors', () => {
    expect(typeof resolvePauseSessionReflectAndDecidePreflight).toBe('function');
    expect(typeof resolvePauseSessionReflectAndDecideAfterGeneration).toBe('function');
    expect(typeof formatReinforcementQuoteFromSession).toBe('function');
    expect(typeof resolvePauseDecideOutcomeFlow).toBe('function');
    expect(typeof runPauseOutcomeLog).toBe('function');
    expect(typeof showPauseOutcomeNotCompletedToast).toBe('function');
    expect(typeof buildPauseScoreImpacts).toBe('function');

    expect(typeof runReflectGeneration).toBe('function');
    expect(typeof resolveReflectGenerationPrefetch).toBe('function');
    expect(typeof openManualPauseFromHome).toBe('function');
    expect(typeof dismissOpenPauseHome).toBe('function');

    expect('runReflectGeneration' in flowsFlow).toBe(false);
    expect('openManualPauseFromHome' in flowsFlow).toBe(false);
    expect('dismissOpenPauseHome' in flowsFlow).toBe(false);
    expect('resolveReflectGenerationPrefetch' in flowsFlow).toBe(false);
    expect('resolvePauseSessionReflectAndDecidePreflight' in generationFlow).toBe(false);
    expect('resolvePauseSessionReflectAndDecideAfterGeneration' in generationFlow).toBe(false);
    expect('formatReinforcementQuoteFromSession' in generationFlow).toBe(false);
    expect('runPauseOutcomeLog' in generationFlow).toBe(false);
    expect('buildPauseScoreImpacts' in generationFlow).toBe(false);
  });

  it('flows umbrella exports stay off holzen-reflect generation and manual-open leaf use cases', () => {
    expect(resolvePauseSessionReflectAndDecidePreflight).not.toBe(runReflectGeneration);
    expect(resolvePauseSessionReflectAndDecideAfterGeneration).not.toBe(runReflectGeneration);
    expect(runPauseOutcomeLog).not.toBe(runReflectGeneration);
    expect(formatReinforcementQuoteFromSession).not.toBe(openManualPauseFromHome);
    expect(resolvePauseDecideOutcomeFlow).not.toBe(dismissOpenPauseHome);
    expect(buildPauseScoreImpacts).not.toBe(resolveReflectGenerationPrefetch);
    expect(showPauseOutcomeNotCompletedToast).not.toBe(openManualPauseFromHome);
  });

  it('generation umbrella exports stay off reflect+decide preflight and decide outcome helpers', () => {
    expect(runReflectGeneration).not.toBe(resolvePauseSessionReflectAndDecidePreflight);
    expect(runReflectGeneration).not.toBe(runPauseOutcomeLog);
    expect(openManualPauseFromHome).not.toBe(resolvePauseSessionReflectAndDecideAfterGeneration);
    expect(dismissOpenPauseHome).not.toBe(formatReinforcementQuoteFromSession);
    expect(resolveReflectGenerationPrefetch).not.toBe(resolvePauseDecideOutcomeFlow);
    expect(openManualPauseFromHome).not.toBe(showPauseOutcomeNotCompletedToast);
    expect(dismissOpenPauseHome).not.toBe(buildPauseScoreImpacts);
  });
});
