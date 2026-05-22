import { describe, expect, it } from 'vitest';

import {
  buildPauseSessionStepRitualBundle,
  buildPauseSessionStepShellBundle,
} from './pause-session-step-handlers-flow';
import {
  buildPauseSessionStepRitualBundle as buildRitualDirect,
  buildPauseSessionStepShellBundle as buildShellDirect,
} from './step-bundles';
import {
  buildPauseSessionStepTransitionConfig,
  pauseStepSwipeDirection,
} from './pause-session-step-transition-flow';

describe('pause-session-step-handlers-flow', () => {
  it('re-exports step bundle builders from step-bundles', () => {
    expect(typeof buildPauseSessionStepShellBundle).toBe('function');
    expect(typeof buildPauseSessionStepRitualBundle).toBe('function');
    expect(buildPauseSessionStepShellBundle).toBe(buildShellDirect);
    expect(buildPauseSessionStepRitualBundle).toBe(buildRitualDirect);
  });

  it('sibling cluster: step-transition-flow exports stay distinct from step-handlers umbrella exports', () => {
    // Full cross-flow pins: `pause-session-step-handlers-step-transition-flow-sibling-parity.test.ts`.
    expect(buildPauseSessionStepShellBundle).not.toBe(buildPauseSessionStepTransitionConfig);
    expect(buildPauseSessionStepRitualBundle).not.toBe(buildPauseSessionStepTransitionConfig);
    expect(buildPauseSessionStepShellBundle).not.toBe(pauseStepSwipeDirection);
    expect(buildPauseSessionStepRitualBundle).not.toBe(pauseStepSwipeDirection);
  });
});
