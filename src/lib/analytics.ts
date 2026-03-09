import { supabase } from '@/integrations/supabase/client';

/**
 * Lightweight analytics tracker for conversion funnel events.
 * Events are stored in the analytics_events table.
 *
 * Key funnel events:
 * - signup: user created an account
 * - first_reflection: user completed their first reflection
 * - hit_free_limit: user reached the free reflection limit
 * - upgrade_click: user clicked an upgrade/checkout button
 * - subscribed: user successfully subscribed to Pro
 * - pro_feature_blocked: user hit a Pro gate (tracks which feature)
 */

type FunnelEvent =
  | 'signup'
  | 'first_reflection'
  | 'hit_free_limit'
  | 'upgrade_click'
  | 'subscribed'
  | 'pro_feature_blocked';

const tracked = new Set<string>();

export async function trackEvent(
  event: FunnelEvent,
  metadata?: Record<string, unknown>,
  options?: { dedupKey?: string }
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Client-side dedup for once-per-session events
    const key = options?.dedupKey ?? event;
    if (tracked.has(key)) return;
    tracked.add(key);

    await supabase.from('analytics_events' as any).insert({
      user_id: user.id,
      event,
      metadata: metadata ?? {},
    });
  } catch {
    // Analytics should never break the app
  }
}

/** Track once-ever events by checking if the event already exists for the user */
export async function trackOnce(
  event: FunnelEvent,
  metadata?: Record<string, unknown>
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const key = `once:${event}`;
    if (tracked.has(key)) return;

    const { count } = await supabase
      .from('analytics_events' as any)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('event', event);

    if ((count ?? 0) > 0) {
      tracked.add(key);
      return;
    }

    tracked.add(key);
    await supabase.from('analytics_events' as any).insert({
      user_id: user.id,
      event,
      metadata: metadata ?? {},
    });
  } catch {
    // Analytics should never break the app
  }
}
