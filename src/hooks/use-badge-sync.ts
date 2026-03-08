import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import type { NewBadge } from '@/components/BadgeCelebration';

/**
 * Syncs computed badge IDs to user_badges table.
 * Returns any newly earned badges for celebration overlay.
 */
export function useBadgeSync(computedBadgeIds: string[], badgeMeta: Record<string, { label: string; description: string; color: string }>, notifyEnabled = true) {
  const { user } = useAuth();
  const [newBadges, setNewBadges] = useState<NewBadge[]>([]);
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    if (!user || computedBadgeIds.length === 0 || synced) return;

    const sync = async () => {
      // Fetch already-recorded badges
      const { data: existing } = await supabase
        .from('user_badges' as any)
        .select('badge_id')
        .eq('user_id', user.id);

      const existingIds = new Set((existing ?? []).map((b: any) => b.badge_id));
      const fresh = computedBadgeIds.filter((id) => !existingIds.has(id));

      if (fresh.length > 0) {
        // Insert new badges
        await supabase.from('user_badges' as any).insert(
          fresh.map((badge_id) => ({ user_id: user.id, badge_id }))
        );

        const newBadgeData = fresh.map((id) => ({
          id,
          label: badgeMeta[id]?.label ?? id,
          description: badgeMeta[id]?.description ?? '',
          color: badgeMeta[id]?.color ?? 'hsl(var(--primary))',
        }));

        setNewBadges(newBadgeData);

        // Send push notification (fire and forget)
        supabase.functions.invoke('badge-notify', {
          body: { badges: newBadgeData },
        }).catch(() => {});
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
