import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import type { NewBadge } from '@/components/BadgeCelebration';

const SESSION_SHOWN_KEY = 'holzen_badges_shown_this_session';

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
  } catch { /* ignore */ }
}

/**
 * Syncs computed badge IDs to user_badges table.
 * Returns any newly earned badges for celebration overlay.
 * Uses sessionStorage to ensure the celebration shows only once per browser session,
 * even if the BadgesPanel unmounts and remounts via tab navigation.
 */
export function useBadgeSync(computedBadgeIds: string[], badgeMeta: Record<string, { label: string; description: string; color: string }>, notifyEnabled = true) {
  const { user } = useAuth();
  const [newBadges, setNewBadges] = useState<NewBadge[]>([]);
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    if (!user || computedBadgeIds.length === 0 || synced) return;

    const sync = async () => {
      // Fetch already-recorded badges from DB
      const { data: existing } = await supabase
        .from('user_badges' as any)
        .select('badge_id')
        .eq('user_id', user.id);

      const existingIds = new Set((existing ?? []).map((b: any) => b.badge_id));
      const fresh = computedBadgeIds.filter((id) => !existingIds.has(id));

      if (fresh.length > 0) {
        // Insert new badges to DB
        await supabase.from('user_badges' as any).insert(
          fresh.map((badge_id) => ({ user_id: user.id, badge_id }))
        );

        // Only show celebration for badges not yet shown this browser session
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

          // Send push notification (fire and forget)
          if (notifyEnabled) {
            supabase.functions.invoke('badge-notify', {
              body: { badges: newBadgeData },
            }).catch(() => {});
          }
        }
      }

      setSynced(true);
    };

    sync();
  }, [user, computedBadgeIds, badgeMeta, synced]);

  const dismissCelebration = useCallback(() => {
    setNewBadges([]);
  }, []);

  return { newBadges, dismissCelebration };
}
