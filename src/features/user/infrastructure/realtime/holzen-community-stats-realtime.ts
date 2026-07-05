import { supabase } from '@/integrations/supabase/client';

const COMMUNITY_STATS_ROW_ID = 'today';

/** Subscribe to public `holzen_community_stats` updates (global pause activity). */
export function subscribeHolzenCommunityStats(onChange: () => void): () => void {
  const channel = supabase
    .channel('holzen-community-stats')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'holzen_community_stats',
        filter: `id=eq.${COMMUNITY_STATS_ROW_ID}`,
      },
      () => {
        onChange();
      },
    )
    .subscribe();

  return () => {
    if (typeof supabase.removeChannel === 'function') {
      supabase.removeChannel(channel);
    }
  };
}
