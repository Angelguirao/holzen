import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchPracticeSuggestions, type SuggestedPracticeId } from '@/lib/practice-suggestion';

export type PracticeSuggestionPick = { id: SuggestedPracticeId; reason: string };

/**
 * Top practice suggestion for Home / pause empty states (same source as PracticeWidget).
 */
export function usePracticeSuggestion(userId: string | undefined): PracticeSuggestionPick | null {
  const { t } = useTranslation();
  const [suggestion, setSuggestion] = useState<PracticeSuggestionPick | null>(null);

  useEffect(() => {
    if (!userId) return;
    void (async () => {
      const list = await fetchPracticeSuggestions(userId, 1);
      const first = list[0];
      if (!first) {
        setSuggestion(null);
        return;
      }
      setSuggestion({ id: first.id, reason: t(first.reasonKey) });
    })();
  }, [userId, t]);

  return suggestion;
}
