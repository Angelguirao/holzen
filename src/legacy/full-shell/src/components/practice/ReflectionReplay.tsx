/**
 * Pause V2 — Daily Practice replay: load one completed pause, show Holzen’s reflect prompt
 * plus chronological notes and replay lines, and append new `practice_entries` replay rows
 * tied to `pause_instance_id`.
 */

import { useCallback, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { practiceEntriesWeeklyCountQueryKey } from '@/legacy/full-shell/src/lib/practice-entries-weekly-count-query';
import { practicePrimarySuggestionQueryKey } from '@/legacy/full-shell/src/lib/practice-primary-suggestion-query';
import { toolsHubDataQueryKey } from '@/legacy/full-shell/src/lib/tools-hub-data-query';
import { invalidateHistoryCalendarActivities } from '@/legacy/full-shell/src/lib/history-calendar-activities-query-key';
import { useAuth } from '@/features/auth/public';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import type { UserWord } from '../../../supabase/functions/_shared/past-reflection-util';
import {
  getPauseReplayThreadQueryOptions,
  getReplayRecentPausesQueryOptions,
  pauseReplayThreadQueryKey,
  replayRecentPausesQueryKey,
  type PausePickerRow,
} from '@/legacy/full-shell/src/lib/pause-replay-thread';

interface Props {
  onComplete?: () => void;
  textColor?: string;
  ringColor?: string;
  initialPauseInstanceId?: string;
}

function ThreadLine({ word }: { word: UserWord }) {
  const { t } = useTranslation();
  const label =
    word.kind === 'note'
      ? t('practice.replayYourNote', { defaultValue: 'Your note' })
      : t('practice.replayYourReplay', { defaultValue: 'Your replay' });
  return (
    <div className="rounded-md border border-border/40 bg-muted/10 px-3 py-2 space-y-1">
      <p className="text-[9px] font-mono text-muted-foreground/60 uppercase tracking-wider">
        {label} · {format(new Date(word.created_at), 'MMM d, yyyy HH:mm')}
      </p>
      <p className="text-sm text-foreground/85 whitespace-pre-wrap leading-relaxed">{word.body}</p>
    </div>
  );
}

export function ReflectionReplay({ onComplete, initialPauseInstanceId }: Props) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(initialPauseInstanceId ?? null);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);

  const {
    data: picker = [],
    isPending: loadingList,
  } = useQuery(
    getReplayRecentPausesQueryOptions({
      userId: user?.id,
      listEnabled: !selectedId,
    }),
  );

  const threadQuery = useQuery(
    getPauseReplayThreadQueryOptions({
      userId: user?.id,
      pauseInstanceId: selectedId,
    }),
  );

  const thread = threadQuery.data ?? null;
  /** Full-screen spinner until the first thread payload exists (initial pick or refetch after error). */
  const loadingThread = threadQuery.isPending || (threadQuery.isFetching && !thread);
  const threadLoadError = threadQuery.isError;

  useEffect(() => {
    if (!threadLoadError) return;
    toast.error(
      t('practice.replayLoadFailed', {
        defaultValue: 'Could not load this pause.',
      }),
    );
  }, [threadLoadError, t]);

  useEffect(() => {
    if (!threadQuery.isSuccess) return;
    setDraft('');
  }, [threadQuery.dataUpdatedAt, threadQuery.isSuccess]);

  const saveReplay = useCallback(async () => {
    if (!user || !selectedId) return;
    const body = draft.trim();
    if (!body) {
      toast.error(t('common.tryAgain', { defaultValue: 'Try again' }));
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('practice_entries').insert({
        user_id: user.id,
        type: 'replay',
        body,
        pause_instance_id: selectedId,
      });
      if (error) throw error;
      void queryClient.invalidateQueries({ queryKey: practiceEntriesWeeklyCountQueryKey(user.id) });
      void queryClient.invalidateQueries({ queryKey: practicePrimarySuggestionQueryKey(user.id) });
      void queryClient.invalidateQueries({ queryKey: toolsHubDataQueryKey(user.id) });
      void queryClient.invalidateQueries({ queryKey: replayRecentPausesQueryKey(user.id) });
      void queryClient.invalidateQueries({ queryKey: pauseReplayThreadQueryKey(selectedId) });
      invalidateHistoryCalendarActivities(queryClient, user.id);
      toast.success(t('practice.replaySaved', { defaultValue: 'Replay saved' }));
    } catch {
      toast.error(t('common.tryAgain', { defaultValue: 'Try again' }));
    } finally {
      setSaving(false);
    }
  }, [user, selectedId, draft, t, queryClient]);

  if (!user) {
    return (
      <p className="text-sm text-muted-foreground text-center px-4">
        {t('auth.signInToContinue')}
      </p>
    );
  }

  if (!selectedId) {
    if (loadingList) {
      return (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden />
        </div>
      );
    }
    if (picker.length === 0) {
      return (
        <p className="text-sm text-muted-foreground text-center max-w-sm mx-auto px-4">
          {t('practice.replayNoPauses', {
            defaultValue: 'No completed pauses yet. Finish a pause, then open Replay again.',
          })}
        </p>
      );
    }
    return (
      <div className="space-y-3 px-1 w-full max-w-md mx-auto">
        <p className="text-xs text-muted-foreground text-center">
          {t('practice.replaySelectPause', { defaultValue: 'Choose a pause to revisit' })}
        </p>
        <ul className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
          {picker.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => setSelectedId(p.id)}
                className="w-full text-left rounded-lg border border-border/50 bg-card/40 px-3 py-2.5 hover:bg-card/70 transition-colors"
              >
                <p className="text-[10px] font-mono text-muted-foreground/70">
                  {format(new Date(p.created_at), 'MMM d, yyyy')}
                </p>
                <p className="text-xs text-foreground/80 line-clamp-2 mt-0.5">
                  {(p.reflection_text ?? '').trim() || t('practice.replayUntitled', { defaultValue: 'Pause' })}
                </p>
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (loadingThread) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden />
      </div>
    );
  }

  if (!thread) {
    if (threadLoadError) {
      return (
        <div className="flex flex-col items-center gap-4 px-4 py-8 max-w-md mx-auto text-center">
          <p className="text-sm text-muted-foreground">{t('practice.replayLoadFailed')}</p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                void threadQuery.refetch();
              }}
            >
              {t('common.tryAgain', { defaultValue: 'Try again' })}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedId(null);
              }}
            >
              {t('practice.replayChangePause', { defaultValue: 'Change pause' })}
            </Button>
            {onComplete && (
              <Button type="button" variant="outline" size="sm" onClick={onComplete}>
                {t('common.done', { defaultValue: 'Done' })}
              </Button>
            )}
          </div>
        </div>
      );
    }
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full max-w-md mx-auto px-1 pb-8">
      <div className="flex flex-col gap-2 self-start w-full">
        {initialPauseInstanceId && (
          <p className="text-[10px] text-muted-foreground/80 leading-relaxed">
            {t('practice.replayFromEchoHint')}
          </p>
        )}
        <button
          type="button"
          onClick={() => {
            setSelectedId(null);
          }}
          className="text-[10px] font-sans font-medium text-nox-text-link/90 underline-offset-2 transition-colors hover:text-nox-text-link hover:underline self-start"
        >
          {t('practice.replayChangePause', { defaultValue: '← Change pause' })}
        </button>
      </div>

      <div className="text-center space-y-1">
        <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">
          {format(new Date(thread.created_at), 'MMMM d, yyyy')}
        </p>
        {thread.context && (
          <p className="text-xs text-muted-foreground/90 leading-snug">{thread.context}</p>
        )}
      </div>

      {thread.aiPrompt && (
        <div className="rounded-lg border border-border/40 bg-muted/15 px-3 py-2.5 space-y-1">
          <p className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-wider">
            {t('practice.replayHolzenAsked')}
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed italic whitespace-pre-wrap">
            {thread.aiPrompt}
          </p>
        </div>
      )}

      {thread.userWords.length === 0 && (
        <p className="text-xs text-muted-foreground text-center">{t('practice.replayNoWordsYet')}</p>
      )}

      {thread.userWords.length > 0 && (
        <div className="space-y-2">
          {thread.userWords.map((w, i) => (
            <ThreadLine key={`${w.created_at}-${i}`} word={w} />
          ))}
        </div>
      )}

      <div className="space-y-2 pt-2 border-t border-border/30">
        <label htmlFor="replay-draft" className="text-[10px] font-mono text-muted-foreground/70 uppercase tracking-wider">
          {t('practice.replayNewEntry')}
        </label>
        <Textarea
          id="replay-draft"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t('practice.replayPlaceholder')}
          rows={4}
          className="text-sm resize-none bg-background/60"
        />
        <div className="flex gap-2 justify-end">
          {onComplete && (
            <Button type="button" variant="ghost" size="sm" onClick={onComplete}>
              {t('common.done', { defaultValue: 'Done' })}
            </Button>
          )}
          <Button type="button" size="sm" onClick={() => void saveReplay()} disabled={saving || !draft.trim()}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : t('common.save')}
          </Button>
        </div>
      </div>
    </div>
  );
}
