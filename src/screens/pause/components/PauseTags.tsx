import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Tag, X } from 'lucide-react';
import { useAuth } from '@/features/auth/public';
import { pauseArchiveListQueryPrefix } from '@/features/pause/public';
import { pauseLogStep } from '@/features/pause/public-rpc';
import {
  getLatestPauseReflectTagsQueryOptions,
  PAUSE_REFLECT_STEP_TAGS,
  pauseReflectStepLatestQueryKey,
} from '@/features/pause/public-queries';

interface Props {
  pauseInstanceId: string;
}

export function PauseTags({ pauseInstanceId }: Props) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tags, setTags] = useState<string[]>([]);
  const [draft, setDraft] = useState('');

  const { data: serverTags = [] } = useQuery(getLatestPauseReflectTagsQueryOptions(pauseInstanceId));

  useEffect(() => {
    setTags(serverTags);
  }, [pauseInstanceId, serverTags]);

  async function commit(next: string[]) {
    setTags(next);
    try {
      await pauseLogStep({
        instanceId: pauseInstanceId,
        stepType: 'tag_updated',
        payload: { tags: next },
      });
      if (user?.id) {
        void queryClient.invalidateQueries({ queryKey: pauseArchiveListQueryPrefix(user.id) });
      }
      void queryClient.invalidateQueries({
        queryKey: pauseReflectStepLatestQueryKey(pauseInstanceId, PAUSE_REFLECT_STEP_TAGS),
      });
    } catch {
      /* ignore */
    }
  }

  function addDraft() {
    const clean = draft.trim().toLowerCase().replace(/^#/, '');
    if (!clean) return;
    if (tags.includes(clean)) {
      setDraft('');
      return;
    }
    void commit([...tags, clean].slice(0, 8));
    setDraft('');
  }

  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Tag className="h-3 w-3" aria-hidden />
        {t('pause.reflect.tagsLabel', { defaultValue: 'Tags' })}
      </label>
      <div className="flex flex-wrap items-center gap-1.5">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/30 px-2 py-0.5 text-[10px] font-mono text-muted-foreground"
          >
            #{tag}
            <button
              type="button"
              onClick={() => void commit(tags.filter((x) => x !== tag))}
              aria-label={`Remove ${tag}`}
              className="text-muted-foreground/60 hover:text-foreground"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addDraft();
            }
          }}
          onBlur={addDraft}
          placeholder={t('pause.reflect.tagsPlaceholder', { defaultValue: 'Add a tag…' })}
          className="flex-1 min-w-24 rounded-full border border-dashed border-border/50 bg-transparent px-2 py-0.5 text-[10px] font-mono focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>
    </div>
  );
}
