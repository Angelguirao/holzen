import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Per–`source_type` favorite flags for `library_items` tied to one pause
 * (companion cards: haiku, signal, grounding, zoom_out, history_insight).
 *
 * Post Pause V2 the legacy `library_items.reflection_id` column is dropped;
 * rows key on `pause_instance_id` instead.
 */
export function useCompanionLibraryFavorites(pauseInstanceId: string | null | undefined) {
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!pauseInstanceId) return;
    supabase
      .from('library_items')
      .select('source_type, is_favorite')
      // Typed-cast: the generated types.ts has not been regenerated yet post-
      // destructive cutover, so `pause_instance_id` isn't in the inferred
      // Update/Row shape. The column exists in the DB (added in
      // 20260423201300_companion_serves_pause_instance_id.sql).
      .eq('pause_instance_id' as never, pauseInstanceId)
      .then(({ data }) => {
        if (!data) return;
        const favs: Record<string, boolean> = {};
        for (const row of data as { source_type?: string | null; is_favorite?: boolean | null }[]) {
          if (row.source_type) favs[row.source_type] = row.is_favorite ?? false;
        }
        setFavorites(favs);
      });
  }, [pauseInstanceId]);

  const toggleCompanionFavorite = useCallback(
    async (sourceType: string) => {
      if (!pauseInstanceId) return;
      const newVal = !favorites[sourceType];
      setFavorites((prev) => ({ ...prev, [sourceType]: newVal }));
      await supabase
        .from('library_items')
        .update({ is_favorite: newVal })
        .eq('pause_instance_id' as never, pauseInstanceId)
        .eq('source_type', sourceType);
    },
    [pauseInstanceId, favorites],
  );

  return { favorites, toggleCompanionFavorite };
}
