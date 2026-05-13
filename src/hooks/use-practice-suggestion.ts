import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { getPracticePrimarySuggestionQueryOptions } from '@/lib/practice-primary-suggestion-query';
import type { SuggestedPracticeId } from '@/lib/practice-suggestion';

export type PracticeSuggestionPick = { id: SuggestedPracticeId; reason: string };

export { practicePrimarySuggestionQueryKey } from '@/lib/practice-primary-suggestion-query';

/**
 * Top practice suggestion for Home / pause empty states (same source as PracticeWidget).
 * Cached server read; translate `reasonKey` client-side so locale switches update without refetch.
 */
export function usePracticeSuggestion(userId: string | undefined): PracticeSuggestionPick | null {
  const { t } = useTranslation();
  const { data } = useQuery(getPracticePrimarySuggestionQueryOptions(userId));

  return useMemo(() => {
    if (!data) return null;
    return { id: data.id, reason: t(data.reasonKey) };
  }, [data, t]);
}
