import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

const FAVORITES_KEY = 'companion_slot_favorites';

/**
 * Per-slot heart state for companion cards on one pause instance.
 * Stored on `pause_instances.metadata` (not `library_items`).
 */
export function useCompanionLibraryFavorites(pauseInstanceId: string | null | undefined) {
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!pauseInstanceId) {
      setFavorites({});
      return;
    }
    let cancelled = false;
    void supabase
      .from('pause_instances')
      .select('metadata')
      .eq('id', pauseInstanceId)
      .single()
      .then(({ data, error }) => {
        if (cancelled || error || !data) return;
        const meta = (data.metadata as Record<string, unknown>) ?? {};
        const fav = meta[FAVORITES_KEY];
        if (fav && typeof fav === 'object' && !Array.isArray(fav)) {
          const out: Record<string, boolean> = {};
          for (const [k, v] of Object.entries(fav as Record<string, unknown>)) {
            if (typeof v === 'boolean') out[k] = v;
          }
          setFavorites(out);
        } else {
          setFavorites({});
        }
      });
    return () => {
      cancelled = true;
    };
  }, [pauseInstanceId]);

  const toggleCompanionFavorite = useCallback(
    async (sourceType: string) => {
      if (!pauseInstanceId) return;
      const { data: row, error: fetchErr } = await supabase
        .from('pause_instances')
        .select('metadata')
        .eq('id', pauseInstanceId)
        .single();
      if (fetchErr || !row) return;
      const meta = { ...((row.metadata as Record<string, unknown>) ?? {}) };
      const prevBucket = { ...((meta[FAVORITES_KEY] as Record<string, boolean> | undefined) ?? {}) };
      const newVal = !prevBucket[sourceType];
      const bucket = { ...prevBucket, [sourceType]: newVal };
      meta[FAVORITES_KEY] = bucket;
      setFavorites(bucket);
      await supabase
        .from('pause_instances')
        .update({ metadata: meta as unknown as Json })
        .eq('id', pauseInstanceId);
    },
    [pauseInstanceId],
  );

  return { favorites, toggleCompanionFavorite };
}
