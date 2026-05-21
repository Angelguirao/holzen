import { useCallback, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/public';
import { logPauseReflectTags } from '@/features/pause/public-rpc';
import {
  getLatestPauseReflectTagsQueryOptions,
  PAUSE_REFLECT_STEP_TAGS,
  pauseArchiveListQueryPrefix,
  pauseReflectStepLatestQueryKey,
} from '@/features/pause/public-queries';

/** Reflect post-it tags: hydrate from latest step event, commit via `pause_log_step`. */
export function usePauseReflectTags(pauseInstanceId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tags, setTags] = useState<string[]>([]);
  const [draft, setDraft] = useState('');

  const { data: serverTags = [] } = useQuery(getLatestPauseReflectTagsQueryOptions(pauseInstanceId));

  useEffect(() => {
    setTags(serverTags);
  }, [pauseInstanceId, serverTags]);

  const commit = useCallback(
    async (next: string[]) => {
      setTags(next);
      try {
        const outcome = await logPauseReflectTags({ pauseInstanceId, tags: next });
        if (outcome.status === 'sync_failed') return;
        if (user?.id) {
          void queryClient.invalidateQueries({ queryKey: pauseArchiveListQueryPrefix(user.id) });
        }
        void queryClient.invalidateQueries({
          queryKey: pauseReflectStepLatestQueryKey(pauseInstanceId, PAUSE_REFLECT_STEP_TAGS),
        });
      } catch {
        /* ignore */
      }
    },
    [pauseInstanceId, queryClient, user?.id],
  );

  const addDraft = useCallback(() => {
    const clean = draft.trim().toLowerCase().replace(/^#/, '');
    if (!clean) return;
    if (tags.includes(clean)) {
      setDraft('');
      return;
    }
    void commit([...tags, clean].slice(0, 8));
    setDraft('');
  }, [commit, draft, tags]);

  const removeTag = useCallback((tag: string) => void commit(tags.filter((x) => x !== tag)), [commit, tags]);

  return { tags, draft, setDraft, addDraft, removeTag };
}
