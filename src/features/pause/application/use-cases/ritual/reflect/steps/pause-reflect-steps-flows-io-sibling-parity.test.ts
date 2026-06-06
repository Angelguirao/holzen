import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectPauseRepository' },
  reflectionStepSessionStorage: { storage: 'reflectionStepSessionStorage' }
}));

import * as flowsIo from '@/features/pause/presentation/reflect/flows/pause-reflect-flows-io';
import {
  buildPauseScoreImpacts,
  pauseReflectOutcomeLog,
  pauseReflectOutcomeLogWithRepository,
  reflectPauseRepository as flowsReflectPauseRepository,
  resolvePauseDecideOutcomeFlow,
  resolvePauseSessionReflectAndDecideAfterGeneration,
  resolvePauseSessionReflectAndDecidePreflight,
  showPauseOutcomeNotCompletedToast,
  showPauseOutcomeSaveFailedToast
} from '@/features/pause/presentation/reflect/flows/pause-reflect-flows-io';
import * as stepsIo from '@/features/pause/presentation/reflect/steps/pause-reflect-steps-io';
import {
  pauseReflectFavoriteToggle,
  pauseReflectNoteUpdate,
  pauseReflectNoteUpdateWithRepository,
  pauseReflectTagUpdate,
  pauseReflectTagUpdateWithRepository,
  pauseReflectionStepLogOnce,
  pauseReflectionStepLogOnceWithRepository,
  pauseReflectFavoriteToggleWithRepository,
  reflectPauseRepository as stepsReflectPauseRepository,
  shouldLogPauseReflectionStep,
  shouldShowFavoriteProHint
} from '@/features/pause/presentation/reflect/steps/pause-reflect-steps-io';

/**
 * Application-layer sibling parity colocated under steps/ (parity with
 * `pause-reflect-steps-flows-flow-sibling-parity.test.ts`, presentation
 * `pause-reflect-steps-flows-io-sibling-parity.test.ts`, and flows-colocated
 * `pause-reflect-flows-steps-io-sibling-parity.test.ts`; complements reciprocal
 * inline pins on `pause-reflect-steps-io-parity.test.ts` ↔ `pause-reflect-flows-io-parity.test.ts`).
 */
describe('pause-reflect-steps-io ↔ pause-reflect-flows-io sibling parity (application)', () => {
  it('steps-io and flows-io are distinct presentation I/O surfaces', () => {
    expect(typeof pauseReflectFavoriteToggle).toBe('function');
    expect(typeof pauseReflectNoteUpdate).toBe('function');
    expect(typeof pauseReflectTagUpdate).toBe('function');
    expect(typeof pauseReflectionStepLogOnce).toBe('function');
    expect(typeof shouldShowFavoriteProHint).toBe('function');
    expect(typeof shouldLogPauseReflectionStep).toBe('function');

    expect(typeof resolvePauseSessionReflectAndDecidePreflight).toBe('function');
    expect(typeof resolvePauseSessionReflectAndDecideAfterGeneration).toBe('function');
    expect(typeof resolvePauseDecideOutcomeFlow).toBe('function');
    expect(typeof buildPauseScoreImpacts).toBe('function');
    expect(typeof pauseReflectOutcomeLog).toBe('function');
    expect(typeof pauseReflectOutcomeLogWithRepository).toBe('function');
    expect(typeof showPauseOutcomeNotCompletedToast).toBe('function');
    expect(typeof showPauseOutcomeSaveFailedToast).toBe('function');

    expect('pauseReflectOutcomeLog' in stepsIo).toBe(false);
    expect('resolvePauseSessionReflectAndDecidePreflight' in stepsIo).toBe(false);
    expect('buildPauseScoreImpacts' in stepsIo).toBe(false);

    expect('pauseReflectFavoriteToggle' in flowsIo).toBe(false);
    expect('pauseReflectNoteUpdate' in flowsIo).toBe(false);
    expect('pauseReflectTagUpdate' in flowsIo).toBe(false);
    expect('pauseReflectionStepLogOnce' in flowsIo).toBe(false);
    expect('shouldShowFavoriteProHint' in flowsIo).toBe(false);
    expect('shouldLogPauseReflectionStep' in flowsIo).toBe(false);
  });

  it('shared reflectPauseRepository binding does not merge step vs flows RPC wrappers', () => {
    expect(flowsReflectPauseRepository).toBe(stepsReflectPauseRepository);
    expect(pauseReflectFavoriteToggle).not.toBe(pauseReflectOutcomeLog);
    expect(pauseReflectNoteUpdate).not.toBe(pauseReflectOutcomeLogWithRepository);
    expect(pauseReflectTagUpdate).not.toBe(resolvePauseSessionReflectAndDecidePreflight);
    expect(pauseReflectionStepLogOnce).not.toBe(resolvePauseSessionReflectAndDecideAfterGeneration);
    expect(shouldLogPauseReflectionStep).not.toBe(resolvePauseDecideOutcomeFlow);
    expect(pauseReflectNoteUpdate).not.toBe(buildPauseScoreImpacts);
    expect(pauseReflectTagUpdate).not.toBe(showPauseOutcomeNotCompletedToast);
    expect(pauseReflectionStepLogOnce).not.toBe(showPauseOutcomeSaveFailedToast);
  });

  it('note and tag step RPC wrappers stay distinct from decide outcome helpers', () => {
    expect(pauseReflectNoteUpdate).not.toBe(pauseReflectTagUpdate);
    expect(pauseReflectNoteUpdateWithRepository).not.toBe(pauseReflectTagUpdateWithRepository);
    expect(pauseReflectNoteUpdate).not.toBe(pauseReflectFavoriteToggle);
    expect(pauseReflectTagUpdate).not.toBe(pauseReflectionStepLogOnce);
    expect(pauseReflectNoteUpdateWithRepository).not.toBe(pauseReflectFavoriteToggleWithRepository);
    expect(pauseReflectTagUpdateWithRepository).not.toBe(pauseReflectionStepLogOnceWithRepository);
    expect(pauseReflectNoteUpdate).not.toBe(pauseReflectOutcomeLog);
    expect(pauseReflectTagUpdate).not.toBe(pauseReflectOutcomeLogWithRepository);
    // Full pins: presentation `pause-reflect-steps-note-tag-io-sibling-parity.test.ts`.
  });
});
