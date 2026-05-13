import { supabase } from '@/integrations/supabase/client';
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

export const TOOLS_HUB_QUERY_PREFIX = ['tools-hub'] as const;

export const TOOLS_HUB_DATA_QUERY_LEAF = 'data' as const;

export const TOOLS_HUB_DATA_QUERY_PREFIX = [
  ...TOOLS_HUB_QUERY_PREFIX,
  TOOLS_HUB_DATA_QUERY_LEAF,
] as const;

export const TOOLS_HUB_DATA_DISABLED_USER_ID = 'none' as const;

export const TOOLS_HUB_DATA_NONE_QUERY_KEY = [
  ...TOOLS_HUB_DATA_QUERY_PREFIX,
  TOOLS_HUB_DATA_DISABLED_USER_ID,
] as const;

export function toolsHubDataQueryKey(userId: string) {
  return [...TOOLS_HUB_DATA_QUERY_PREFIX, userId] as const;
}

export async function fetchToolsHubData(userId: string): Promise<ToolsHubData> {
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

export function getToolsHubDataQueryOptions(userId: string | undefined) {
  return {
    queryKey: userId ? toolsHubDataQueryKey(userId) : TOOLS_HUB_DATA_NONE_QUERY_KEY,
    queryFn: () => fetchToolsHubData(userId!),
    enabled: Boolean(userId),
    staleTime: 60_000,
    refetchOnWindowFocus: true,
    retry: false,
  } as const;
}
