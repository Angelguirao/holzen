import { useCallback, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

const PINNED_KEY = 'holzen_pinned_reflection';

export interface PinnedPausePreview {
  id: string;
  context: string | null;
}

/**
 * Loads a user-pinned pause reflection preview from localStorage + `pause_instances`.
 */
export function useHomePinnedPausePreview(user: User | null): {
  pinnedPausePreview: PinnedPausePreview | null;
  unpinPausePreview: () => void;
} {
  const [pinnedPausePreview, setPinnedPausePreview] = useState<PinnedPausePreview | null>(null);

  useEffect(() => {
    if (!user) return;
    let pinnedId: string | null = null;
    try {
      pinnedId = localStorage.getItem(PINNED_KEY);
    } catch {
      return;
    }
    if (!pinnedId) return;
    let cancelled = false;
    void (async () => {
      const { data: inst } = await supabase
        .from('pause_instances' as never)
        .select('id, context_snapshot')
        .eq('id', pinnedId)
        .eq('user_id', user.id)
        .maybeSingle();
      if (cancelled) return;
      if (!inst) {
        try {
          localStorage.removeItem(PINNED_KEY);
        } catch {
          /* ignore */
        }
        return;
      }
      const ctxSnap = ((inst as { context_snapshot: Record<string, unknown> | null }).context_snapshot ??
        {}) as Record<string, unknown>;
      const context = typeof ctxSnap.context_text === 'string' ? (ctxSnap.context_text as string) : null;
      setPinnedPausePreview({
        id: pinnedId,
        context,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const unpinPausePreview = useCallback(() => {
    try {
      localStorage.removeItem(PINNED_KEY);
    } catch {
      /* ignore */
    }
    setPinnedPausePreview(null);
  }, []);

  return { pinnedPausePreview, unpinPausePreview };
}
