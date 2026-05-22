import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectPauseRepository' },
}));

import {
  startPauseReflectFrameFocusAmbience,
  stopPauseReflectFrameFocusAmbience,
} from '@/features/pause/presentation/reflect/ambience/pause-reflect-ambience-io';
import * as ambienceIo from '@/features/pause/presentation/reflect/ambience/pause-reflect-ambience-io';
import {
  buildPauseScoreImpacts,
  formatReinforcementQuoteFromSession,
  getSessionQuote,
  pauseReflectOutcomeLog,
  pauseReflectOutcomeLogWithRepository,
  reflectPauseRepository,
  resolvePauseDecideOutcomeFlow,
  resolvePauseSessionReflectAndDecideAfterGeneration,
  resolvePauseSessionReflectAndDecidePreflight,
  showPauseOutcomeNotCompletedToast,
} from '@/features/pause/presentation/reflect/flows/pause-reflect-flows-io';
import * as flowsIo from '@/features/pause/presentation/reflect/flows/pause-reflect-flows-io';

/**
 * Application sibling parity: flows-io vs ambience-io (parity with presentation
 * `pause-reflect-flows-ambience-io-sibling-parity.test.ts`,
 * `pause-reflect-ambience-flows-io-sibling-parity.test.ts` under `ambience/`, and flow-level
 * `pause-reflect-flows-ambience-flow-sibling-parity.test.ts`).
 * Reciprocal inline pins: `pause-reflect-flows-io-parity.test.ts` ↔
 * `pause-reflect-ambience-io-parity.test.ts`.
 */
describe('pause-reflect-flows-io ↔ pause-reflect-ambience-io sibling parity (application)', () => {
  it('flows-io and ambience-io are distinct presentation I/O surfaces', () => {
    expect(typeof resolvePauseSessionReflectAndDecidePreflight).toBe('function');
    expect(typeof resolvePauseSessionReflectAndDecideAfterGeneration).toBe('function');
    expect(typeof formatReinforcementQuoteFromSession).toBe('function');
    expect(typeof resolvePauseDecideOutcomeFlow).toBe('function');
    expect(typeof getSessionQuote).toBe('function');
    expect(typeof buildPauseScoreImpacts).toBe('function');
    expect(typeof pauseReflectOutcomeLog).toBe('function');
    expect(typeof pauseReflectOutcomeLogWithRepository).toBe('function');
    expect(typeof showPauseOutcomeNotCompletedToast).toBe('function');
    expect(typeof reflectPauseRepository).toBe('object');

    expect(typeof startPauseReflectFrameFocusAmbience).toBe('function');
    expect(typeof stopPauseReflectFrameFocusAmbience).toBe('function');

    expect('startPauseReflectFrameFocusAmbience' in flowsIo).toBe(false);
    expect('stopPauseReflectFrameFocusAmbience' in flowsIo).toBe(false);
    expect('resolvePauseSessionReflectAndDecidePreflight' in ambienceIo).toBe(false);
    expect('resolvePauseSessionReflectAndDecideAfterGeneration' in ambienceIo).toBe(false);
    expect('formatReinforcementQuoteFromSession' in ambienceIo).toBe(false);
    expect('getSessionQuote' in ambienceIo).toBe(false);
    expect('pauseReflectOutcomeLog' in ambienceIo).toBe(false);
    expect('buildPauseScoreImpacts' in ambienceIo).toBe(false);
  });

  it('reflect+decide flows I/O keeps preflight and outcome helpers off frame-focus ambience bed', () => {
    expect(resolvePauseSessionReflectAndDecidePreflight).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(resolvePauseSessionReflectAndDecideAfterGeneration).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(pauseReflectOutcomeLog).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(formatReinforcementQuoteFromSession).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(resolvePauseDecideOutcomeFlow).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(buildPauseScoreImpacts).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(pauseReflectOutcomeLogWithRepository).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(showPauseOutcomeNotCompletedToast).not.toBe(stopPauseReflectFrameFocusAmbience);
  });

  it('frame-focus ambience I/O keeps Web Audio bed off reflect+decide preflight and decide outcome helpers', () => {
    expect(startPauseReflectFrameFocusAmbience).not.toBe(resolvePauseSessionReflectAndDecidePreflight);
    expect(stopPauseReflectFrameFocusAmbience).not.toBe(resolvePauseSessionReflectAndDecideAfterGeneration);
    expect(startPauseReflectFrameFocusAmbience).not.toBe(pauseReflectOutcomeLog);
    expect(stopPauseReflectFrameFocusAmbience).not.toBe(formatReinforcementQuoteFromSession);
    expect(startPauseReflectFrameFocusAmbience).not.toBe(resolvePauseDecideOutcomeFlow);
    expect(stopPauseReflectFrameFocusAmbience).not.toBe(buildPauseScoreImpacts);
    expect(startPauseReflectFrameFocusAmbience).not.toBe(pauseReflectOutcomeLogWithRepository);
    expect(stopPauseReflectFrameFocusAmbience).not.toBe(showPauseOutcomeNotCompletedToast);
    expect(startPauseReflectFrameFocusAmbience).not.toBe(reflectPauseRepository);
  });
});
