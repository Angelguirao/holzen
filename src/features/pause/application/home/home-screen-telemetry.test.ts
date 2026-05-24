import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  trackHomeCustomizeOpened,
  trackHomeCustomizeResetLayout,
  trackHomeGoalWhyExpandToggled,
  trackHomeHeroQuoteViewed,
  trackHomeOptionalWidgetToggled,
  trackOnboardingCompleted,
} from './home-screen-telemetry';

const trackEvent = vi.fn();

vi.mock('@/lib/posthog', () => ({
  trackEvent: (...args: unknown[]) => trackEvent(...args),
}));

describe('home-screen-telemetry', () => {
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

  it('tracks hero quote viewed', () => {
    trackHomeHeroQuoteViewed(3, '2026-05-19');
    expect(trackEvent).toHaveBeenCalledWith('home.hero_quote_viewed', {
      quote_index: 3,
      utc_ymd: '2026-05-19',
    });
  });

  it('tracks goal-why expand toggle', () => {
    trackHomeGoalWhyExpandToggled(true);
    expect(trackEvent).toHaveBeenCalledWith('home.goal_why_expand_toggled', { expanded: true });
  });

  it('tracks onboarding completed', () => {
    trackOnboardingCompleted(2);
    expect(trackEvent).toHaveBeenCalledWith('onboarding.completed', { steps_completed: 2 });
  });
});
