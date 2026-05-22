import { describe, expect, it } from 'vitest';

import { persistCompanionUiStepCompletion as persistDirect } from './persist-ui-step-completion';

import { persistCompanionUiStepCompletion } from './pause-companion-ui-completion-flow';

describe('pause-companion-ui-completion-flow', () => {
  it('re-exports UI step completion persist from persist-ui-step-completion', () => {
    expect(typeof persistCompanionUiStepCompletion).toBe('function');
    expect(persistCompanionUiStepCompletion).toBe(persistDirect);
  });
});
