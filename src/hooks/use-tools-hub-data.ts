import { useQuery } from '@tanstack/react-query';
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

export type ToolsHubData = {
  lastCheckIn: LastCheckInRow | null;
  suggestions: PracticeSuggestion[];
};

export function toolsHubDataQueryKey(userId: string) {
  return ['tools-hub', 'data', userId] as const;
}

async function fetchToolsHubData(userId: string): Promise<ToolsHubData> {
  const [checkInRes, suggestions] = await Promise.all([
    supabase
      .from('practice_entries')
      .select('id, mood, intensity, trigger_text, created_at')
      .eq('user_id', userId)
      .eq('type', 'checkin')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    fetchPracticeSuggestions(userId, 2),
  ]);

  return {
    lastCheckIn: (checkInRes.data as LastCheckInRow | null) ?? null,
    suggestions,
  };
}

export function useToolsHubData() {
  const { user } = useAuth();
  const userId = user?.id;

  const { data, isPending } = useQuery({
    queryKey: userId ? toolsHubDataQueryKey(userId) : ['tools-hub', 'data', 'none'],
    queryFn: () => fetchToolsHubData(userId!),
    enabled: Boolean(userId),
    staleTime: 60_000,
    refetchOnWindowFocus: true,
    retry: false,
  });

  return {
    lastCheckIn: data?.lastCheckIn ?? null,
    suggestions: data?.suggestions ?? [],
    loading: Boolean(userId) && isPending,
  };
}
