import { describe, expect, it } from 'vitest';

import { scheduleCheckoutGuardCleanup as scheduleFromLib } from '@/lib/subscription-checkout-guard-ref';
import { scheduleCheckoutGuardCleanup as scheduleFromPublic } from '@/features/subscription/public';

describe('subscription-checkout-guard-ref lib shim', () => {
  it('re-exports scheduleCheckoutGuardCleanup with identity binding', () => {
    expect(scheduleFromLib).toBe(scheduleFromPublic);
  });
});
