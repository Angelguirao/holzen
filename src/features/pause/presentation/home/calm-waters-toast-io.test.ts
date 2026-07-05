import { describe, expect, it, beforeEach } from 'vitest';
import {
  calmWatersToastId,
  calmWatersToastStorageKey,
  hasShownCalmWatersToast,
  markCalmWatersToastShown,
} from './calm-waters-toast-io';

describe('calm-waters-toast-io', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('dedupes per user and pause instance', () => {
    const key = calmWatersToastStorageKey('user-1', 'pause-abc');
    expect(key).toContain('user-1');
    expect(key).toContain('pause-abc');
    expect(hasShownCalmWatersToast('user-1', 'pause-abc')).toBe(false);

    markCalmWatersToastShown('user-1', 'pause-abc');
    expect(hasShownCalmWatersToast('user-1', 'pause-abc')).toBe(true);
    expect(hasShownCalmWatersToast('user-1', 'pause-other')).toBe(false);
  });

  it('uses stable sonner id per pause instance', () => {
    expect(calmWatersToastId('pause-abc')).toBe('home:calm-waters:pause-abc');
  });
});
