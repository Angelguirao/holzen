import { beforeEach, describe, expect, it, vi } from 'vitest';
import { trackHomeMarketChartExpandToggled } from './market-display-telemetry';

const trackEvent = vi.fn();

vi.mock('@/lib/posthog', () => ({
  trackEvent: (...args: unknown[]) => trackEvent(...args),
}));

describe('market-display-telemetry', () => {
  beforeEach(() => {
    trackEvent.mockClear();
  });

  it('tracks chart expand toggle', () => {
    trackHomeMarketChartExpandToggled(true);
    expect(trackEvent).toHaveBeenCalledWith('home.market_chart_expand_toggled', { expanded: true });
  });
});
