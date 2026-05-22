import { describe, expect, it } from 'vitest';

import {
  startPauseReflectFrameFocusAmbience,
  stopPauseReflectFrameFocusAmbience,
} from '@/features/pause/application/use-cases/ritual/reflect/ambience/pause-reflect-ambience-flow';
import * as ambienceFlow from '@/features/pause/application/use-cases/ritual/reflect/ambience/pause-reflect-ambience-flow';
import {
  buildPauseScoreImpacts,
  formatReinforcementQuoteFromSession,
  resolvePauseDecideOutcomeFlow,
  resolvePauseSessionReflectAndDecideAfterGeneration,
  resolvePauseSessionReflectAndDecidePreflight,
  runPauseOutcomeLog,
  showPauseOutcomeNotCompletedToast,
} from '@/features/pause/application/use-cases/ritual/reflect/flows/pause-reflect-flows-flow';
import * as flowsFlow from '@/features/pause/application/use-cases/ritual/reflect/flows/pause-reflect-flows-flow';

/**
 * Presentation mirror of application flow sibling parity (CI anchors only — production I/O
 * uses `pause-reflect-flows-io` / `pause-reflect-ambience-io` leaf bindings).
 * Application source: `application/.../flows/pause-reflect-flows-ambience-flow-sibling-parity.test.ts`.
 * I/O sibling: `pause-reflect-flows-ambience-io-sibling-parity.test.ts` (application + presentation).
 */
describe('pause-reflect-flows-flow ↔ pause-reflect-ambience-flow sibling parity (presentation)', () => {
  it('flows-flow and ambience-flow are distinct sibling CI anchors', () => {
    expect(typeof resolvePauseSessionReflectAndDecidePreflight).toBe('function');
    expect(typeof resolvePauseSessionReflectAndDecideAfterGeneration).toBe('function');
    expect(typeof formatReinforcementQuoteFromSession).toBe('function');
    expect(typeof resolvePauseDecideOutcomeFlow).toBe('function');
    expect(typeof runPauseOutcomeLog).toBe('function');
    expect(typeof showPauseOutcomeNotCompletedToast).toBe('function');
    expect(typeof buildPauseScoreImpacts).toBe('function');

    expect(typeof startPauseReflectFrameFocusAmbience).toBe('function');
    expect(typeof stopPauseReflectFrameFocusAmbience).toBe('function');

    expect('startPauseReflectFrameFocusAmbience' in flowsFlow).toBe(false);
    expect('stopPauseReflectFrameFocusAmbience' in flowsFlow).toBe(false);
    expect('resolvePauseSessionReflectAndDecidePreflight' in ambienceFlow).toBe(false);
    expect('resolvePauseSessionReflectAndDecideAfterGeneration' in ambienceFlow).toBe(false);
    expect('formatReinforcementQuoteFromSession' in ambienceFlow).toBe(false);
    expect('runPauseOutcomeLog' in ambienceFlow).toBe(false);
    expect('buildPauseScoreImpacts' in ambienceFlow).toBe(false);
  });

  it('flows umbrella exports stay off frame-focus ambience bed helpers', () => {
    expect(resolvePauseSessionReflectAndDecidePreflight).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(resolvePauseSessionReflectAndDecideAfterGeneration).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(runPauseOutcomeLog).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(formatReinforcementQuoteFromSession).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(resolvePauseDecideOutcomeFlow).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(buildPauseScoreImpacts).not.toBe(stopPauseReflectFrameFocusAmbience);
  });

  it('ambience umbrella exports stay off reflect+decide preflight and decide outcome helpers', () => {
    expect(startPauseReflectFrameFocusAmbience).not.toBe(resolvePauseSessionReflectAndDecidePreflight);
    expect(stopPauseReflectFrameFocusAmbience).not.toBe(resolvePauseSessionReflectAndDecideAfterGeneration);
    expect(startPauseReflectFrameFocusAmbience).not.toBe(runPauseOutcomeLog);
    expect(stopPauseReflectFrameFocusAmbience).not.toBe(formatReinforcementQuoteFromSession);
    expect(startPauseReflectFrameFocusAmbience).not.toBe(resolvePauseDecideOutcomeFlow);
    expect(stopPauseReflectFrameFocusAmbience).not.toBe(buildPauseScoreImpacts);
  });
});
