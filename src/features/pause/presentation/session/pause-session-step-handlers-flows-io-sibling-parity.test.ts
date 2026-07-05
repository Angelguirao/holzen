import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectPauseRepository' }
}));

import * as handlersIo from './pause-session-step-handlers-io';
import {
  buildPauseSessionStepRitualBundle,
  buildPauseSessionStepShellBundle
} from './pause-session-step-handlers-io';
import * as flowsIo from '@/features/pause/presentation/reflect/flows/pause-reflect-flows-io';
import {
  buildPauseScoreImpacts,
  pauseReflectOutcomeLog,
  pauseReflectOutcomeLogWithRepository,
  reflectPauseRepository,
  resolvePauseDecideOutcomeFlow,
  resolvePauseSessionReflectAndDecideAfterGeneration,
  resolvePauseSessionReflectAndDecidePreflight,
  showPauseOutcomeNotCompletedToast,
  showPauseOutcomeSaveFailedToast
} from '@/features/pause/presentation/reflect/flows/pause-reflect-flows-io';

/**
 * Cross-surface presentation parity: session step-handlers-io vs reflect flows-io.
 * Session Framer bundle builders stay distinct from reflect+decide outcome port wrappers (parity with
 * step-handlers ↔ steps-io cross-surface; complements reciprocal inline pins on unit tests).
 */
describe('pause-session-step-handlers-io ↔ pause-reflect-flows-io sibling parity', () => {
  it('step-handlers-io and flows-io are distinct presentation I/O surfaces', () => {
    expect(typeof buildPauseSessionStepShellBundle).toBe('function');
    expect(typeof buildPauseSessionStepRitualBundle).toBe('function');

    expect(typeof pauseReflectOutcomeLog).toBe('function');
    expect(typeof pauseReflectOutcomeLogWithRepository).toBe('function');
    expect(typeof resolvePauseSessionReflectAndDecidePreflight).toBe('function');
    expect(typeof resolvePauseSessionReflectAndDecideAfterGeneration).toBe('function');
    expect(typeof reflectPauseRepository).toBe('object');

    expect('buildPauseSessionStepShellBundle' in flowsIo).toBe(false);
    expect('buildPauseSessionStepRitualBundle' in flowsIo).toBe(false);
    expect('pauseReflectOutcomeLog' in handlersIo).toBe(false);
    expect('pauseReflectOutcomeLogWithRepository' in handlersIo).toBe(false);
    expect('reflectPauseRepository' in handlersIo).toBe(false);
  });

  it('session step bundle builders stay off reflect+decide flows I/O', () => {
    expect(buildPauseSessionStepShellBundle).not.toBe(pauseReflectOutcomeLog);
    expect(buildPauseSessionStepRitualBundle).not.toBe(pauseReflectOutcomeLogWithRepository);
    expect(buildPauseSessionStepShellBundle).not.toBe(resolvePauseSessionReflectAndDecidePreflight);
    expect(buildPauseSessionStepRitualBundle).not.toBe(resolvePauseSessionReflectAndDecideAfterGeneration);
    expect(buildPauseSessionStepShellBundle).not.toBe(buildPauseScoreImpacts);
    expect(buildPauseSessionStepRitualBundle).not.toBe(resolvePauseDecideOutcomeFlow);
    expect(buildPauseSessionStepShellBundle).not.toBe(showPauseOutcomeNotCompletedToast);
    expect(buildPauseSessionStepRitualBundle).not.toBe(showPauseOutcomeSaveFailedToast);
    expect(buildPauseSessionStepShellBundle).not.toBe(reflectPauseRepository);
  });

  it('reflect+decide flows I/O stays off session step bundle builders', () => {
    expect(pauseReflectOutcomeLog).not.toBe(buildPauseSessionStepShellBundle);
    expect(pauseReflectOutcomeLogWithRepository).not.toBe(buildPauseSessionStepRitualBundle);
    expect(resolvePauseSessionReflectAndDecidePreflight).not.toBe(buildPauseSessionStepShellBundle);
    expect(resolvePauseSessionReflectAndDecideAfterGeneration).not.toBe(buildPauseSessionStepRitualBundle);
    expect(buildPauseScoreImpacts).not.toBe(buildPauseSessionStepShellBundle);
    expect(resolvePauseDecideOutcomeFlow).not.toBe(buildPauseSessionStepRitualBundle);
    expect(showPauseOutcomeNotCompletedToast).not.toBe(buildPauseSessionStepShellBundle);
    expect(showPauseOutcomeSaveFailedToast).not.toBe(buildPauseSessionStepRitualBundle);
  });
});
