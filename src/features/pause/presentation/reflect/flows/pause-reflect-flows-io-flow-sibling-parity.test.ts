import { describe, expect, it, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {}
}));

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectPauseRepository' }
}));

import {
  buildPauseScoreImpacts,
  parseScoreImpactVolatilityPct,
  resolvePauseDecideOutcomeFlow,
  resolvePauseSessionReflectAndDecideAfterGeneration,
  resolvePauseSessionReflectAndDecidePreflight,
  resolveScoreImpactDisplayImpacts,
  resolveScoreImpactViewMode,
  runPauseOutcomeLog,
  scoreImpactMotionDelaySec,
  showPauseOutcomeNotCompletedToast,
  showPauseOutcomeSaveFailedToast
} from '@/features/pause/application/use-cases/ritual/reflect/flows/pause-reflect-flows-flow';
import * as flowsFlow from '@/features/pause/application/use-cases/ritual/reflect/flows/pause-reflect-flows-flow';
import {
  buildPauseScoreImpacts as buildImpactsFromFlowsIo,
  parseScoreImpactVolatilityPct as parseVolatilityFromFlowsIo,
  pauseReflectOutcomeLog,
  pauseReflectOutcomeLogWithRepository,
  reflectPauseRepository,
  resolvePauseDecideOutcomeFlow as resolveOutcomeFromFlowsIo,
  resolvePauseSessionReflectAndDecideAfterGeneration as resolveAfterGenFromFlowsIo,
  resolvePauseSessionReflectAndDecidePreflight as resolvePreflightFromFlowsIo,
  resolveScoreImpactDisplayImpacts as resolveDisplayImpactsFromFlowsIo,
  resolveScoreImpactViewMode as resolveViewModeFromFlowsIo,
  scoreImpactMotionDelaySec as motionDelayFromFlowsIo,
  showPauseOutcomeNotCompletedToast as showNotCompletedFromFlowsIo,
  showPauseOutcomeSaveFailedToast as showSaveFailedFromFlowsIo
} from './pause-reflect-flows-io';
import * as flowsIo from './pause-reflect-flows-io';

/**
 * Presentation sibling parity: flows-io port-bound wrappers vs flows-flow CI umbrella.
 * Complements colocated `pause-reflect-flows-flow-io-wrapper-sibling-parity.test.ts` (wrapper export pins).
 * Mirrors application `pause-reflect-flows-io-flow-sibling-parity.test.ts`
 * (colocated beside `pause-reflect-flows-flow.ts`).
 */
describe('pause-reflect-flows-io ↔ pause-reflect-flows-flow sibling parity (presentation)', () => {
  it('flows-io and flows-flow are distinct presentation I/O vs application CI surfaces', () => {
    expect(typeof resolvePreflightFromFlowsIo).toBe('function');
    expect(typeof pauseReflectOutcomeLog).toBe('function');
    expect(typeof reflectPauseRepository).toBe('object');

    expect(typeof resolvePauseSessionReflectAndDecidePreflight).toBe('function');
    expect(typeof runPauseOutcomeLog).toBe('function');

    expect('pauseReflectOutcomeLog' in flowsIo).toBe(true);
    expect('pauseReflectOutcomeLogWithRepository' in flowsIo).toBe(true);
    expect('reflectPauseRepository' in flowsIo).toBe(true);

    expect('pauseReflectOutcomeLog' in flowsFlow).toBe(false);
    expect('pauseReflectOutcomeLogWithRepository' in flowsFlow).toBe(false);
    expect('reflectPauseRepository' in flowsFlow).toBe(false);
  });

  it('presentation flows-io reflect+decide bindings match flows CI umbrella', () => {
    expect(resolvePreflightFromFlowsIo).toBe(resolvePauseSessionReflectAndDecidePreflight);
    expect(resolveAfterGenFromFlowsIo).toBe(resolvePauseSessionReflectAndDecideAfterGeneration);
    expect(resolveOutcomeFromFlowsIo).toBe(resolvePauseDecideOutcomeFlow);
    expect(buildImpactsFromFlowsIo).toBe(buildPauseScoreImpacts);
    expect(parseVolatilityFromFlowsIo).toBe(parseScoreImpactVolatilityPct);
    expect(resolveDisplayImpactsFromFlowsIo).toBe(resolveScoreImpactDisplayImpacts);
    expect(resolveViewModeFromFlowsIo).toBe(resolveScoreImpactViewMode);
    expect(motionDelayFromFlowsIo).toBe(scoreImpactMotionDelaySec);
    expect(showNotCompletedFromFlowsIo).toBe(showPauseOutcomeNotCompletedToast);
    expect(showSaveFailedFromFlowsIo).toBe(showPauseOutcomeSaveFailedToast);
  });

  it('presentation outcome RPC wrappers stay off flows-flow leaf re-export', () => {
    expect(pauseReflectOutcomeLog).not.toBe(runPauseOutcomeLog);
    expect(pauseReflectOutcomeLogWithRepository).not.toBe(runPauseOutcomeLog);
    expect(pauseReflectOutcomeLog).not.toBe(pauseReflectOutcomeLogWithRepository);
    expect(resolvePreflightFromFlowsIo).not.toBe(pauseReflectOutcomeLog);
    expect(resolvePreflightFromFlowsIo).not.toBe(pauseReflectOutcomeLogWithRepository);
    expect(reflectPauseRepository).not.toBe(runPauseOutcomeLog);
  });

  it('flows-flow CI umbrella re-exports runPauseOutcomeLog without presentation port wrappers', () => {
    expect(runPauseOutcomeLog).not.toBe(pauseReflectOutcomeLog);
    expect(runPauseOutcomeLog).not.toBe(pauseReflectOutcomeLogWithRepository);
    expect(resolvePauseSessionReflectAndDecidePreflight).not.toBe(pauseReflectOutcomeLog);
    expect(buildPauseScoreImpacts).not.toBe(reflectPauseRepository);
  });
});
