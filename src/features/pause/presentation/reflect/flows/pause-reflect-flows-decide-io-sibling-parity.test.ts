import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectPauseRepository' },
}));

import * as decideIo from '@/features/pause/presentation/session/pause-session-decide-io';
import {
  buildPauseScoreImpacts,
  formatReinforcementQuoteFromSession,
  getSessionQuote,
  pauseReflectOutcomeLog,
  pauseReflectOutcomeLogWithRepository,
  reflectPauseRepository,
  resolvePauseDecideOutcomeFlow,
  resolvePauseSessionReflectAndDecidePreflight,
} from './pause-reflect-flows-io';
import * as flowsIo from './pause-reflect-flows-io';

describe('pause-reflect-flows-io ↔ pause-session-decide-io sibling parity', () => {
  it('flows-io and session decide-io are distinct presentation I/O surfaces', () => {
    expect(typeof resolvePauseSessionReflectAndDecidePreflight).toBe('function');
    expect(typeof formatReinforcementQuoteFromSession).toBe('function');
    expect(typeof resolvePauseDecideOutcomeFlow).toBe('function');
    expect(typeof getSessionQuote).toBe('function');
    expect(typeof buildPauseScoreImpacts).toBe('function');
    expect(typeof pauseReflectOutcomeLog).toBe('function');
    expect(typeof pauseReflectOutcomeLogWithRepository).toBe('function');
    expect(typeof reflectPauseRepository).toBe('object');

    expect(Object.keys(decideIo)).toEqual([]);
    expect('pauseReflectOutcomeLog' in decideIo).toBe(false);
    expect('resolvePauseSessionReflectAndDecidePreflight' in decideIo).toBe(false);
    expect('reflectPauseRepository' in decideIo).toBe(false);
    expect('initialDecisionFromRestored' in flowsIo).toBe(false);
    expect('initialPhaseFromRestored' in flowsIo).toBe(false);
  });

  it('reflect+decide flows I/O keeps outcome RPC wrappers off decide-io type-only peel', () => {
    expect(typeof pauseReflectOutcomeLog).toBe('function');
    expect(typeof pauseReflectOutcomeLogWithRepository).toBe('function');
    expect(pauseReflectOutcomeLog).not.toBe(pauseReflectOutcomeLogWithRepository);
    expect(resolvePauseSessionReflectAndDecidePreflight).not.toBe(
      resolvePauseDecideOutcomeFlow,
    );
    expect(formatReinforcementQuoteFromSession).not.toBe(getSessionQuote);
    expect(buildPauseScoreImpacts).not.toBe(reflectPauseRepository);
  });
});
