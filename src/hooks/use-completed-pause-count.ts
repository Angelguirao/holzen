import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';

/**
 * Exact count of completed pause rows for the current user (`pause_instances.state = 'completed'`).
 * `null` while loading or when signed out.
 */
export function useCompletedPauseCount(): number | null {
  const { user } = useAuth();
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    if (!user) {
      setCount(null);
      return;
    }
    let cancelled = false;
    void supabase
      .from('pause_instances' as never)
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('state', 'completed')
      .then(({ count: c }: { count: number | null }) => {
        if (cancelled) return;
        setCount(c ?? 0);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  return count;
}
