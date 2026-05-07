import { supabase } from '@/integrations/supabase/client';

export interface FutureLetterRow {
  id: string;
  body: string;
  written_during: string;
  deliver_during: string;
  btc_price_at_write: number;
  written_at: string;
  delivered: boolean;
  delivered_at: string | null;
  btc_price_at_delivery: number | null;
  delivery_threshold: number | null;
}

export const FUTURE_LETTERS_LIST_NONE_QUERY_KEY = ['future-letters', 'list', 'none'] as const;

export function futureLettersListQueryKey(userId: string) {
  return ['future-letters', 'list', userId] as const;
}

export async function fetchFutureLettersList(userId: string): Promise<FutureLetterRow[]> {
  const { data, error } = await supabase
    .from('future_letters')
    .select('*')
    .eq('user_id', userId)
    .order('written_at', { ascending: false });
  if (error) throw error;
  return (data as unknown as FutureLetterRow[]) ?? [];
}

export function getFutureLettersListQueryOptions(userId: string | undefined) {
  return {
    queryKey: userId ? futureLettersListQueryKey(userId) : FUTURE_LETTERS_LIST_NONE_QUERY_KEY,
    queryFn: () => fetchFutureLettersList(userId!),
    enabled: Boolean(userId),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  } as const;
}
