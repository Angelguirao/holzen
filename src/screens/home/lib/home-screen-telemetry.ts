import { trackEvent } from '@/lib/posthog';

export function trackHomeOptionalWidgetToggled(widgetId: string, visible: boolean): void {
  try {
    trackEvent('home.optional_widget_toggled', { widget_id: widgetId, visible });
  } catch {
    /* no-op */
  }
}

export function trackHomeCustomizeResetLayout(): void {
  try {
    trackEvent('home.customize_reset_layout', {});
  } catch {
    /* no-op */
  }
}

export function trackHomeCustomizeOpened(): void {
  try {
    trackEvent('home.customize_opened', {});
  } catch {
    /* no-op */
  }
}

export function trackHomeHeroQuoteViewed(quoteIndex: number, utcYmd: string): void {
  try {
    trackEvent('home.hero_quote_viewed', { quote_index: quoteIndex, utc_ymd: utcYmd });
  } catch {
    /* no-op */
  }
}

export function trackHomeGoalWhyExpandToggled(expanded: boolean): void {
  try {
    trackEvent('home.goal_why_expand_toggled', { expanded });
  } catch {
    /* no-op */
  }
}
