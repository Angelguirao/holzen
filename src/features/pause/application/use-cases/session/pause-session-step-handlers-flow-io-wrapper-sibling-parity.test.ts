import { describe, expect, it } from 'vitest';

import {
  buildPauseSessionStepRitualBundle,
  buildPauseSessionStepShellBundle,
} from './pause-session-step-handlers-flow';
import * as handlersFlow from './pause-session-step-handlers-flow';
import {
  buildPauseSessionStepRitualBundle as buildRitualFromHandlersIo,
  buildPauseSessionStepShellBundle as buildShellFromHandlersIo,
} from '@/features/pause/presentation/session/pause-session-step-handlers-io';
import * as handlersIo from '@/features/pause/presentation/session/pause-session-step-handlers-io';

/**
 * Cross-layer sibling parity: session step-handlers-flow CI umbrella vs presentation step-handlers-io.
 * Mirrors `pause-reflect-steps-flow-io-wrapper-sibling-parity.test.ts` (reflect steps cluster) and
 * presentation `pause-session-step-handlers-flow-io-wrapper-sibling-parity.test.ts`.
 * Cross-surface flow distinctness: `pause-session-step-handlers-steps-flow-sibling-parity.test.ts`.
 */
describe('pause-session-step-handlers-flow ↔ pause-session-step-handlers-io wrapper sibling parity', () => {
  it('step-handlers-flow CI umbrella and presentation step-handlers-io are distinct anchors', () => {
    expect(typeof buildPauseSessionStepShellBundle).toBe('function');
    expect(typeof buildPauseSessionStepRitualBundle).toBe('function');
    expect(typeof buildShellFromHandlersIo).toBe('function');
    expect(typeof buildRitualFromHandlersIo).toBe('function');

    expect('buildPauseSessionStepShellBundle' in handlersIo).toBe(true);
    expect('buildPauseSessionStepRitualBundle' in handlersIo).toBe(true);
    expect('buildPauseSessionStepShellBundle' in handlersFlow).toBe(true);
    expect('buildPauseSessionStepRitualBundle' in handlersFlow).toBe(true);
  });

  it('step-handlers-flow and step-handlers-io share step-bundles leaf re-exports', () => {
    expect(buildPauseSessionStepShellBundle).toBe(buildShellFromHandlersIo);
    expect(buildPauseSessionStepRitualBundle).toBe(buildRitualFromHandlersIo);
  });

  it('presentation step-handlers-io bindings stay off unrelated flow module namespaces', () => {
    expect(buildShellFromHandlersIo).not.toBe(handlersFlow);
    expect(buildRitualFromHandlersIo).not.toBe(handlersFlow);
  });
});
