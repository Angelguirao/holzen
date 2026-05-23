import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectPauseRepository' },
}));

import * as flowsIo from '@/features/pause/presentation/reflect/flows/pause-reflect-flows-io';
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
} from '@/features/pause/presentation/reflect/flows/pause-reflect-flows-io';
import * as hubIo from '@/features/pause/presentation/reflect/hub/pause-reflect-hub-io';
import {
  buildShiftEmotionFrameHubLogBundle,
  pauseShiftEmotionFrameHubDone,
  pauseShiftEmotionFrameHubDoneWithRepository,
  reflectPauseRepository as hubReflectPauseRepository,
  resolveShiftFrameHubDonePresentation,
} from '@/features/pause/presentation/reflect/hub/pause-reflect-hub-io';

/**
 * Application sibling parity: flows-io vs hub-io presentation I/O (parity with
 * `pause-reflect-flows-hub-flow-sibling-parity.test.ts` and presentation
 * `pause-reflect-flows-hub-io-sibling-parity.test.ts`).
 * Reciprocal inline pins: `pause-reflect-flows-io-parity.test.ts` ↔ `pause-reflect-hub-io-parity.test.ts`.
 */
describe('pause-reflect-flows-io ↔ pause-reflect-hub-io sibling parity (application)', () => {
  it('flows-io and hub-io are distinct presentation I/O surfaces', () => {
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
    expect(typeof flowsReflectPauseRepository).toBe('object');

    expect(typeof pauseShiftEmotionFrameHubDone).toBe('function');
    expect(typeof pauseShiftEmotionFrameHubDoneWithRepository).toBe('function');
    expect(typeof buildShiftEmotionFrameHubLogBundle).toBe('function');
    expect(typeof resolveShiftFrameHubDonePresentation).toBe('function');
    expect(typeof hubReflectPauseRepository).toBe('object');

    expect('pauseShiftEmotionFrameHubDone' in flowsIo).toBe(false);
    expect('buildShiftEmotionFrameHubLogBundle' in flowsIo).toBe(false);
    expect('resolveShiftFrameHubDonePresentation' in flowsIo).toBe(false);

    expect('resolvePauseSessionReflectAndDecidePreflight' in hubIo).toBe(false);
    expect('pauseReflectOutcomeLog' in hubIo).toBe(false);
    expect('buildPauseScoreImpacts' in hubIo).toBe(false);
    expect('showPauseOutcomeNotCompletedToast' in hubIo).toBe(false);
  });

  it('flows-io exports stay off shift-frame hub RPC and presentation mapping', () => {
    expect(resolvePauseSessionReflectAndDecidePreflight).not.toBe(pauseShiftEmotionFrameHubDone);
    expect(resolvePauseSessionReflectAndDecideAfterGeneration).not.toBe(pauseShiftEmotionFrameHubDone);
    expect(pauseReflectOutcomeLog).not.toBe(pauseShiftEmotionFrameHubDoneWithRepository);
    expect(pauseReflectOutcomeLogWithRepository).not.toBe(pauseShiftEmotionFrameHubDone);
    expect(formatReinforcementQuoteFromSession).not.toBe(buildShiftEmotionFrameHubLogBundle);
    expect(resolvePauseDecideOutcomeFlow).not.toBe(resolveShiftFrameHubDonePresentation);
    expect(buildPauseScoreImpacts).not.toBe(buildShiftEmotionFrameHubLogBundle);
    expect(showPauseOutcomeSaveFailedToast).not.toBe(pauseShiftEmotionFrameHubDone);
  });

  it('hub-io exports stay off reflect+decide flow helpers and outcome RPC', () => {
    expect(pauseShiftEmotionFrameHubDone).not.toBe(resolvePauseSessionReflectAndDecidePreflight);
    expect(pauseShiftEmotionFrameHubDone).not.toBe(pauseReflectOutcomeLog);
    expect(pauseShiftEmotionFrameHubDoneWithRepository).not.toBe(pauseReflectOutcomeLogWithRepository);
    expect(buildShiftEmotionFrameHubLogBundle).not.toBe(formatReinforcementQuoteFromSession);
    expect(resolveShiftFrameHubDonePresentation).not.toBe(resolvePauseDecideOutcomeFlow);
    expect(pauseShiftEmotionFrameHubDone).not.toBe(showPauseOutcomeNotCompletedToast);
    expect(buildShiftEmotionFrameHubLogBundle).not.toBe(getSessionQuote);
    expect(hubReflectPauseRepository).toBe(flowsReflectPauseRepository);
    expect(pauseShiftEmotionFrameHubDone).not.toBe(pauseReflectOutcomeLog);
  });
});
