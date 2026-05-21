import { useCallback, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/public';
import { logPauseReflectNote } from '@/features/pause/public-rpc';
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
  const [saving, setSaving] = useState(false);

  const { data: serverNote = '' } = useQuery(getLatestPauseReflectNoteQueryOptions(pauseInstanceId));

  useEffect(() => {
    setNote(serverNote);
  }, [pauseInstanceId, serverNote]);

  const commit = useCallback(
    async (next: string) => {
      setSaving(true);
      try {
        const outcome = await logPauseReflectNote({ pauseInstanceId, text: next });
        if (outcome.status === 'sync_failed') return;
        if (user?.id) {
          void queryClient.invalidateQueries({ queryKey: pauseArchiveListQueryPrefix(user.id) });
        }
        void queryClient.invalidateQueries({
          queryKey: pauseReflectStepLatestQueryKey(pauseInstanceId, PAUSE_REFLECT_STEP_NOTE),
        });
      } catch {
        /* ignore */
      } finally {
        setSaving(false);
      }
    },
    [pauseInstanceId, queryClient, user?.id],
  );

  const commitOnBlur = useCallback(() => void commit(note), [commit, note]);

  return { note, setNote, saving, commitOnBlur };
}
