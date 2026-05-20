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
