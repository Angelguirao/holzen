import { describe, expect, it } from 'vitest';

import {
  showPauseOutcomeNotCompletedToast as showNotCompletedDirect,
  showPauseOutcomeSaveFailedToast as showSaveFailedDirect,
} from './outcome-toast';

import {
  showPauseOutcomeNotCompletedToast,
  showPauseOutcomeSaveFailedToast,
} from './pause-decide-outcome-toast-flow';

describe('pause-decide-outcome-toast-flow', () => {
  it('re-exports decide outcome Sonner toasts from outcome-toast', () => {
    expect(typeof showPauseOutcomeNotCompletedToast).toBe('function');
    expect(typeof showPauseOutcomeSaveFailedToast).toBe('function');

    expect(showPauseOutcomeNotCompletedToast).toBe(showNotCompletedDirect);
    expect(showPauseOutcomeSaveFailedToast).toBe(showSaveFailedDirect);
  });
});
