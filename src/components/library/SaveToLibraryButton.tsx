import { useState, useCallback, useRef, useEffect } from 'react';
import { Bookmark, Check, X, Tag } from 'lucide-react';
import { useSaveToLibrary } from '@/hooks/use-library';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface Props {
  title?: string;
  body?: string;
  sourceType: string;
  sourceUrl?: string;
  reflectionId?: string;
  tags?: string[];
}

export function SaveToLibraryButton({ title, body, sourceType, sourceUrl, reflectionId, tags: initialTags }: Props) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const saveToLibrary = useSaveToLibrary();
  const [saved, setSaved] = useState(false);
  const [showTags, setShowTags] = useState(false);
  const [tags, setTags] = useState<string[]>(initialTags ?? []);
  const [input, setInput] = useState('');
  const [allUserTags, setAllUserTags] = useState<string[]>([]);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch user's existing tags when tag picker opens
  useEffect(() => {
    if (!showTags || !user) return;
    const fetch = async () => {
      const [{ data: refTags }, { data: libTags }] = await Promise.all([
        supabase.from('reflections').select('tags').eq('user_id', user.id),
        supabase.from('library_items').select('tags').eq('user_id', user.id),
      ]);
      const set = new Set<string>();
      refTags?.forEach((r) => (r.tags as string[])?.forEach((t: string) => set.add(t)));
      libTags?.forEach((r) => (r.tags as string[])?.forEach((t: string) => set.add(t)));
      setAllUserTags(Array.from(set).sort());
    };
    fetch();
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [showTags, user]);

  const suggestions = (() => {
    if (!input.trim()) return allUserTags.filter((t) => !tags.includes(t)).slice(0, 8);
    const q = input.toLowerCase();
    return allUserTags.filter((t) => t.toLowerCase().includes(q) && !tags.includes(t)).slice(0, 6);
  })();

  const addTag = useCallback((tag: string) => {
    const trimmed = tag.trim().toLowerCase();
    if (!trimmed || tags.includes(trimmed)) return;
    setTags((prev) => [...prev, trimmed]);
    setInput('');
    setHighlightIdx(-1);
  }, [tags]);

  const removeTag = useCallback((tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightIdx >= 0 && suggestions[highlightIdx]) addTag(suggestions[highlightIdx]);
      else if (input.trim()) addTag(input);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Escape') {
      setShowTags(false);
    }
  };

  const handleSave = useCallback(async () => {
    if (saved) return;
    const result = await saveToLibrary({
      type: 'bookmark',
      title: title || undefined,
      body: body || undefined,
      source_type: sourceType,
      source_url: sourceUrl,
      reflection_id: reflectionId,
      tags,
    });
    if (result) {
      setSaved(true);
      setShowTags(false);
      toast.success(t('library.savedToLibrary'));
    }
  }, [saved, saveToLibrary, title, body, sourceType, sourceUrl, reflectionId, tags, t]);

  const handleClick = useCallback(() => {
    if (saved) return;
    setShowTags(true);
  }, [saved]);

  return (
    <div className="space-y-2">
      <button
        onClick={handleClick}
        className="inline-flex items-center gap-0.5 text-[10px] font-mono text-muted-foreground/50 hover:text-foreground transition-colors"
        aria-label="Save to library"
      >
        {saved ? <Check className="h-2.5 w-2.5 text-primary" /> : <Bookmark className="h-2.5 w-2.5" />}
        {saved ? 'Saved' : 'Save'}
      </button>

      {showTags && !saved && (
        <div className="space-y-2 rounded-md border border-border/60 bg-background p-2.5">
          {/* Selected tags */}
          {tags.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              {tags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => removeTag(tag)}
                  className="inline-flex items-center gap-0.5 text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                  {tag}
                  <X className="h-2 w-2 text-primary/50" />
                </button>
              ))}
            </div>
          )}

          {/* Tag input */}
          <div className="flex items-center gap-1.5">
            <Tag className="h-3 w-3 text-muted-foreground/40 shrink-0" />
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => { setInput(e.target.value); setHighlightIdx(-1); }}
              onKeyDown={handleKeyDown}
              placeholder="Add tags…"
              className="flex-1 text-[11px] font-mono bg-transparent text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
            />
          </div>

          {/* Suggestions */}
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
            <p className="text-[9px] font-mono text-muted-foreground/40">
              Enter to create "{input.trim()}"
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleSave}
              className="text-[10px] font-mono px-2.5 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              Save to Library
            </button>
            <button
              onClick={() => setShowTags(false)}
              className="text-[10px] font-mono text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
