import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { fetchPracticeSuggestions, type SuggestedPracticeId } from '@/lib/practice-suggestion';

export type PracticeSuggestionPick = { id: SuggestedPracticeId; reason: string };

export function practicePrimarySuggestionQueryKey(userId: string) {
  return ['practice', 'suggestion', 'primary', userId] as const;
}

async function fetchPrimarySuggestionRaw(userId: string) {
  const list = await fetchPracticeSuggestions(userId, 1);
  return list[0] ?? null;
}

/**
 * Top practice suggestion for Home / pause empty states (same source as PracticeWidget).
 * Cached server read; translate `reasonKey` client-side so locale switches update without refetch.
 */
export function usePracticeSuggestion(userId: string | undefined): PracticeSuggestionPick | null {
  const { t } = useTranslation();
  const { data } = useQuery({
    queryKey: userId ? practicePrimarySuggestionQueryKey(userId) : ['practice', 'suggestion', 'primary', 'none'],
    queryFn: () => fetchPrimarySuggestionRaw(userId!),
    enabled: Boolean(userId),
    staleTime: 60_000,
    refetchOnWindowFocus: true,
    retry: false,
  });

  return useMemo(() => {
    if (!data) return null;
    return { id: data.id, reason: t(data.reasonKey) };
  }, [data, t]);
}
