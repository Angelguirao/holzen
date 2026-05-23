import { describe, expect, it } from 'vitest';

import { scheduleCheckoutGuardCleanup as scheduleFromApplication } from './checkout-suppression-window';
import { scheduleCheckoutGuardCleanup as scheduleFromPublic } from '../public';

describe('subscription public checkout guard export', () => {
  it('re-exports scheduleCheckoutGuardCleanup with identity binding', () => {
    expect(scheduleFromPublic).toBe(scheduleFromApplication);
  });
});
