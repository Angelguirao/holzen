import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tag } from 'lucide-react';

const AVAILABLE_TAGS = ['fear', 'greed', 'FOMO', 'clarity', 'anxiety', 'patience', 'doubt', 'confidence'] as const;

interface Props {
  reflectionId: string;
  initialTags: string[];
}

export function ReflectionTags({ reflectionId, initialTags }: Props) {
  const [tags, setTags] = useState<string[]>(initialTags);
  const [open, setOpen] = useState(false);

  const toggleTag = useCallback(async (tag: string) => {
    const newTags = tags.includes(tag)
      ? tags.filter((t) => t !== tag)
      : [...tags, tag];
    setTags(newTags);
    await supabase
      .from('reflections')
      .update({ tags: newTags })
      .eq('id', reflectionId);
  }, [reflectionId, tags]);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 flex-wrap">
        {tags.map((tag) => (
          <button
            key={tag}
            onClick={() => toggleTag(tag)}
            className="inline-flex items-center gap-0.5 text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            {tag}
            <span className="text-primary/50 ml-0.5">×</span>
          </button>
        ))}
        <button
          onClick={() => setOpen(!open)}
          className="inline-flex items-center gap-0.5 text-[10px] font-mono text-muted-foreground/50 hover:text-muted-foreground transition-colors"
        >
          <Tag className="h-2.5 w-2.5" />
          {tags.length === 0 ? 'Add tags' : '+'}
        </button>
      </div>

      {open && (
        <div className="flex flex-wrap gap-1">
          {AVAILABLE_TAGS.filter((t) => !tags.includes(t)).map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-border/60 text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
            >
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
