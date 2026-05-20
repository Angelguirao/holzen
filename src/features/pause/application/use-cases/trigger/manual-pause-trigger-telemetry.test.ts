import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  trackManualPauseInstanceCreated,
  trackPauseManualCompleted,
  trackPauseManualStarted,
} from './manual-pause-trigger-telemetry';

const trackEvent = vi.fn();

vi.mock('@/lib/posthog', () => ({
  trackEvent: (...args: unknown[]) => trackEvent(...args),
}));

describe('manual-pause-trigger-telemetry', () => {
  beforeEach(() => {
    trackEvent.mockClear();
  });

  it('tracks manual pause started from home', () => {
    trackPauseManualStarted('home');
    expect(trackEvent).toHaveBeenCalledWith('pause.manual_started', { surface: 'home' });
  });

  it('tracks instance created and manual completed', () => {
    trackManualPauseInstanceCreated({
      pauseInstanceId: 'pause-1',
      severity: 'moderate',
      pendingOffer: false,
    });
    trackPauseManualCompleted({
      durationS: 12,
      hadBitcoinContext: true,
      trackedAssetId: 'bitcoin',
    });
    expect(trackEvent).toHaveBeenNthCalledWith(1, 'pause_instance_created', {
      pause_instance_id: 'pause-1',
      template_slug: 'volatility_v1',
      source: 'manual',
      severity: 'moderate',
      pending_offer: false,
    });
    expect(trackEvent).toHaveBeenNthCalledWith(2, 'pause.manual_completed', {
      duration_s: 12,
      had_bitcoin_context: true,
      tracked_asset_id: 'bitcoin',
      companion_types: [],
    });
  });
});
