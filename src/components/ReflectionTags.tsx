import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Tag as TagIcon, X } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Tag } from '@/components/ui/tag';
import { Input } from '@/components/ui/input';

interface Props {
  reflectionId: string;
  initialTags: string[];
}

export function ReflectionTags({ reflectionId, initialTags }: Props) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [tags, setTags] = useState<string[]>(initialTags);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [allUserTags, setAllUserTags] = useState<string[]>([]);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open || !user) return;
    const fetchTags = async () => {
      const { data } = await supabase
        .from('reflections')
        .select('tags')
        .eq('user_id', user.id);
      const set = new Set<string>();
      data?.forEach((r) => r.tags?.forEach((t: string) => set.add(t)));
      setAllUserTags(Array.from(set).sort());
    };
    fetchTags();
  }, [open, user]);

  useEffect(() => {
    if (!input.trim()) {
      setSuggestions(allUserTags.filter((t) => !tags.includes(t)).slice(0, 8));
    } else {
      const q = input.toLowerCase();
      setSuggestions(
        allUserTags
          .filter((t) => t.toLowerCase().includes(q) && !tags.includes(t))
          .slice(0, 6)
      );
    }
    setHighlightIdx(-1);
  }, [input, allUserTags, tags]);

  const addTag = useCallback(async (tag: string) => {
    const trimmed = tag.trim().toLowerCase();
    if (!trimmed || tags.includes(trimmed)) return;
    const newTags = [...tags, trimmed];
    setTags(newTags);
    setInput('');
    await supabase
      .from('reflections')
      .update({ tags: newTags })
      .eq('id', reflectionId);
  }, [reflectionId, tags]);

  const removeTag = useCallback(async (tag: string) => {
    const newTags = tags.filter((t) => t !== tag);
    setTags(newTags);
    await supabase
      .from('reflections')
      .update({ tags: newTags })
      .eq('id', reflectionId);
  }, [reflectionId, tags]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightIdx >= 0 && suggestions[highlightIdx]) {
        addTag(suggestions[highlightIdx]);
      } else if (input.trim()) {
        addTag(input);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 flex-wrap">
        {tags.map((tag) => (
          <button
            key={tag}
            onClick={() => removeTag(tag)}
            className="inline-flex items-center gap-1 rounded-full border border-input bg-background px-2 py-0.5 text-[10px] font-mono text-foreground transition-colors hover:bg-accent"
          >
            <Tag state="selected" className="px-1.5 py-0 text-[10px] font-mono">{tag}</Tag>
            <X className="h-2.5 w-2.5 text-muted-foreground" />
          </button>
        ))}
        <button
          onClick={() => setOpen(!open)}
          className="inline-flex items-center gap-0.5 text-[10px] font-mono text-muted-foreground/50 hover:text-muted-foreground transition-colors"
        >
          <TagIcon className="h-2.5 w-2.5" />
          {tags.length === 0 ? t('reflectionTags.addTags') : '+'}
        </button>
      </div>

      {open && (
        <div className="space-y-1.5">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('reflectionTags.typeTag')}
            className="h-8 text-[11px] font-mono placeholder:text-muted-foreground/40"
          />
          {suggestions.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {suggestions.map((tag, idx) => (
                <button
                  key={tag}
                  onClick={() => addTag(tag)}
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded border transition-colors ${
                    idx === highlightIdx
                      ? 'border-primary/40 bg-primary/10 text-foreground'
                      : 'border-border/60 text-muted-foreground hover:text-foreground hover:border-foreground/30'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
          {input.trim() && !allUserTags.includes(input.trim().toLowerCase()) && (
            <p className="text-[10px] font-mono text-muted-foreground/50">
              {t('reflectionTags.pressEnterToCreate', { tag: input.trim() })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
