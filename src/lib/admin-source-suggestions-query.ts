import { supabase } from '@/integrations/supabase/client';

export interface SourceSuggestionRow {
  id: string;
  category: 'signal' | 'grounding';
  suggested_name: string;
  suggested_url: string | null;
  suggested_type: string;
  dedupe_key: string;
  status: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  reviewed_at: string | null;
}

export const ADMIN_PENDING_SOURCE_SUGGESTIONS_QUERY_PREFIX = ['admin', 'signal-source-suggestions'] as const;

export const ADMIN_PENDING_SOURCE_SUGGESTIONS_QUERY_LEAF = 'pending' as const;

export const ADMIN_PENDING_SOURCE_SUGGESTIONS_QUERY_KEY = [
  ...ADMIN_PENDING_SOURCE_SUGGESTIONS_QUERY_PREFIX,
  ADMIN_PENDING_SOURCE_SUGGESTIONS_QUERY_LEAF,
] as const;

export async function fetchPendingSourceSuggestionsRows(): Promise<SourceSuggestionRow[]> {
  const { data, error } = await supabase
    .from('signal_source_suggestions')
    .select(
      'id, category, suggested_name, suggested_url, suggested_type, dedupe_key, status, metadata, created_at, reviewed_at',
    )
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as SourceSuggestionRow[];
}

export function getAdminPendingSourceSuggestionsQueryOptions() {
  return {
    queryKey: ADMIN_PENDING_SOURCE_SUGGESTIONS_QUERY_KEY,
    queryFn: fetchPendingSourceSuggestionsRows,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    retry: false,
  } as const;
}
