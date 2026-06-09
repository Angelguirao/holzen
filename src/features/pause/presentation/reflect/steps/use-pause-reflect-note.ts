import { useCallback, useEffect, useState, useTransition } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/public';
import { pauseReflectNoteUpdate } from './pause-reflect-steps-io';
import {
  getLatestPauseReflectNoteQueryOptions,
  PAUSE_REFLECT_STEP_NOTE,
  pauseArchiveListQueryPrefix,
  pauseReflectStepLatestQueryKey,
} from '@/features/pause/public-queries';

/** Reflect post-it note: hydrate from latest step event, commit on blur via `pause_log_step`. */
export function usePauseReflectNote(pauseInstanceId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [note, setNote] = useState('');
  const [isPending, startTransition] = useTransition();

  const { data: serverNote = '' } = useQuery(getLatestPauseReflectNoteQueryOptions(pauseInstanceId));

  useEffect(() => {
    setNote(serverNote);
  }, [pauseInstanceId, serverNote]);

  const commit = useCallback(
    (next: string) => {
      startTransition(async () => {
        try {
          const outcome = await pauseReflectNoteUpdate({
            pauseInstanceId,
            text: next,
          });
          if (outcome.status === 'sync_failed') return;
          if (user?.id) {
            void queryClient.invalidateQueries({ queryKey: pauseArchiveListQueryPrefix(user.id) });
          }
          void queryClient.invalidateQueries({
            queryKey: pauseReflectStepLatestQueryKey(pauseInstanceId, PAUSE_REFLECT_STEP_NOTE),
          });
        } catch {
          /* ignore */
        }
      });
    },
    [pauseInstanceId, queryClient, user?.id, startTransition],
  );

  const commitOnBlur = useCallback(() => commit(note), [commit, note]);

  return { note, setNote, saving: isPending, commit, commitOnBlur };
}
