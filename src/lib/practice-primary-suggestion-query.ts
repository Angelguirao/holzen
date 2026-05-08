import { fetchPracticeSuggestions, type PracticeSuggestion } from '@/lib/practice-suggestion';

export const PRACTICE_SUGGESTION_QUERY_PREFIX = ['practice', 'suggestion'] as const;

export const PRACTICE_PRIMARY_SUGGESTION_QUERY_LEAF = 'primary' as const;

export const PRACTICE_PRIMARY_SUGGESTION_QUERY_PREFIX = [
  ...PRACTICE_SUGGESTION_QUERY_PREFIX,
  PRACTICE_PRIMARY_SUGGESTION_QUERY_LEAF,
] as const;

export const PRACTICE_PRIMARY_SUGGESTION_DISABLED_USER_ID = 'none' as const;

export const PRACTICE_PRIMARY_SUGGESTION_NONE_QUERY_KEY = [
  ...PRACTICE_PRIMARY_SUGGESTION_QUERY_PREFIX,
  PRACTICE_PRIMARY_SUGGESTION_DISABLED_USER_ID,
] as const;

/** Same cache slice as `usePracticeSuggestion` (Home / pause empty states). */
export function practicePrimarySuggestionQueryKey(userId: string) {
  return [...PRACTICE_PRIMARY_SUGGESTION_QUERY_PREFIX, userId] as const;
}

export async function fetchPrimaryPracticeSuggestion(userId: string): Promise<PracticeSuggestion | null> {
  const list = await fetchPracticeSuggestions(userId, 1);
  return list[0] ?? null;
}

export function getPracticePrimarySuggestionQueryOptions(userId: string | undefined) {
  return {
    queryKey: userId ? practicePrimarySuggestionQueryKey(userId) : PRACTICE_PRIMARY_SUGGESTION_NONE_QUERY_KEY,
    queryFn: () => fetchPrimaryPracticeSuggestion(userId!),
    enabled: Boolean(userId),
    staleTime: 60_000,
    refetchOnWindowFocus: true,
    retry: false,
  } as const;
}
