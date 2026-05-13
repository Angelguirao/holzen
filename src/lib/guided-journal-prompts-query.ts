import type { TFunction } from 'i18next';
import { toast } from 'sonner';
import { invokeEdge } from '@/lib/invoke-edge';
import { companionFallbacksDisabledClient } from '@/lib/companion-strict';
import { parseEdgeFunctionError, toUserFacingAiErrorMessage } from '@/lib/edge-function-error';
import { PRACTICE_QUERY_PREFIX } from '@/lib/practice-query-namespace';

const FALLBACK_PROMPTS = [
  'practice.prompt1',
  'practice.prompt2',
  'practice.prompt3',
  'practice.prompt4',
  'practice.prompt5',
  'practice.prompt6',
] as const;

export const PRACTICE_GUIDED_JOURNAL_QUERY_PREFIX = [...PRACTICE_QUERY_PREFIX, 'guided-journal'] as const;

export const GUIDED_JOURNAL_PROMPTS_QUERY_LEAF = 'prompts' as const;

export const GUIDED_JOURNAL_PROMPTS_QUERY_PREFIX = [
  ...PRACTICE_GUIDED_JOURNAL_QUERY_PREFIX,
  GUIDED_JOURNAL_PROMPTS_QUERY_LEAF,
] as const;

/** `userId` segment for {@link guidedJournalPromptsNoneQueryKey} when signed out. */
export const GUIDED_JOURNAL_PROMPTS_DISABLED_USER_ID = '__none__' as const;

export function guidedJournalPromptsQueryKey(userId: string, language: string) {
  return [...GUIDED_JOURNAL_PROMPTS_QUERY_PREFIX, userId, language] as const;
}

export function guidedJournalPromptsNoneQueryKey(language: string) {
  return [
    ...GUIDED_JOURNAL_PROMPTS_QUERY_PREFIX,
    GUIDED_JOURNAL_PROMPTS_DISABLED_USER_ID,
    language,
  ] as const;
}

export type GuidedJournalPromptsBundle = {
  prompts: string[];
  isAI: boolean;
  promptLoadFailed: boolean;
  suggestedIndex: number;
};

export async function fetchGuidedJournalPrompts(
  language: string,
  t: TFunction,
): Promise<GuidedJournalPromptsBundle> {
  try {
    const { data, error } = await invokeEdge<{ prompts?: string[] }>('journal-prompt', {
      body: { language },
    });
    if (error) throw error;
    const aiPrompts = data?.prompts;
    if (Array.isArray(aiPrompts) && aiPrompts.length > 0) {
      return { prompts: aiPrompts, isAI: true, promptLoadFailed: false, suggestedIndex: 0 };
    }
    throw new Error('Empty response');
  } catch (error: unknown) {
    const parsed = await parseEdgeFunctionError(error);
    const message = toUserFacingAiErrorMessage(parsed, t('practice.journalPromptFailed'));
    if (parsed.code === 'ai_action_quota_exceeded' || parsed.code === 'ai_action_upgrade_required') {
      toast(message);
    }
    if (companionFallbacksDisabledClient()) {
      toast.error(t('practice.journalPromptFailed'));
      return { prompts: [], isAI: false, promptLoadFailed: true, suggestedIndex: 0 };
    }
    const fallback = FALLBACK_PROMPTS.map((k) => t(k));
    return {
      prompts: fallback,
      isAI: false,
      promptLoadFailed: false,
      suggestedIndex: Math.floor(Math.random() * fallback.length),
    };
  }
}

export function getGuidedJournalPromptsQueryOptions(params: {
  userId: string | undefined;
  language: string;
  t: TFunction;
}) {
  const { userId, language, t } = params;
  return {
    queryKey: userId ? guidedJournalPromptsQueryKey(userId, language) : guidedJournalPromptsNoneQueryKey(language),
    queryFn: () => fetchGuidedJournalPrompts(language, t),
    enabled: Boolean(userId),
    staleTime: 10 * 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  } as const;
}
