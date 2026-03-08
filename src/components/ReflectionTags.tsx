import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Tag, X } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

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

  // Fetch all tags the user has ever used (for autocomplete)
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

  // Update suggestions when input changes
  useEffect(() => {
    if (!input.trim()) {
      // Show unused tags as suggestions when input is empty
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
            className="inline-flex items-center gap-0.5 text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            {tag}
            <X className="h-2.5 w-2.5 text-primary/50 ml-0.5" />
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
        <div className="space-y-1.5">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a tag…"
            className="w-full text-[11px] font-mono px-2 py-1.5 rounded border border-border/60 bg-background text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40 transition-colors"
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
              Press Enter to create "{input.trim()}"
            </p>
          )}
        </div>
      )}
    </div>
  );
}
