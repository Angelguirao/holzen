import { describe, expect, it } from 'vitest';

import {
  buildFeelTilesMoodLogOptions,
  runInitialEmotionSelect,
  runInitialEmotionSkip,
} from '@/features/pause/application/use-cases/ritual/feel/pause-feel-flow';
import * as moodFlow from '@/features/pause/application/use-cases/ritual/feel/pause-feel-flow';
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
} from '@/features/pause/application/use-cases/ritual/reflect/flows/pause-reflect-flows-flow';
import * as flowsFlow from '@/features/pause/application/use-cases/ritual/reflect/flows/pause-reflect-flows-flow';

/**
 * Presentation mirror of application flow sibling parity (CI anchors only — production I/O
 * uses `pause-reflect-flows-io` / `pause-feel-io` leaf bindings).
 * Application source: `application/.../flows/pause-reflect-flows-feel-flow-sibling-parity.test.ts`.
 * I/O sibling: `pause-reflect-flows-feel-io-sibling-parity.test.ts` (application + presentation).
 */
describe('pause-reflect-flows-flow ↔ pause-feel-flow sibling parity (presentation)', () => {
  it('flows-flow and mood-flow are distinct sibling CI anchors', () => {
    expect(typeof resolvePauseSessionReflectAndDecidePreflight).toBe('function');
    expect(typeof resolvePauseSessionReflectAndDecideAfterGeneration).toBe('function');
    expect(typeof formatReinforcementQuoteFromSession).toBe('function');
    expect(typeof resolvePauseDecideOutcomeFlow).toBe('function');
    expect(typeof getSessionQuote).toBe('function');
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
    expect('formatReinforcementQuoteFromSession' in moodFlow).toBe(false);
    expect('resolvePauseDecideOutcomeFlow' in moodFlow).toBe(false);
    expect('runPauseOutcomeLog' in moodFlow).toBe(false);
    expect('getSessionQuote' in moodFlow).toBe(false);
  });

  it('flows umbrella exports stay off initial-emotion RPC and feel-tile helpers', () => {
    expect(resolvePauseSessionReflectAndDecidePreflight).not.toBe(runInitialEmotionSelect);
    expect(resolvePauseSessionReflectAndDecideAfterGeneration).not.toBe(runInitialEmotionSkip);
    expect(runPauseOutcomeLog).not.toBe(runInitialEmotionSelect);
    expect(formatReinforcementQuoteFromSession).not.toBe(buildFeelTilesMoodLogOptions);
    expect(resolvePauseDecideOutcomeFlow).not.toBe(runInitialEmotionSkip);
    expect(buildPauseScoreImpacts).not.toBe(buildFeelTilesMoodLogOptions);
  });

  it('mood umbrella exports stay off reflect+decide preflight and decide outcome helpers', () => {
    expect(runInitialEmotionSelect).not.toBe(resolvePauseSessionReflectAndDecidePreflight);
    expect(runInitialEmotionSkip).not.toBe(resolvePauseSessionReflectAndDecideAfterGeneration);
    expect(runInitialEmotionSelect).not.toBe(runPauseOutcomeLog);
    expect(buildFeelTilesMoodLogOptions).not.toBe(formatReinforcementQuoteFromSession);
    expect(runInitialEmotionSkip).not.toBe(resolvePauseDecideOutcomeFlow);
    expect(buildFeelTilesMoodLogOptions).not.toBe(showPauseOutcomeNotCompletedToast);
    expect(runInitialEmotionSelect).not.toBe(getSessionQuote);
  });
});
