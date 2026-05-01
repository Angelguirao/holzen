import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { invokeEdge } from '@/lib/invoke-edge';
import { useAuth } from '@/hooks/use-auth';
import type { NewBadge } from '@/components/BadgeCelebration';

const SESSION_SHOWN_KEY = 'holzen_badges_shown_this_session';
const LAST_SEED_KEY_PREFIX = 'holzen_badges_last_seed_';

function getShownThisSession(): Set<string> {
  try {
    return new Set(JSON.parse(sessionStorage.getItem(SESSION_SHOWN_KEY) || '[]'));
  } catch {
    return new Set();
  }
}

function markShownThisSession(ids: string[]) {
  try {
    const prev = getShownThisSession();
    ids.forEach((id) => prev.add(id));
    sessionStorage.setItem(SESSION_SHOWN_KEY, JSON.stringify([...prev]));
  } catch {
    /* ignore */
  }
}

/**
 * Syncs computed badge IDs to `user_badges`.
 *
 * Silent-seed mode: on first post-cutover render (`user_badges` was
 * truncated at merge), a user may qualify for multiple badges that are
 * all "newly earned". Firing a celebration + push for each would
 * produce a push flood. To avoid this, the hook detects whether the
 * caller has ever run a seed for this user (tracked in localStorage)
 * and treats the *first* sync as a silent seed: insert every earned
 * badge row without celebration / push. Subsequent syncs behave
 * normally (one badge at a time produces one celebration + push).
 *
 * Returns newly earned badges for the celebration overlay.
 */
export function useBadgeSync(
  computedBadgeIds: string[],
  badgeMeta: Record<string, { label: string; description: string; color: string }>,
  notifyEnabled = true,
) {
  const { user } = useAuth();
  const [newBadges, setNewBadges] = useState<NewBadge[]>([]);
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    if (!user || computedBadgeIds.length === 0 || synced) return;

    const sync = async () => {
      const seedKey = LAST_SEED_KEY_PREFIX + user.id;
      const alreadySeeded = (() => {
        try {
          return !!localStorage.getItem(seedKey);
        } catch {
          return false;
        }
      })();

      const { data: existing } = await supabase
        .from('user_badges' as never)
        .select('badge_id')
        .eq('user_id', user.id);

      const existingIds = new Set(
        ((existing ?? []) as Array<{ badge_id: string }>).map((b) => b.badge_id),
      );
      const fresh = computedBadgeIds.filter((id) => !existingIds.has(id));

      if (fresh.length > 0) {
        const rows = fresh.map((badge_id) => ({ user_id: user.id, badge_id }));
        await supabase.from('user_badges' as never).upsert(rows as never, {
          onConflict: 'user_id,badge_id',
          ignoreDuplicates: true,
        } as never);

        const shouldSilentSeed = !alreadySeeded && existingIds.size === 0 && fresh.length > 1;

        if (shouldSilentSeed) {
          // Silent seed: the user has no existing badges and this render
          // is trying to insert multiple at once. Treat as a reconciliation
          // (e.g. right after a `user_badges` baseline reset) and skip the
          // celebration + push for every one of them.
          try {
            localStorage.setItem(seedKey, new Date().toISOString());
          } catch {
            /* ignore */
          }
        } else {
          // Normal path: celebrate + push for newly earned badges that
          // haven't already been celebrated this browser session.
          const shownThisSession = getShownThisSession();
          const toShow = fresh.filter((id) => !shownThisSession.has(id));

          if (toShow.length > 0) {
            markShownThisSession(toShow);
            const newBadgeData = toShow.map((id) => ({
              id,
              label: badgeMeta[id]?.label ?? id,
              description: badgeMeta[id]?.description ?? '',
              color: badgeMeta[id]?.color ?? 'hsl(var(--primary))',
            }));
            setNewBadges(newBadgeData);

            if (notifyEnabled) {
              void (async () => {
                let { data: { session } } = await supabase.auth.getSession();
                if (!session?.access_token) return;
                const expiresAtMs = (session.expires_at ?? 0) * 1000;
                if (expiresAtMs < Date.now() + 30_000) {
                  const { data: refreshed } = await supabase.auth.refreshSession();
                  session = refreshed.session ?? session;
                }
                if (!session?.access_token) return;
                await invokeEdge('badge-notify', {
                  body: { badges: newBadgeData },
                  headers: { Authorization: `Bearer ${session.access_token}` },
                }).catch(() => {});
              })();
            }
          }
          try {
            localStorage.setItem(seedKey, new Date().toISOString());
          } catch {
            /* ignore */
          }
        }
      }

      setSynced(true);
    };

    void sync();
  }, [user, computedBadgeIds, badgeMeta, synced, notifyEnabled]);

  const dismissCelebration = useCallback(() => {
    setNewBadges([]);
  }, []);

  return { newBadges, dismissCelebration };
}
