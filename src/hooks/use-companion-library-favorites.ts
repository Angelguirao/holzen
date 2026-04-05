import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Per–`source_type` favorite flags for `library_items` tied to one reflection
 * (Pause companion cards: haiku, signal, grounding, zoom_out, history_insight).
 */
export function useCompanionLibraryFavorites(reflectionId: string | null | undefined) {
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!reflectionId) return;
    supabase
      .from('library_items')
      .select('source_type, is_favorite')
      .eq('reflection_id', reflectionId)
      .then(({ data }) => {
        if (!data) return;
        const favs: Record<string, boolean> = {};
        for (const row of data as { source_type?: string | null; is_favorite?: boolean | null }[]) {
          if (row.source_type) favs[row.source_type] = row.is_favorite ?? false;
        }
        setFavorites(favs);
      });
  }, [reflectionId]);

  const toggleCompanionFavorite = useCallback(
    async (sourceType: string) => {
      if (!reflectionId) return;
      const newVal = !favorites[sourceType];
      setFavorites((prev) => ({ ...prev, [sourceType]: newVal }));
      await supabase
        .from('library_items')
        .update({ is_favorite: newVal })
        .eq('reflection_id', reflectionId)
        .eq('source_type', sourceType);
    },
    [reflectionId, favorites],
  );

  return { favorites, toggleCompanionFavorite };
}
