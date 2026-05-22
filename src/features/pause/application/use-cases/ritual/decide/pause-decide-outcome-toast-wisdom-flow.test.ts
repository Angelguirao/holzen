import { describe, expect, it } from 'vitest';

import {
  showPauseOutcomeNotCompletedToast,
  showPauseOutcomeSaveFailedToast,
} from './pause-decide-outcome-toast-flow';
import { getSessionQuote } from './pause-decide-wisdom-quotes-flow';

describe('pause-decide-outcome-toast-flow', () => {
  it('re-exports decide outcome Sonner toasts', () => {
    expect(typeof showPauseOutcomeNotCompletedToast).toBe('function');
    expect(typeof showPauseOutcomeSaveFailedToast).toBe('function');
  });
});

describe('pause-decide-wisdom-quotes-flow', () => {
  it('re-exports session wisdom quote helper', () => {
    expect(typeof getSessionQuote).toBe('function');
  });
});
