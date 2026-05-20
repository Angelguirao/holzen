import { useTranslation } from 'react-i18next';
import { Tag, X } from 'lucide-react';
import { usePauseReflectTags } from '@/features/pause/public-hooks';

interface Props {
  pauseInstanceId: string;
}

export function PauseTags({ pauseInstanceId }: Props) {
  const { t } = useTranslation();
  const { tags, draft, setDraft, addDraft, removeTag } = usePauseReflectTags(pauseInstanceId);

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
              onClick={() => removeTag(tag)}
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
