import { trackEvent } from '@/lib/posthog';

/** Home market widget chart expand/collapse (event name is home-scoped in taxonomy). */
export function trackHomeMarketChartExpandToggled(expanded: boolean): void {
  try {
    trackEvent('home.market_chart_expand_toggled', { expanded });
  } catch {
    /* no-op */
  }
}
