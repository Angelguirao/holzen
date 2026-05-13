import { supabase } from '@/integrations/supabase/client';
import { ADMIN_QUERY_PREFIX } from '@/lib/admin-query-namespace';

export type FallbackPoolType = 'signal' | 'grounding' | 'history' | 'zoom_out' | 'reflection';

export interface CompanionFallbackRow {
  id: string;
  pool_type: FallbackPoolType;
  sort_order: number;
  payload: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const ADMIN_COMPANION_FALLBACKS_QUERY_PREFIX = [...ADMIN_QUERY_PREFIX, 'companion-fallbacks'] as const;

export const ADMIN_COMPANION_FALLBACKS_QUERY_LEAF = 'all' as const;

export const ADMIN_COMPANION_FALLBACKS_QUERY_KEY = [
  ...ADMIN_COMPANION_FALLBACKS_QUERY_PREFIX,
  ADMIN_COMPANION_FALLBACKS_QUERY_LEAF,
] as const;

export async function fetchCompanionFallbackRows(): Promise<CompanionFallbackRow[]> {
  const { data, error } = await supabase
    .from('companion_fallbacks')
    .select('id, pool_type, sort_order, payload, is_active, created_at, updated_at')
    .order('pool_type', { ascending: true })
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data ?? []) as CompanionFallbackRow[];
}

export function getAdminCompanionFallbacksQueryOptions() {
  return {
    queryKey: ADMIN_COMPANION_FALLBACKS_QUERY_KEY,
    queryFn: fetchCompanionFallbackRows,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    retry: false,
  } as const;
}
