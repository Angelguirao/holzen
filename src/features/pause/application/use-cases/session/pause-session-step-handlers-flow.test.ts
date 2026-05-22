import { describe, expect, it } from 'vitest';

import {
  buildPauseSessionStepRitualBundle,
  buildPauseSessionStepShellBundle,
} from './pause-session-step-handlers-flow';
import {
  buildPauseSessionStepRitualBundle as buildRitualDirect,
  buildPauseSessionStepShellBundle as buildShellDirect,
} from './step-bundles';

describe('pause-session-step-handlers-flow', () => {
  it('re-exports step bundle builders from step-bundles', () => {
    expect(typeof buildPauseSessionStepShellBundle).toBe('function');
    expect(typeof buildPauseSessionStepRitualBundle).toBe('function');
    expect(buildPauseSessionStepShellBundle).toBe(buildShellDirect);
    expect(buildPauseSessionStepRitualBundle).toBe(buildRitualDirect);
  });
});
