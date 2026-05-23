import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectPauseRepository' },
  supabaseReflectGenerator: { port: 'reflectGenerator' },
}));

import * as flowsIo from '@/features/pause/presentation/reflect/flows/pause-reflect-flows-io';
import {
  buildPauseScoreImpacts,
  formatReinforcementQuoteFromSession,
  pauseReflectOutcomeLog,
  pauseReflectOutcomeLogWithRepository,
  reflectPauseRepository,
  resolvePauseDecideOutcomeFlow,
  resolvePauseSessionReflectAndDecideAfterGeneration,
  resolvePauseSessionReflectAndDecidePreflight,
  showPauseOutcomeNotCompletedToast,
} from '@/features/pause/presentation/reflect/flows/pause-reflect-flows-io';
import * as generationIo from '@/features/pause/presentation/reflect/generation/pause-reflect-generation-io';
import {
  messageFromReflectGenerationResult,
  pauseReflectGeneration,
  reflectGenerationPrerequisite,
  reflectGenerator,
  resolveReflectGenerationPrefetch,
  runReflectGeneration,
  shouldCommitReflectGeneration,
} from '@/features/pause/presentation/reflect/generation/pause-reflect-generation-io';

/**
 * Application sibling parity: flows-io vs generation-io (parity with presentation
 * `pause-reflect-flows-generation-io-sibling-parity.test.ts` and flow-level
 * `pause-reflect-flows-generation-flow-sibling-parity.test.ts`; manual-open stays on
 * `pause-home-reflect-io`, not generation-io).
 * Reciprocal inline pins: `pause-reflect-flows-io-parity.test.ts` ↔
 * `pause-reflect-generation-io-parity.test.ts`.
 */
describe('pause-reflect-flows-io ↔ pause-reflect-generation-io sibling parity (application)', () => {
  it('flows-io and generation-io are distinct presentation I/O surfaces', () => {
    expect(typeof resolvePauseSessionReflectAndDecidePreflight).toBe('function');
    expect(typeof resolvePauseSessionReflectAndDecideAfterGeneration).toBe('function');
    expect(typeof formatReinforcementQuoteFromSession).toBe('function');
    expect(typeof resolvePauseDecideOutcomeFlow).toBe('function');
    expect(typeof pauseReflectOutcomeLog).toBe('function');
    expect(typeof buildPauseScoreImpacts).toBe('function');
    expect(typeof reflectPauseRepository).toBe('object');

    expect(typeof runReflectGeneration).toBe('function');
    expect(typeof pauseReflectGeneration).toBe('function');
    expect(typeof resolveReflectGenerationPrefetch).toBe('function');
    expect(typeof reflectGenerationPrerequisite).toBe('function');
    expect(typeof shouldCommitReflectGeneration).toBe('function');
    expect(typeof reflectGenerator).toBe('object');

    expect('runReflectGeneration' in flowsIo).toBe(false);
    expect('pauseReflectGeneration' in flowsIo).toBe(false);
    expect('reflectGenerator' in flowsIo).toBe(false);

    expect('resolvePauseSessionReflectAndDecidePreflight' in generationIo).toBe(false);
    expect('pauseReflectOutcomeLog' in generationIo).toBe(false);
    expect('buildPauseScoreImpacts' in generationIo).toBe(false);
    expect('formatReinforcementQuoteFromSession' in generationIo).toBe(false);
  });

  it('reflect+decide flows I/O keeps preflight and outcome helpers off holzen-reflect generation', () => {
    expect(resolvePauseSessionReflectAndDecidePreflight).not.toBe(runReflectGeneration);
    expect(resolvePauseSessionReflectAndDecideAfterGeneration).not.toBe(pauseReflectGeneration);
    expect(pauseReflectOutcomeLog).not.toBe(runReflectGeneration);
    expect(formatReinforcementQuoteFromSession).not.toBe(reflectGenerationPrerequisite);
    expect(resolvePauseDecideOutcomeFlow).not.toBe(resolveReflectGenerationPrefetch);
    expect(buildPauseScoreImpacts).not.toBe(shouldCommitReflectGeneration);
    expect(pauseReflectOutcomeLogWithRepository).not.toBe(pauseReflectGeneration);
    expect(showPauseOutcomeNotCompletedToast).not.toBe(messageFromReflectGenerationResult);
    expect(reflectPauseRepository).not.toBe(reflectGenerator);
  });

  it('generation I/O keeps holzen-reflect port off reflect+decide preflight and decide outcome', () => {
    expect(runReflectGeneration).not.toBe(resolvePauseSessionReflectAndDecidePreflight);
    expect(pauseReflectGeneration).not.toBe(resolvePauseSessionReflectAndDecideAfterGeneration);
    expect(reflectGenerationPrerequisite).not.toBe(pauseReflectOutcomeLog);
    expect(resolveReflectGenerationPrefetch).not.toBe(formatReinforcementQuoteFromSession);
    expect(shouldCommitReflectGeneration).not.toBe(buildPauseScoreImpacts);
    expect(messageFromReflectGenerationResult).not.toBe(resolvePauseDecideOutcomeFlow);
    expect(reflectGenerator).not.toBe(reflectPauseRepository);
  });
});
