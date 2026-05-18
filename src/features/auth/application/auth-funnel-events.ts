import { trackEvent } from '@/lib/posthog';

/** Minimal user fields for auth funnel analytics (mapped from Supabase `User` in presentation). */
export type AuthFunnelUser = {
  id: string;
  created_at?: string;
  app_metadata?: { provider?: string };
};

/** PostHog auth funnel events (see docs/ops/event-taxonomy.md § auth). */
export function handleAuthFunnelEvents(event: string, user: AuthFunnelUser | null | undefined): void {
  if (event === 'SIGNED_IN' && user) {
    const provider = user.app_metadata?.provider ?? 'email';
    const createdAt = user.created_at ? new Date(user.created_at).getTime() : 0;
    const signedUpKey = `holzen_signed_up_fired_${user.id}`;
    if (
      createdAt &&
      Date.now() - createdAt < 10 * 60 * 1000 &&
      !localStorage.getItem(signedUpKey)
    ) {
      trackEvent('auth.signed_up', { provider });
      try {
        localStorage.setItem(signedUpKey, '1');
      } catch {
        /* quota exceeded — next session will just re-skip by createdAt */
      }
    }
    trackEvent('auth.signed_in', { provider });
    return;
  }
  if (event === 'SIGNED_OUT') {
    trackEvent('auth.signed_out');
  }
}
