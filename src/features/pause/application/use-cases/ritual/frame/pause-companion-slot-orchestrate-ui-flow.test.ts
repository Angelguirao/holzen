import { describe, expect, it } from 'vitest';

import {
  setCompanionSlotError as setErrorDirect,
  setCompanionSlotLoading as setLoadingDirect,
} from './companion-slot-ui-state';

import {
  setCompanionSlotError,
  setCompanionSlotLoading,
} from './pause-companion-slot-orchestrate-ui-flow';

describe('pause-companion-slot-orchestrate-ui-flow', () => {
  it('re-exports companion slot loading/error UI setters from companion-slot-ui-state', () => {
    expect(typeof setCompanionSlotError).toBe('function');
    expect(typeof setCompanionSlotLoading).toBe('function');

    expect(setCompanionSlotError).toBe(setErrorDirect);
    expect(setCompanionSlotLoading).toBe(setLoadingDirect);
  });
});
