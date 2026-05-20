import { trackEvent } from '@/lib/posthog';

/** Catch-all NotFound for an unregistered path (pathname only, no query string). */
export function trackAppRouteNotFound(attemptedPath: string): void {
  try {
    trackEvent('app.route_not_found', { attempted_path: attemptedPath });
  } catch {
    /* no-op */
  }
}
