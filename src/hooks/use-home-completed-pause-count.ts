import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { holzenLog } from '@/lib/holzen-console';

/**
 * Exact count of completed pauses for testimonial prompt eligibility.
 */
export function useHomeCompletedPauseCount(user: User | null): number {
  const [completedPauseCount, setCompletedPauseCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    void supabase
      .from('pause_instances' as never)
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('state', 'completed')
      .then(({ count, error: countErr }) => {
        if (countErr) {
          holzenLog.home('completed_pause_count_unavailable', { message: countErr.message });
          return;
        }
        if (count != null) setCompletedPauseCount(count);
      });
  }, [user]);

  return completedPauseCount;
}
