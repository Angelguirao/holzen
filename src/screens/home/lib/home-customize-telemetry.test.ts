import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  trackHomeCustomizeOpened,
  trackHomeCustomizeResetLayout,
  trackHomeOptionalWidgetToggled,
} from './home-customize-telemetry';

const trackEvent = vi.fn();

vi.mock('@/lib/posthog', () => ({
  trackEvent: (...args: unknown[]) => trackEvent(...args),
}));

describe('home-customize-telemetry', () => {
  beforeEach(() => {
    trackEvent.mockClear();
  });

  it('tracks optional widget toggle', () => {
    trackHomeOptionalWidgetToggled('night', true);
    expect(trackEvent).toHaveBeenCalledWith('home.optional_widget_toggled', {
      widget_id: 'night',
      visible: true,
    });
  });

  it('tracks customize reset and open', () => {
    trackHomeCustomizeResetLayout();
    trackHomeCustomizeOpened();
    expect(trackEvent).toHaveBeenNthCalledWith(1, 'home.customize_reset_layout', {});
    expect(trackEvent).toHaveBeenNthCalledWith(2, 'home.customize_opened', {});
  });
});
