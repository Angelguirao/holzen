import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  resetPauseRpcLifecycleTelemetryDedupeForTests,
  trackPauseCompanionCounted,
  trackPauseCompanionNotCounted,
  trackPauseCompletedOnce,
  trackPauseEngagedOnce,
} from './pause-rpc-lifecycle-telemetry';

const trackEvent = vi.fn();

vi.mock('@/lib/posthog', () => ({
  trackEvent: (...args: unknown[]) => trackEvent(...args),
}));

describe('pause-rpc-lifecycle-telemetry', () => {
  beforeEach(() => {
    trackEvent.mockClear();
    resetPauseRpcLifecycleTelemetryDedupeForTests();
  });

  it('dedupes pause_engaged and pause_completed per instance', () => {
    trackPauseEngagedOnce('pause-1');
    trackPauseEngagedOnce('pause-1');
    expect(trackEvent).toHaveBeenCalledTimes(1);
    expect(trackEvent).toHaveBeenCalledWith('pause_engaged', { pause_instance_id: 'pause-1' });

    expect(trackPauseCompletedOnce('pause-1')).toBe(true);
    expect(trackPauseCompletedOnce('pause-1')).toBe(false);
    expect(trackEvent).toHaveBeenCalledWith('pause_completed', { pause_instance_id: 'pause-1' });
    expect(trackEvent).toHaveBeenCalledTimes(2);
  });

  it('tracks companion counted and not counted payloads', () => {
    trackPauseCompanionCounted({
      pauseInstanceId: 'pause-2',
      companionType: 'holzen-reflect',
      entryPoint: 'pause_flow',
    });
    trackPauseCompanionNotCounted({
      companionType: 'holzen-breathe',
      reason: 'no_active_pause',
      entryPoint: 'library',
    });
    expect(trackEvent).toHaveBeenNthCalledWith(1, 'pause_companion_counted', {
      pause_instance_id: 'pause-2',
      companion_type: 'holzen-reflect',
      entry_point: 'pause_flow',
    });
    expect(trackEvent).toHaveBeenNthCalledWith(2, 'pause_companion_not_counted', {
      companion_type: 'holzen-breathe',
      reason: 'no_active_pause',
      entry_point: 'library',
    });
  });
});
