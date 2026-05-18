import { identifyPostHog, resetPostHog } from '@/lib/posthog';
import { setSentryUser } from '@/lib/sentry';

/** Identify an authenticated user on initial session hydration (no auth event). */
export function identifyAuthenticatedUser(userId: string): void {
  setSentryUser(userId);
  identifyPostHog(userId);
}

/** Sync Sentry + PostHog identity on auth transitions (id only — see docs/ops/pii-masking-review.md). */
export function syncAuthObservability(event: string, userId: string | null | undefined): void {
  if (userId) {
    setSentryUser(userId);
    identifyPostHog(userId);
    return;
  }
  if (event === 'SIGNED_OUT') {
    setSentryUser(null);
    resetPostHog();
  }
}
