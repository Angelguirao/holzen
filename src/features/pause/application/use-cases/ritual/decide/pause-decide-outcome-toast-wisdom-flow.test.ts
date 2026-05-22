import { describe, expect, it } from 'vitest';

import { getSessionQuote as getQuoteDirect } from './wisdom-quotes';
import {
  showPauseOutcomeNotCompletedToast as showNotCompletedDirect,
  showPauseOutcomeSaveFailedToast as showSaveFailedDirect,
} from './outcome-toast';

import {
  showPauseOutcomeNotCompletedToast,
  showPauseOutcomeSaveFailedToast,
} from './pause-decide-outcome-toast-flow';
import { getSessionQuote } from './pause-decide-wisdom-quotes-flow';

describe('pause-decide-outcome-toast-flow', () => {
  it('re-exports decide outcome Sonner toasts from outcome-toast leaf', () => {
    expect(typeof showPauseOutcomeNotCompletedToast).toBe('function');
    expect(typeof showPauseOutcomeSaveFailedToast).toBe('function');
    expect(showPauseOutcomeNotCompletedToast).toBe(showNotCompletedDirect);
    expect(showPauseOutcomeSaveFailedToast).toBe(showSaveFailedDirect);
  });
});

describe('pause-decide-wisdom-quotes-flow', () => {
  it('re-exports session wisdom quote helper from wisdom-quotes leaf', () => {
    expect(typeof getSessionQuote).toBe('function');
    expect(getSessionQuote).toBe(getQuoteDirect);
  });
});
