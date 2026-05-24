import { beforeEach, describe, expect, it, vi } from 'vitest';
import { trackPrimaryTabOpened } from './navigation-telemetry';

const trackEvent = vi.fn();

vi.mock('@/lib/posthog', () => ({
  trackEvent: (...args: unknown[]) => trackEvent(...args),
}));

describe('navigation-telemetry', () => {
  beforeEach(() => {
    trackEvent.mockClear();
  });

  it('tracks primary tab opened', () => {
    trackPrimaryTabOpened('archive');
    expect(trackEvent).toHaveBeenCalledWith('navigation.primary_tab_opened', { tab: 'archive' });
  });
});
