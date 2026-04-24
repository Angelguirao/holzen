import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tag, X } from 'lucide-react';
import { pauseLogStep } from '@/lib/pause-api';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  pauseInstanceId: string;
}

export function PauseTags({ pauseInstanceId }: Props) {
  const { t } = useTranslation();
  const [tags, setTags] = useState<string[]>([]);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { data } = await supabase
        .from('pause_step_events' as never)
        .select('payload, created_at')
        .eq('pause_instance_id', pauseInstanceId)
        .eq('step_type', 'tag_updated')
        .order('created_at', { ascending: false })
        .limit(1);
      if (cancelled) return;
      const rows = (data ?? []) as Array<{ payload: Record<string, unknown> }>;
      const arr = rows[0]?.payload?.tags;
      setTags(Array.isArray(arr) ? (arr as string[]).slice() : []);
    })();
    return () => {
      cancelled = true;
    };
  }, [pauseInstanceId]);

  async function commit(next: string[]) {
    setTags(next);
    await pauseLogStep({
      instanceId: pauseInstanceId,
      stepType: 'tag_updated',
      payload: { tags: next },
    }).catch(() => undefined);
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
            className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/5 px-2 py-0.5 text-[10px] font-mono text-primary"
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
