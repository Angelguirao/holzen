import { trackEvent } from '@/lib/posthog';
import type { AppShellTabKey } from '@/lib/app-routes';

/** User opened a different primary bottom tab (see docs/ops/event-taxonomy.md). */
export function trackPrimaryTabOpened(tab: AppShellTabKey): void {
  try {
    trackEvent('navigation.primary_tab_opened', { tab });
  } catch {
    /* no-op */
  }
}
