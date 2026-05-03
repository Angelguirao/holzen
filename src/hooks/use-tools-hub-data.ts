import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { fetchPracticeSuggestions, type PracticeSuggestion } from '@/lib/practice-suggestion';

export type LastCheckInRow = {
  id: string;
  mood: string | null;
  intensity: number | null;
  trigger_text: string | null;
  created_at: string;
};

export function useToolsHubData() {
  const { user } = useAuth();
  const [lastCheckIn, setLastCheckIn] = useState<LastCheckInRow | null>(null);
  const [suggestions, setSuggestions] = useState<PracticeSuggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setLastCheckIn(null);
      setSuggestions([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    void (async () => {
      setLoading(true);
      const [checkInRes, sugg] = await Promise.all([
        supabase
          .from('practice_entries')
          .select('id, mood, intensity, trigger_text, created_at')
          .eq('user_id', user.id)
          .eq('type', 'checkin')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        fetchPracticeSuggestions(user.id, 2),
      ]);

      if (cancelled) return;

      setLastCheckIn((checkInRes.data as LastCheckInRow | null) ?? null);
      setSuggestions(sugg);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return { lastCheckIn, suggestions, loading };
}
