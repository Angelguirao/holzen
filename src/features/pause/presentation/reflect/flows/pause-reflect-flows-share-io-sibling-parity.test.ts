import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectPauseRepository' },
}));

import * as flowsIo from './pause-reflect-flows-io';
import {
  buildPauseScoreImpacts,
  formatReinforcementQuoteFromSession,
  pauseReflectOutcomeLog,
  pauseReflectOutcomeLogWithRepository,
  reflectPauseRepository as flowsReflectPauseRepository,
  resolvePauseDecideOutcomeFlow,
  resolvePauseSessionReflectAndDecideAfterGeneration,
  resolvePauseSessionReflectAndDecidePreflight,
  showPauseOutcomeNotCompletedToast,
} from './pause-reflect-flows-io';
import * as shareIo from '@/features/pause/presentation/reflect/share/pause-reflect-share-io';
import {
  buildReflectionShareTelegramUrl,
  buildReflectionShareText,
  buildReflectionShareTweetUrl,
  buildReflectionShareWhatsAppUrl,
  pauseReflectionShareImage,
} from '@/features/pause/presentation/reflect/share/pause-reflect-share-io';

/**
 * Presentation sibling parity: flows-io vs share-io (parity with application
 * `application/.../flows/pause-reflect-flows-share-io-sibling-parity.test.ts` and flow-level
 * `pause-reflect-flows-share-flow-sibling-parity.test.ts`; complements
 * `pause-reflect-flows-hub-io-sibling-parity.test.ts`,
 * `pause-reflect-flows-pending-offer-io-sibling-parity.test.ts`, and
 * `pause-reflect-share-steps-io-sibling-parity.test.ts`).
 * Reciprocal inline pins: `pause-reflect-flows-io.test.ts` ↔ `pause-reflect-share-io.test.ts`.
 */
describe('pause-reflect-flows-io ↔ pause-reflect-share-io sibling parity', () => {
  it('flows-io and share-io are distinct presentation I/O surfaces', () => {
    expect(typeof resolvePauseSessionReflectAndDecidePreflight).toBe('function');
    expect(typeof resolvePauseSessionReflectAndDecideAfterGeneration).toBe('function');
    expect(typeof formatReinforcementQuoteFromSession).toBe('function');
    expect(typeof resolvePauseDecideOutcomeFlow).toBe('function');
    expect(typeof pauseReflectOutcomeLog).toBe('function');
    expect(typeof pauseReflectOutcomeLogWithRepository).toBe('function');
    expect(typeof showPauseOutcomeNotCompletedToast).toBe('function');
    expect(typeof buildPauseScoreImpacts).toBe('function');
    expect(typeof flowsReflectPauseRepository).toBe('object');

    expect(typeof buildReflectionShareText).toBe('function');
    expect(typeof buildReflectionShareTweetUrl).toBe('function');
    expect(typeof buildReflectionShareWhatsAppUrl).toBe('function');
    expect(typeof buildReflectionShareTelegramUrl).toBe('function');
    expect(typeof pauseReflectionShareImage).toBe('function');

    expect('buildReflectionShareText' in flowsIo).toBe(false);
    expect('pauseReflectionShareImage' in flowsIo).toBe(false);
    expect('buildReflectionShareTelegramUrl' in flowsIo).toBe(false);
    expect('buildReflectionShareTweetUrl' in flowsIo).toBe(false);
    expect('buildReflectionShareWhatsAppUrl' in flowsIo).toBe(false);

    expect('resolvePauseSessionReflectAndDecidePreflight' in shareIo).toBe(false);
    expect('pauseReflectOutcomeLog' in shareIo).toBe(false);
    expect('pauseReflectOutcomeLogWithRepository' in shareIo).toBe(false);
    expect('buildPauseScoreImpacts' in shareIo).toBe(false);
    expect('reflectPauseRepository' in shareIo).toBe(false);
  });

  it('flows-io exports stay off reflection share builders and PNG orchestration', () => {
    expect(resolvePauseSessionReflectAndDecidePreflight).not.toBe(pauseReflectionShareImage);
    expect(resolvePauseSessionReflectAndDecideAfterGeneration).not.toBe(buildReflectionShareText);
    expect(pauseReflectOutcomeLog).not.toBe(buildReflectionShareTelegramUrl);
    expect(formatReinforcementQuoteFromSession).not.toBe(buildReflectionShareTweetUrl);
    expect(resolvePauseDecideOutcomeFlow).not.toBe(buildReflectionShareWhatsAppUrl);
    expect(buildPauseScoreImpacts).not.toBe(pauseReflectionShareImage);
    expect(showPauseOutcomeNotCompletedToast).not.toBe(buildReflectionShareText);
    expect(pauseReflectOutcomeLogWithRepository).not.toBe(pauseReflectionShareImage);
    expect(flowsReflectPauseRepository).not.toBe(pauseReflectionShareImage);
  });

  it('share-io exports stay off reflect+decide preflight, outcome RPC, and decide presentation helpers', () => {
    expect(pauseReflectionShareImage).not.toBe(resolvePauseSessionReflectAndDecidePreflight);
    expect(buildReflectionShareText).not.toBe(pauseReflectOutcomeLog);
    expect(buildReflectionShareTelegramUrl).not.toBe(formatReinforcementQuoteFromSession);
    expect(buildReflectionShareTweetUrl).not.toBe(resolvePauseDecideOutcomeFlow);
    expect(buildReflectionShareWhatsAppUrl).not.toBe(buildPauseScoreImpacts);
    expect(pauseReflectionShareImage).not.toBe(resolvePauseSessionReflectAndDecideAfterGeneration);
    expect(buildReflectionShareText).not.toBe(showPauseOutcomeNotCompletedToast);
    expect(pauseReflectionShareImage).not.toBe(pauseReflectOutcomeLogWithRepository);
  });
});
