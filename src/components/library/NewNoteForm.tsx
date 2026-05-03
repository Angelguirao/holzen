import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';
import { Plus, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { WritingField } from '@/components/WritingField';

interface Props {
  onSave: (title: string, body: string, tags: string[]) => Promise<void>;
}

export function NewNoteForm({ onSave }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) titleRef.current?.focus();
  }, [open]);

  const handleSave = async () => {
    if (!body.trim()) return;
    setSaving(true);
    await onSave(title.trim(), body.trim(), tags);
    setTitle('');
    setBody('');
    setTags([]);
    setTagInput('');
    setOpen(false);
    setSaving(false);
  };

  const addTag = (raw: string) => {
    const t = raw.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
    setTagInput('');
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
      >
        <Plus className="h-3.5 w-3.5" />
        {t('library.newNote')}
      </button>
    );
  }

  return (
    <div className="rounded-md border border-border/60 bg-card/50 p-3 space-y-2">
      <input
        ref={titleRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={t('library.noteTitlePlaceholder')}
        className="w-full text-xs font-medium bg-transparent text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
        maxLength={120}
      />
      <WritingField
        value={body}
        onChange={setBody}
        placeholder={t('library.noteBodyPlaceholder')}
        minRows={3}
        disableFocusMode
      />
      <div className="flex items-center gap-1 flex-wrap">
        {tags.map((tag) => (
          <button
            key={tag}
            onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}
            className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-muted/50 text-nox-text-link hover:bg-muted transition-colors"
          >
            {tag} <X className="h-2 w-2 inline ml-0.5" />
          </button>
        ))}
        <input
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && tagInput.trim()) { e.preventDefault(); addTag(tagInput); }
          }}
          placeholder="+ tag"
          className="text-[10px] font-mono bg-transparent text-muted-foreground placeholder:text-muted-foreground/30 focus:outline-none w-16"
        />
      </div>
      <div className="flex gap-2 justify-end">
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)} className="text-xs font-mono h-7">
          {t('common.cancel')}
        </Button>
        <LoadingButton size="sm" onClick={handleSave} loading={saving} disabled={!body.trim()} className="text-xs font-mono h-7">
          {t('library.save')}
        </LoadingButton>
      </div>
    </div>
  );
}
