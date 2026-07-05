import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectPauseRepository' }
}));

import * as flowsIo from './pause-reflect-flows-io';
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
} from './pause-reflect-flows-io';
import * as moodIo from '@/features/pause/presentation/feel/pause-feel-io';
import {
  buildFeelTilesMoodLogOptions,
  pauseInitialEmotionSelect,
  pauseInitialEmotionSelectWithRepository,
  pauseInitialEmotionSkip,
  pauseInitialEmotionSkipWithRepository,
  reflectPauseRepository as moodReflectPauseRepository,
  resolvePauseSessionChromeCloseAction
} from '@/features/pause/presentation/feel/pause-feel-io';

/**
 * Presentation sibling parity: flows-io vs mood-io (parity with application
 * `pause-reflect-flows-feel-flow-sibling-parity.test.ts`,
 * `pause-reflect-flows-feel-io-sibling-parity.test.ts` under `application/.../flows/`, and
 * `pause-reflect-generation-feel-io-sibling-parity.test.ts`; complements
 * reciprocal inline pins on `pause-reflect-flows-io.test.ts` and
 * `pause-feel-io.test.ts`).
 */
describe('pause-reflect-flows-io ↔ pause-feel-io sibling parity', () => {
  it('flows-io and mood-io are distinct presentation I/O surfaces', () => {
    expect(typeof resolvePauseSessionReflectAndDecidePreflight).toBe('function');
    expect(typeof resolvePauseSessionReflectAndDecideAfterGeneration).toBe('function');
    expect(typeof resolvePauseDecideOutcomeFlow).toBe('function');
    expect(typeof buildPauseScoreImpacts).toBe('function');
    expect(typeof pauseReflectOutcomeLog).toBe('function');
    expect(typeof pauseReflectOutcomeLogWithRepository).toBe('function');
    expect(typeof showPauseOutcomeNotCompletedToast).toBe('function');
    expect(typeof showPauseOutcomeSaveFailedToast).toBe('function');
    expect(typeof flowsReflectPauseRepository).toBe('object');

    expect(typeof pauseInitialEmotionSelect).toBe('function');
    expect(typeof pauseInitialEmotionSkip).toBe('function');
    expect(typeof pauseInitialEmotionSelectWithRepository).toBe('function');
    expect(typeof pauseInitialEmotionSkipWithRepository).toBe('function');
    expect(typeof buildFeelTilesMoodLogOptions).toBe('function');
    expect(typeof resolvePauseSessionChromeCloseAction).toBe('function');
    expect(typeof moodReflectPauseRepository).toBe('object');

    expect('pauseInitialEmotionSelect' in flowsIo).toBe(false);
    expect('pauseInitialEmotionSkip' in flowsIo).toBe(false);
    expect('buildFeelTilesMoodLogOptions' in flowsIo).toBe(false);
    expect('resolvePauseSessionChromeCloseAction' in flowsIo).toBe(false);

    expect('pauseReflectOutcomeLog' in moodIo).toBe(false);
    expect('pauseReflectOutcomeLogWithRepository' in moodIo).toBe(false);
    expect('resolvePauseSessionReflectAndDecidePreflight' in moodIo).toBe(false);
    expect('resolvePauseSessionReflectAndDecideAfterGeneration' in moodIo).toBe(false);
    expect('resolvePauseDecideOutcomeFlow' in moodIo).toBe(false);
    expect('buildPauseScoreImpacts' in moodIo).toBe(false);
    expect('showPauseOutcomeNotCompletedToast' in moodIo).toBe(false);
    expect('showPauseOutcomeSaveFailedToast' in moodIo).toBe(false);
  });

  it('reflect+decide flows I/O keeps outcome RPC wrappers off initial-emotion mood helpers', () => {
    expect(pauseReflectOutcomeLog).not.toBe(pauseInitialEmotionSelect);
    expect(pauseReflectOutcomeLogWithRepository).not.toBe(pauseInitialEmotionSkip);
    expect(resolvePauseSessionReflectAndDecidePreflight).not.toBe(pauseInitialEmotionSelectWithRepository);
    expect(resolvePauseSessionReflectAndDecideAfterGeneration).not.toBe(pauseInitialEmotionSkipWithRepository);
    expect(resolvePauseDecideOutcomeFlow).not.toBe(resolvePauseSessionChromeCloseAction);
    expect(buildPauseScoreImpacts).not.toBe(pauseInitialEmotionSkip);
    expect(showPauseOutcomeNotCompletedToast).not.toBe(buildFeelTilesMoodLogOptions);
    expect(showPauseOutcomeSaveFailedToast).not.toBe(resolvePauseSessionChromeCloseAction);
  });

  it('feel I/O keeps feel-step RPC off decide outcome helpers', () => {
    expect(pauseInitialEmotionSelect).not.toBe(pauseReflectOutcomeLog);
    expect(pauseInitialEmotionSkip).not.toBe(pauseReflectOutcomeLogWithRepository);
    expect(pauseInitialEmotionSelectWithRepository).not.toBe(resolvePauseSessionReflectAndDecidePreflight);
    expect(pauseInitialEmotionSkipWithRepository).not.toBe(resolvePauseSessionReflectAndDecideAfterGeneration);
    expect(resolvePauseSessionChromeCloseAction).not.toBe(resolvePauseDecideOutcomeFlow);
    expect(pauseInitialEmotionSkip).not.toBe(buildPauseScoreImpacts);
    expect(buildFeelTilesMoodLogOptions).not.toBe(showPauseOutcomeNotCompletedToast);
    expect(resolvePauseSessionChromeCloseAction).not.toBe(showPauseOutcomeSaveFailedToast);
    expect(pauseInitialEmotionSelect).not.toBe(flowsReflectPauseRepository);
    expect(moodReflectPauseRepository).toBe(flowsReflectPauseRepository);
  });
});
