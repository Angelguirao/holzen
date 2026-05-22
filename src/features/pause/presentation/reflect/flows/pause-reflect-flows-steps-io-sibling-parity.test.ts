import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectPauseRepository' },
  reflectionStepSessionStorage: { storage: 'reflectionStepSessionStorage' },
}));

import * as stepsIo from '@/features/pause/presentation/reflect/steps/pause-reflect-steps-io';
import {
  buildPauseScoreImpacts,
  formatReinforcementQuoteFromSession,
  getSessionQuote,
  pauseReflectOutcomeLog,
  pauseReflectOutcomeLogWithRepository,
  reflectPauseRepository as flowsReflectPauseRepository,
  resolvePauseDecideOutcomeFlow,
  resolvePauseSessionReflectAndDecideAfterGeneration,
  resolvePauseSessionReflectAndDecidePreflight,
  showPauseOutcomeNotCompletedToast,
  showPauseOutcomeSaveFailedToast,
} from './pause-reflect-flows-io';
import * as flowsIo from './pause-reflect-flows-io';
import {
  pauseReflectFavoriteToggle,
  pauseReflectNoteUpdate,
  pauseReflectNoteUpdateWithRepository,
  pauseReflectTagUpdate,
  pauseReflectTagUpdateWithRepository,
  pauseReflectionStepLogOnce,
  pauseReflectFavoriteToggleWithRepository,
  pauseReflectionStepLogOnceWithRepository,
  reflectPauseRepository as stepsReflectPauseRepository,
  shouldLogPauseReflectionStep,
  shouldShowFavoriteProHint,
} from '@/features/pause/presentation/reflect/steps/pause-reflect-steps-io';

describe('pause-reflect-flows-io ↔ pause-reflect-steps-io sibling parity', () => {
  it('flows-io and steps-io are distinct presentation I/O surfaces', () => {
    expect(typeof resolvePauseSessionReflectAndDecidePreflight).toBe('function');
    expect(typeof resolvePauseSessionReflectAndDecideAfterGeneration).toBe('function');
    expect(typeof formatReinforcementQuoteFromSession).toBe('function');
    expect(typeof resolvePauseDecideOutcomeFlow).toBe('function');
    expect(typeof getSessionQuote).toBe('function');
    expect(typeof buildPauseScoreImpacts).toBe('function');
    expect(typeof pauseReflectOutcomeLog).toBe('function');
    expect(typeof pauseReflectOutcomeLogWithRepository).toBe('function');
    expect(typeof showPauseOutcomeNotCompletedToast).toBe('function');
    expect(typeof showPauseOutcomeSaveFailedToast).toBe('function');

    expect(typeof pauseReflectFavoriteToggle).toBe('function');
    expect(typeof pauseReflectNoteUpdate).toBe('function');
    expect(typeof pauseReflectTagUpdate).toBe('function');
    expect(typeof pauseReflectionStepLogOnce).toBe('function');
    expect(typeof shouldShowFavoriteProHint).toBe('function');
    expect(typeof shouldLogPauseReflectionStep).toBe('function');

    expect('pauseReflectFavoriteToggle' in flowsIo).toBe(false);
    expect('pauseReflectNoteUpdate' in flowsIo).toBe(false);
    expect('pauseReflectTagUpdate' in flowsIo).toBe(false);
    expect('pauseReflectionStepLogOnce' in flowsIo).toBe(false);
    expect('shouldShowFavoriteProHint' in flowsIo).toBe(false);
    expect('shouldLogPauseReflectionStep' in flowsIo).toBe(false);

    expect('pauseReflectOutcomeLog' in stepsIo).toBe(false);
    expect('pauseReflectOutcomeLogWithRepository' in stepsIo).toBe(false);
    expect('resolvePauseSessionReflectAndDecidePreflight' in stepsIo).toBe(false);
    expect('resolvePauseSessionReflectAndDecideAfterGeneration' in stepsIo).toBe(false);
    expect('formatReinforcementQuoteFromSession' in stepsIo).toBe(false);
    expect('resolvePauseDecideOutcomeFlow' in stepsIo).toBe(false);
    expect('getSessionQuote' in stepsIo).toBe(false);
    expect('buildPauseScoreImpacts' in stepsIo).toBe(false);
    expect('showPauseOutcomeNotCompletedToast' in stepsIo).toBe(false);
    expect('showPauseOutcomeSaveFailedToast' in stepsIo).toBe(false);
  });

  it('shared reflectPauseRepository binding does not merge step vs flows RPC wrappers', () => {
    expect(flowsReflectPauseRepository).toBe(stepsReflectPauseRepository);
    expect(pauseReflectFavoriteToggle).not.toBe(pauseReflectOutcomeLog);
    expect(pauseReflectNoteUpdate).not.toBe(pauseReflectOutcomeLogWithRepository);
    expect(pauseReflectTagUpdate).not.toBe(resolvePauseSessionReflectAndDecidePreflight);
    expect(pauseReflectionStepLogOnce).not.toBe(resolvePauseSessionReflectAndDecideAfterGeneration);
    expect(shouldShowFavoriteProHint).not.toBe(formatReinforcementQuoteFromSession);
    expect(shouldLogPauseReflectionStep).not.toBe(resolvePauseDecideOutcomeFlow);
    expect(pauseReflectFavoriteToggle).not.toBe(getSessionQuote);
    expect(pauseReflectNoteUpdate).not.toBe(buildPauseScoreImpacts);
    expect(pauseReflectTagUpdate).not.toBe(showPauseOutcomeNotCompletedToast);
    expect(pauseReflectionStepLogOnce).not.toBe(showPauseOutcomeSaveFailedToast);
  });

  it('note and tag step RPC wrappers stay distinct on steps-io (parity with steps-io-parity)', () => {
    expect(pauseReflectNoteUpdate).not.toBe(pauseReflectTagUpdate);
    expect(pauseReflectNoteUpdateWithRepository).not.toBe(pauseReflectTagUpdateWithRepository);
    expect(pauseReflectNoteUpdate).not.toBe(pauseReflectFavoriteToggle);
    expect(pauseReflectTagUpdate).not.toBe(pauseReflectionStepLogOnce);
    expect(pauseReflectNoteUpdate).not.toBe(pauseReflectOutcomeLog);
    expect(pauseReflectTagUpdate).not.toBe(pauseReflectOutcomeLogWithRepository);
    // Full pins: `pause-reflect-steps-note-tag-io-sibling-parity.test.ts`.
  });
});
