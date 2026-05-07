import { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { practiceEntriesWeeklyCountQueryKey } from '@/components/PracticeWidget';
import { practicePrimarySuggestionQueryKey } from '@/hooks/use-practice-suggestion';
import { toolsHubDataQueryKey } from '@/hooks/use-tools-hub-data';
import { invalidateHistoryCalendarActivities } from '@/lib/history-calendar-activities-query-key';
import { supabase } from '@/integrations/supabase/client';
import { invokeEdge } from '@/lib/invoke-edge';
import { useAuth } from '@/hooks/use-auth';
import { useHolzen } from '@/hooks/use-holzen';
import { hapticFeedback } from '@/lib/haptics';
import { toast } from 'sonner';
import { Check, RefreshCw, Sparkles, Loader2 } from 'lucide-react';
import { WritingField } from '@/components/WritingField';
import { companionFallbacksDisabledClient } from '@/lib/companion-strict';
import { parseEdgeFunctionError, toUserFacingAiErrorMessage } from '@/lib/edge-function-error';

const FALLBACK_PROMPTS = [
  'practice.prompt1',
  'practice.prompt2',
  'practice.prompt3',
  'practice.prompt4',
  'practice.prompt5',
  'practice.prompt6',
];

export function guidedJournalPromptsQueryKey(userId: string, language: string) {
  return ['practice', 'guided-journal', 'prompts', userId, language] as const;
}

type GuidedJournalPromptsBundle = {
  prompts: string[];
  isAI: boolean;
  promptLoadFailed: boolean;
  suggestedIndex: number;
};

async function fetchGuidedJournalPrompts(language: string, t: TFunction): Promise<GuidedJournalPromptsBundle> {
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

interface Props {
  onComplete: () => void;
  textColor: string;
  ringColor: string;
}

export function GuidedJournal({ onComplete, textColor, ringColor }: Props) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { language } = useHolzen();
  const [promptIndex, setPromptIndex] = useState(0);
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const wasPromptsPendingRef = useRef(false);

  const promptsQuery = useQuery({
    queryKey: user ? guidedJournalPromptsQueryKey(user.id, language) : ['practice', 'guided-journal', 'prompts', '__none__', language],
    queryFn: () => fetchGuidedJournalPrompts(language, t),
    enabled: Boolean(user),
    staleTime: 10 * 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const prompts = promptsQuery.data?.prompts ?? [];
  const isAI = promptsQuery.data?.isAI ?? false;
  const promptLoadFailed = promptsQuery.data?.promptLoadFailed ?? false;
  const loadingPrompts = Boolean(user) && promptsQuery.isPending;

  useEffect(() => {
    if (promptsQuery.isPending) {
      wasPromptsPendingRef.current = true;
      return;
    }
    if (wasPromptsPendingRef.current && promptsQuery.data) {
      setPromptIndex(promptsQuery.data.suggestedIndex);
      wasPromptsPendingRef.current = false;
    }
  }, [promptsQuery.isPending, promptsQuery.data]);

  const prompt = prompts[promptIndex] ?? '';

  const shufflePrompt = useCallback(() => {
    setPromptIndex((prev) => (prev + 1) % (prompts.length || 1));
    hapticFeedback('light');
  }, [prompts.length]);

  const save = useCallback(async () => {
    if (!user) {
      toast.error(t('auth.signInToContinue'));
      return;
    }
    if (!body.trim()) return;
    setSaving(true);
    try {
      const { error: practiceError } = await supabase.from('practice_entries').insert({
        user_id: user.id,
        type: 'journal',
        body: body.trim(),
        prompt,
      });
      if (practiceError) throw practiceError;
      void queryClient.invalidateQueries({ queryKey: practiceEntriesWeeklyCountQueryKey(user.id) });
      void queryClient.invalidateQueries({ queryKey: practicePrimarySuggestionQueryKey(user.id) });
      void queryClient.invalidateQueries({ queryKey: toolsHubDataQueryKey(user.id) });
      invalidateHistoryCalendarActivities(queryClient, user.id);
      hapticFeedback('success');
      setDone(true);
      setTimeout(onComplete, 1500);
    } catch {
      toast(t('common.tryAgain'));
    } finally {
      setSaving(false);
    }
  }, [user, body, prompt, onComplete, t, queryClient]);

  return (
    <motion.div
      className="flex flex-col items-center gap-6 max-w-sm mx-auto w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <AnimatePresence mode="wait">
        {!done ? (
          <motion.div key="write" className="flex flex-col items-center gap-6 w-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {loadingPrompts ? (
              <div className="flex items-center gap-2 py-4">
                <Loader2 className="h-3 w-3 animate-spin" style={{ color: textColor, opacity: 0.4 }} />
                <p className="text-[10px] font-mono tracking-wider" style={{ color: textColor, opacity: 0.4 }}>
                  {t('practice.generatingPrompt')}
                </p>
              </div>
            ) : promptLoadFailed ? (
              <p className="text-xs font-mono text-center leading-relaxed max-w-[260px]" style={{ color: textColor, opacity: 0.55 }}>
                {t('practice.journalPromptFailed')}
              </p>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-center gap-1.5">
                  {isAI && (
                    <div className="flex items-center gap-1" style={{ color: textColor, opacity: 0.3 }}>
                      <Sparkles className="h-2.5 w-2.5" />
                      <span className="text-[8px] font-mono tracking-[0.2em] uppercase">
                        {t('practice.aiGenerated')}
                      </span>
                    </div>
                  )}
                  <p className="text-xs font-mono text-center leading-relaxed max-w-[260px]" style={{ color: textColor, opacity: 0.7 }}>
                    {prompt}
                  </p>
                </div>
                <button onClick={shufflePrompt} className="shrink-0 p-1.5 rounded-full transition-opacity hover:opacity-80" style={{ color: textColor, opacity: 0.3 }}>
                  <RefreshCw className="h-3 w-3" />
                </button>
              </div>
            )}

            <WritingField
              value={body}
              onChange={setBody}
              placeholder={t('practice.journalPlaceholder')}
              minRows={5}
              autoFocus
              disableFocusMode
              textareaStyle={{ borderColor: ringColor, color: textColor, opacity: 0.8 }}
              textareaClassName="bg-transparent"
            />

            <button
              onClick={save}
              disabled={saving || !body.trim()}
              className="text-[10px] font-mono tracking-[0.2em] uppercase transition-opacity disabled:opacity-20"
              style={{ color: textColor, opacity: 0.7 }}
            >
              {saving ? t('common.loading') : t('common.done')}
            </button>
          </motion.div>
        ) : (
          <motion.div key="done" className="flex flex-col items-center gap-4" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
            <Check className="h-8 w-8" style={{ color: textColor, opacity: 0.6 }} />
            <p className="text-[10px] font-mono tracking-[0.3em] uppercase" style={{ color: textColor, opacity: 0.5 }}>
              {t('practice.journalSaved')}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
